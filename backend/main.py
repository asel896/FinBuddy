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

genai.configure(api_key=os.getenv("GEMINI_API_KEY")) 

generation_config = {
    "temperature": 0.8,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}


model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=generation_config,
)

# APP TANIMI 
app = FastAPI(
    title="FinBuddy API",
    description="Yapay Zeka Destekli Kişisel Finans Asistanı",
    version="1.0.0"
)

# Veritabanı Tablo Oluşturma
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

# VERİ MODELLERİ 
class BudgetStatus(BaseModel):
    limit: float
    spent: float

# ENDPOINTLER 

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
    mood: str, # Kullanıcıdan "Mutlu", "Üzgün" gibi bir bilgi alıyoruz
    db: Session = Depends(get_db)
):
    # Gemini kategoriyi tahmin etsin
    prompt_cat = f"'{description}' harcaması için tek kelimelik bir kategori söyle."
    category = model.generate_content(prompt_cat).text.strip()

    # Yeni harcamayı mood ile birlikte kaydediyoruz
    new_item = models.Transaction(
        amount=amount, 
        category=category, 
        description=description, 
        mood=mood, 
        type="expense"
    )

    # Gemini'den ruh haline göre iğneleyici bir yorum alalım
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
            f"Sen sivri dilli, esprili ve zeki bir finans danışmanısın. "
            f"Kullanıcı bütçesini tam {excess} TL aşmış. Toplam harcaması {status.spent} TL. "
            "Ona bu durumu iğneleyici, çok kısa ve komik bir şekilde anlatan tek cümlelik bir tavsiye ver."
        )
        try:
            response = model.generate_content(prompt)
            # Eğer Gemini'den boş veya hatalı yanıt gelirse diye kontrol
            ai_advice = response.text if response.text else "AI bir cevap üretemedi."
        except Exception as e:
            ai_advice = f"TEKNİK HATA: {str(e)}"

        return {
            "alert": "Bütçe Sınırı Aşıldı!",
            "excess_amount": excess,
            "ai_advice": ai_advice
        }
    return {"status": "Güvenli", "message": "Tebrikler! Bütçen henüz güvende."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/analysis/weekly", tags=["AI"])
async def get_weekly_analysis(db: Session = Depends(get_db)):
    # Veritabanındaki tüm harcamaları çekiyoruz
    transactions = db.query(models.Transaction).all()
    
    if not transactions:
        return {"message": "Henüz analiz edecek veri yok."}

    # Gemini'ye göndermek için veriyi metne döküyoruz
    data_summary = "\n".join([f"- {t.category}: {t.amount} TL ({t.description})" for t in transactions])
    
    prompt = (
        f"Aşağıda bir kullanıcının harcama listesi var:\n{data_summary}\n\n"
        "Sen sivri dilli bir finans danışmanısın. Bu harcamaları analiz et. "
        "Hangi kategoride aşırıya kaçılmış? Nereden tasarruf edebilir? "
        "Kısa, iğneleyici ve esprili bir paragraf yaz."
    )

    try:
        response = model.generate_content(prompt)
        analysis = response.text
    except Exception as e:
        analysis = "Analiz motoru şu an meşgul, sonra gel."

    return {
        "summary_data": data_summary,
        "ai_critique": analysis
    }

@app.get("/coach/advice", tags=["AI"])
async def get_coaching_advice(db: Session = Depends(get_db)):
    # Veritabanından hedefleri ve harcamaları çek
    goals = db.query(models.Goal).all()
    transactions = db.query(models.Transaction).all()
    
    if not goals:
        return {"message": "Henüz bir tasarruf hedefin yok. Önce bir hedef belirle!"}

    total_spent = sum(t.amount for t in transactions)
    goal_summary = "\n".join([f"- {g.name}: Hedef {g.target_amount} TL, Şu an {g.current_amount} TL" for g in goals])

    prompt = (
        f"Kullanıcının tasarruf hedefleri şunlar:\n{goal_summary}\n"
        f"Şu ana kadar toplam harcaması: {total_spent} TL.\n"
        "Sen bilgili ama sivri dilli bir finans koçusun. Kullanıcıya hedeflerine ulaşması için "
        "gerçekçi ama sert bir tavsiye ver. Hangi gereksiz harcamadan kaçınmalı? "
        "Tahminen ne kadar sürede hedefine ulaşır? (Kısa ve öz olsun)"
    )

    try:
        response = model.generate_content(prompt)
        advice = response.text
    except:
        advice = "Koç şu an molada, az sonra gel."

    return {
        "status": "Koç Analizi Hazır",
        "coaching_advice": advice
    }