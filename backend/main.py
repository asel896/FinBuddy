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
import os
import google.generativeai as genai

# --- 1. AI YAPILANDIRMASI ---
# BURAYI KONTROL ET: API Key tırnak içinde olmalı!
genai.configure(api_key="AIzaSyA747iA9oMD4FYIebxlgiurU-TOabuhrMQ") 

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

# --- 2. APP TANIMI (TEK SEFER) ---
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

# --- 3. VERİ MODELLERİ ---
class BudgetStatus(BaseModel):
    limit: float
    spent: float

# --- 4. ENDPOINTLER ---

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

@app.post("/transactions", tags=["Finance"])
def create_transaction(amount: float, category: str, description: str, db: Session = Depends(get_db)):
    new_item = models.Transaction(amount=amount, category=category, description=description, type="expense")
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"message": "Harcama kaydedildi!", "data": new_item}

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
            # HATAYI GÖRMEK İÇİN BURAYI DEĞİŞTİRDİM
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