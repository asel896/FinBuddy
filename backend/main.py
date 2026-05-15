from fastapi import FastAPI, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal, get_db
import app.models.models as models
import time
from sqlalchemy.exc import OperationalError
from app.agent.ai_engine import get_financial_advice 
from sqlalchemy.orm import Session


models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="FinBuddy API", version="1.0.0")

# Veritabanı Tablo Oluşturma Döngüsü
for i in range(5):
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Veritabanı bağlantısı başarılı!")
        break
    except OperationalError:
        print(f"Veritabanı henüz hazır değil... Bekleniyor (Deneme {i+1}/5)")
        time.sleep(2)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FinBuddy AI Online!"}

# --- AI SOHBET ENDPOINT'I ---
@app.post("/ask", tags=["AI"])
async def ask_ai(prompt: str = Body(..., embed=True)):
    """
    Kullanıcıdan gelen finansal soruyu AI motoruna iletir.
    """
    # Şimdilik context boş, ileride veritabanı verilerini buraya basacağız
    response = await get_financial_advice(user_query=prompt, context="Henüz veri girişi yapılmadı.")
    return {"reply": response}



app = FastAPI(
    title="FinBuddy API",
    description="Yapay Zeka Destekli Kişisel Finans Asistanı",
    version="1.0.0"
)

# Frontend entegrasyonu için CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
async def welcome():
    """FinBuddy karşılama mesajı."""
    return {
        "message": "FinBuddy: Akıllı Finans Asistanına Hoş Geldiniz!",
        "status": "online",
        "features": ["Expense Tracking", "AI Insights", "Savings Goals"]
    }

@app.get("/system/status", tags=["System"])
async def system_status():
    """Sistemin genel sağlık durumunu kontrol eder."""
    return {
        "api_status": "healthy",
        "ai_engine": "Gemini-1.5-Pro Ready",
        "database_connection": "waiting_for_setup"
    }

# Gelecek adımlarda buraya işlemleri (Transactions) ekleyeceğimiz endpointleri yazacağız.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)



# --- HARCAMA EKLEME (DATABASE) ---
@app.post("/transactions", tags=["Finance"])
def create_transaction(amount: float, category: str, description: str, db: Session = Depends(get_db)):
    new_item = models.Transaction(amount=amount, category=category, description=description, type="expense")
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"message": "Harcama kaydedildi!", "data": new_item}

# --- AI SORGULAMA ---
@app.post("/ask", tags=["AI"])
async def ask_ai(prompt: str = Body(..., embed=True), db: Session = Depends(get_db)):
    # Veritabanından son harcamaları çek ki Gemini ne olduğunu bilsin
    history = db.query(models.Transaction).limit(5).all()
    context = "\n".join([f"{t.category}: {t.amount} TL ({t.description})" for t in history])
    
    response = await get_financial_advice(user_query=prompt, context=context)
    return {"reply": response}


# --- TASARRUF HEDEFİ EKLEME ---
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




