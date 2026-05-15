from fastapi import FastAPI, Body, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal, get_db
import app.models.models as models
import time
from sqlalchemy.exc import OperationalError
from app.agent.ai_engine import get_financial_advice 
from sqlalchemy.orm import Session
import io
import pandas as pd
from typing import Optional
from pydantic import BaseModel
import google.generativeai as genai
import os
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY")) 

generation_config = {
    "temperature": 0.8,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

app = FastAPI(
    title="FinBuddy API",
    description="Yapay Zeka Destekli Kişisel Finans Asistanı",
    version="1.0.0"
)

for i in range(5):
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Veritabanı bağlantısı başarılı!")
        break
    except OperationalError:
        print(f"Veritabanı hazır değil... Bekleniyor (Deneme {i+1}/5)")
        time.sleep(2)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BudgetStatus(BaseModel):
    limit: float
    spent: float

@app.get("/", tags=["General"])
async def welcome():
    return {
        "message": "FinBuddy: Akıllı Finans Asistanına Hoş Geldiniz!",
        "status": "online",
        "features": ["Expense Tracking", "AI Insights", "Savings Goals"]
    }

@app.get("/system/status", tags=["System"])
async def system_status():
    return {
        "api_status": "healthy",
        "ai_engine": "Gemini-1.5-Flash Ready",
        "database_connection": "successful"
    }

@app.post("/transactions/mood", tags=["Finance"])
async def create_mood_transaction(
    amount: float, 
    description: str, 
    mood: str, 
    db: Session = Depends(get_db)
):
    prompt_cat = f"'{description}' harcaması için sadece tek kelimelik bir kategori söyle."
    cat_response = model.generate_content(prompt_cat)
    category = cat_response.text.strip().replace("*", "")

    new_item = models.Transaction(
        amount=amount, 
        category=category, 
        description=description, 
        mood=mood, 
        type="expense"
    )

    prompt_mood = (
        f"Kullanıcı '{mood}' bir ruh haliyle '{description}' için {amount} TL harcadı. "
        "Buna çok kısa, esprili bir finansal tepki ver."
    )
    ai_comment = model.generate_content(prompt_mood).text

    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {
        "message": "Duygusal harcaman kaydedildi!",
        "ai_mood_comment": ai_comment,
        "data": new_item
    }

@app.post("/transactions/smart-add", tags=["AI"])
async def smart_add_transaction(text: str = Body(..., embed=True), db: Session = Depends(get_db)):
    prompt = (
        f"Extract financial data from this sentence and return ONLY a JSON object. "
        f"Sentence: '{text}' \n"
        f"Format: {{\"amount\": float, \"description\": str, \"category\": str, \"mood\": str}} \n"
        f"Constraint: Category must be a single word. No markdown, no backticks."
    )

    try:
        response = model.generate_content(prompt)
        res_text = response.text.strip()
        
        if "```" in res_text:
            res_text = res_text.split("```")[1]
            if res_text.startswith("json"):
                res_text = res_text[4:]
        
        data = json.loads(res_text.strip())

        new_item = models.Transaction(
            amount=data.get("amount", 0),
            description=data.get("description", "Bilinmeyen"),
            category=data.get("category", "Genel"),
            mood=data.get("mood", "Nötr"),
            type="expense"
        )
        
        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return {
            "status": "Zekice anlaşıldı!",
            "extracted_values": data,
            "database_id": new_item.id
        }
    except Exception as e:
        return {
            "error": "JSON Ayrıştırma Hatası",
            "ai_raw": response.text if 'response' in locals() else str(e)
        }

@app.post("/ask", tags=["AI"])
async def ask_ai(prompt: str = Body(..., embed=True), db: Session = Depends(get_db)):
    history = db.query(models.Transaction).limit(5).all()
    context = "\n".join([f"{t.category}: {t.amount} TL ({t.description})" for t in history])
    response = await get_financial_advice(user_query=prompt, context=context)
    return {"reply": response}

@app.post("/goals", tags=["Finance"])
def create_goal(name: str, target_amount: float, db: Session = Depends(get_db)):
    new_goal = models.Goal(name=name, target_amount=target_amount, current_amount=0.0)
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return {"message": "Hedef oluşturuldu!", "data": new_goal}

@app.get("/summary", tags=["Finance"])
def get_summary(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    goals = db.query(models.Goal).all()
    total_spent = sum(t.amount for t in transactions)
    return {
        "total_spent": total_spent,
        "transaction_count": len(transactions),
        "active_goals": goals
    }

@app.post("/upload-csv/", tags=["Finance"])
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Sadece CSV dosyaları kabul edilir.")
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        if 'category' not in df.columns or 'amount' not in df.columns:
            return {"error": "CSV 'category' ve 'amount' sütunlarını içermelidir."}
        summary = df.groupby('category')['amount'].sum().to_dict()
        return {"filename": file.filename, "category_totals": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-budget/", tags=["AI"])
async def check_budget(status: BudgetStatus):
    if status.spent > status.limit:
        excess = status.spent - status.limit
        prompt = (
            f"Sen sivri dilli, esprili ve zeki bir finance danışmanısın. "
            f"Kullanıcı bütçesini {excess} TL aşmış. Toplam harcaması {status.spent} TL. "
            "Kısa ve komik bir tavsiye ver."
        )
        try:
            response = model.generate_content(prompt)
            ai_advice = response.text if response.text else "AI bir cevap üretemedi."
        except Exception as e:
            ai_advice = f"TEKNİK HATA: {str(e)}"

        return {
            "alert": "Bütçe Sınırı Aşıldı!",
            "excess_amount": excess,
            "ai_advice": ai_advice
        }
    return {"status": "Güvenli", "message": "Tebrikler! Bütçen henüz güvende."}

@app.get("/analysis/weekly", tags=["AI"])
async def get_weekly_analysis(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    if not transactions:
        return {"message": "Henüz analiz edecek veri yok."}
    data_summary = "\n".join([f"- {t.category}: {t.amount} TL ({t.description})" for t in transactions])
    prompt = (
        f"Aşağıda bir kullanıcının harcama listesi var:\n{data_summary}\n\n"
        "Sen sivri dilli bir finans danışmanısın. Analiz et ve iğneleyici bir paragraf yaz."
    )
    try:
        response = model.generate_content(prompt)
        analysis = response.text
    except Exception as e:
        analysis = "Analiz motoru şu an meşgul."
    return {
        "summary_data": data_summary,
        "ai_critique": analysis
    }

@app.get("/coach/advice", tags=["AI"])
async def get_coaching_advice(db: Session = Depends(get_db)):
    goals = db.query(models.Goal).all()
    transactions = db.query(models.Transaction).all()
    if not goals:
        return {"message": "Henüz bir tasarruf hedefin yok."}
    total_spent = sum(t.amount for t in transactions)
    goal_summary = "\n".join([f"- {g.name}: Hedef {g.target_amount} TL, Şu an {g.current_amount} TL" for g in goals])
    prompt = (
        f"Hedefler:\n{goal_summary}\nToplam Harcama: {total_spent} TL.\n"
        "Sivri dilli bir koç gibi sert bir tavsiye ver."
    )
    try:
        response = model.generate_content(prompt)
        advice = response.text
    except:
        advice = "Koç şu an molada."
    return {
        "status": "Koç Analizi Hazır",
        "coaching_advice": advice
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)