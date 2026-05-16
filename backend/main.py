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
from pydantic import BaseModel, EmailStr
import google.generativeai as genai
import os
import json
from fastapi.responses import StreamingResponse
import jwt
from datetime import datetime, timedelta, timezone
import bcrypt  
from fastapi.security import OAuth2PasswordBearer



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI(
    title="FinBuddy API",
    description="Yapay Zeka Destekli Kişisel Finans Asistanı",
    version="1.0.0"
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = FastAPI.openapi(app)
    
    # OpenAPI şemasına güvenlik türünü ekliyoruz
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "apiKey",
            "in": "header",
            "name": "Authorization",
            "description": "Kopyaladığın tokenı buraya yapıştır. Örn: Bearer <token>"
        }
    }
    
    
    # Giriş gerektiren korumalı endpoint'lerin listesi
    #############
    # OpenAPI şemasına güvenlik türünü ekliyoruz
    #openapi_schema["components"]["securitySchemes"] = {
    #    "OAuth2PasswordBearer": {
    #        "type": "oauth2",
    #        "flows": {
    #            "password": {
    #                "tokenUrl": "auth/login",
    #                "scopes": {}
    #            }
    #        }
    #    }
    #}
    
    #######
    secured_routes = [
        "/transactions/mood", "/transactions/smart-add", "/ask",
        "/analysis/weekly", "/analysis/forecast", "/analysis/chart-data",
        "/check-budget/", "/transactions/upload-csv", "/transactions/export-csv"
    ]
    
   
    for path, methods in openapi_schema.get("paths", {}).items():
        if path in secured_routes:
            for method in methods:
                openapi_schema["paths"][path][method]["security"] = [{"OAuth2PasswordBearer": []}]
                
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi


SECRET_KEY = "SUPER_SECRET_KEY_BURAYI_DEGISTIR" 
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# PYDANTIC ŞEMALARI
class UserRegister(BaseModel):
    username: str  # Ad Soyad
    email: EmailStr # E-posta
    password: str   # Şifre

class UserLogin(BaseModel):
    email: EmailStr 
    password: str

class BudgetStatus(BaseModel):
    limit: float
    spent: float

# GEMINI YAPAY ZEKA AYARLARI 
genai.configure(api_key=os.getenv("GEMINI_API_KEY")) 

generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=generation_config,
)


@app.on_event("startup")
def startup_event():
    """Uygulama başlarken tabloları güvenli ve asenkron olarak oluşturur."""
    for i in range(5):
        try:
            models.Base.metadata.create_all(bind=engine)
            print("Veritabanı bağlantısı ve tablolar başarıyla hazırlandı!")
            break
        except Exception as e:
            print(f"Veritabanı henüz hazır değil, bekleniyor... (Deneme {i+1}/5) Hata: {e}")
            time.sleep(2)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# KAYIT VE GİRİŞ

@app.post("/auth/register", tags=["Auth"])
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")

        raw_password = str(user_data.password)
        hashed_pw = hash_password(raw_password)
            
        new_user = models.User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_pw
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"status": "ok", "message": "Kayıt başarılı! Mürettebata katıldınız."}
    
    except Exception as e:
        print("\n" + "="*50)
        print(f"KAYIT SIRASINDA PATLAYAN GERÇEK HATA: {str(e)}")
        print("="*50 + "\n")
        raise HTTPException(status_code=500, detail=f"Sistem Hatası: {str(e)}")



@app.post("/auth/login", tags=["Auth"])
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")
    
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    token_data = {"sub": user.email, "user_id": user.id, "exp": expire}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "status": "ok",
        "access_token": token,
        "token_type": "bearer",
        "username": user.username
    }



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
        "ai_engine": "Gemini-2.5-Flash Ready",
        "database_connection": "successful"
    }



@app.post("/transactions/mood", tags=["Finance"])
async def create_mood_transaction(
    amount: float, 
    description: str, 
    mood: str, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # JWT Token çözülerek harcamayı yapan kullanıcı tespit ediliyor
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user_email = payload.get("sub")
        user = db.query(models.User).filter(models.User.email == current_user_email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")

    prompt_cat = f"'{description}' harcaması için sadece tek kelimelik bir kategori söyle (Örn: Gıda, Ulaşım, Eğlence)."
    cat_response = model.generate_content(prompt_cat)
    category = cat_response.text.strip().replace("*", "")

    
    new_item = models.Transaction(
        amount=amount, 
        category=category, 
        description=description, 
        mood=mood, 
        type="expense",
        user_id=user.id
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
async def smart_add_transaction(
    text: str = Body(..., embed=True), 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        # Kullanıcı Doğrulama
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user_email = payload.get("sub")
            user = db.query(models.User).filter(models.User.email == current_user_email).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found.")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token.")

        # Prompt Hazırlama
        prompt = (
            f"Extract financial data from this text: '{text}'\n"
            f"Return ONLY a valid JSON object matching this schema: "
            f"{{\"amount\": float, \"description\": str, \"category\": str, \"mood\": str}}\n"
            f"RULES:\n"
            f"1. Category MUST be a single word (e.g., Gida, Ulasim, Eglence, Genel).\n"
            f"2. Do not include any markdown formatting like ```json.\n"
            f"3. Do not add any extra explanations."
        )
        
        response = model.generate_content(prompt)
        res_text = response.text.strip()
        
        if "```" in res_text:
            res_text = res_text.split("```")[1]
            if res_text.startswith("json"):
                res_text = res_text[4:]
        
        data = json.loads(res_text.strip())

        # Veritabanına Kaydetme
        new_item = models.Transaction(
            amount=data.get("amount", 0),
            description=data.get("description", "Bilinmeyen"),
            category=data.get("category", "Genel"),
            mood=data.get("mood", "Notr"),
            type="expense",
            user_id=user.id
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        return {
            "status": "Zekice anlasildi!",
            "extracted_values": data,
            "database_id": new_item.id
        }
        
    except Exception:
        return {
            "error": "AI Processing Error", 
            "details": "Yapay zeka veya veritabanı aşamasında bir hata oluştu. Ancak Windows charmap hatası tamamen bypass edildi!"
        }


@app.post("/ask", tags=["AI"])
async def ask_ai(
    prompt: str = Body(..., embed=True), 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    history = db.query(models.Transaction).limit(5).all()
    context = "\n".join([f"{t.category}: {t.amount} TL ({t.description})" for t in history])
    response = await get_financial_advice(user_query=prompt, context=context)
    return {"reply": response}

@app.get("/analysis/weekly", tags=["AI"])
async def get_weekly_analysis(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    transactions = db.query(models.Transaction).all()
    if not transactions:
        return {"message": "Henüz analiz edecek veri yok."}
    data_summary = "\n".join([f"- {t.category}: {t.amount} TL ({t.description})" for t in transactions])
    prompt = (
        f"Aşağıdaki harcamaları analiz et ve sivri dilli, esprili bir paragraf yaz:\n{data_summary}"
    )
    try:
        response = model.generate_content(prompt)
        analysis = response.text
    except Exception as e:
        analysis = "Analiz motoru şu an meşgul."
    return {"summary_data": data_summary, "ai_critique": analysis}

@app.get("/analysis/forecast", tags=["AI"])
async def get_spending_forecast(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    transactions = db.query(models.Transaction).all()
    if len(transactions) < 3:
        return {"message": "Tahmin için en az 3 kayıt lazım."}
    
    data_summary = "\n".join([f"{t.amount} TL - {t.category}" for t in transactions])
    
    prompt = (
        f"Aşağıdaki harcamalara göre esprili bir ay sonu tahmini yap:\n{data_summary}\n\n"
        "Talimat: Sadece 2 cümle yaz ve mutlaka cümleni bitir."
    )

    try:
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        response = model.generate_content(prompt, safety_settings=safety_settings)
        
        if not response.text:
            return {"error": "AI cevap üretemedi, filtreye takılmış olabilir."}
            
        return {"ai_forecast": response.text.strip()}
        
    except Exception as e:
        return {"error": "Teknik Hata", "details": str(e)}

@app.get("/analysis/chart-data", tags=["Finance"])
async def get_chart_data(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    transactions = db.query(models.Transaction).all()
    chart_dict = {}
    for t in transactions:
        category = t.category if t.category else "Diğer"
        chart_dict[category] = chart_dict.get(category, 0) + t.amount
    formatted_data = [{"category": k, "total": v} for k, v in chart_dict.items()]
    return {"chart_data": formatted_data, "total_expense": sum(chart_dict.values())}

@app.post("/check-budget/", tags=["AI"])
async def check_budget(status: BudgetStatus, token: str = Depends(oauth2_scheme)):
    """Bütçe limitini kontrol eder ve AI tavsiyesi verir."""
    if status.spent > status.limit:
        excess = status.spent - status.limit
        prompt = (
            f"Kullanıcı bütçesini {excess} TL aşmış. "
            f"Toplam harcaması {status.spent} TL. "
            f"Kısa ve esprili bir finansal tavsiye ver."
        )
        try:
            response = model.generate_content(prompt)
            ai_advice = response.text
        except:
            ai_advice = "Harca harca, nereye kadar?"

        return {
            "alert": "Limit Aşıldı!",
            "excess": excess,
            "ai_advice": ai_advice
        }
    return {"status": "Güvenli", "message": "Bütçen hala güvende."}

# DATA DOSYALARI ENDPOINT'LERİ (CSV INPUT/OUTPUT) 

@app.post("/transactions/upload-csv", tags=["Finance"])
async def upload_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Swagger üzerinden harcamaları toplu olarak CSV formatında yükler."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Sadece CSV dosyaları desteklenir.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        required_columns = ["amount", "category", "description", "mood"]
        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Eksik sütun: {col}")
        
        added_count = 0
        for _, row in df.iterrows():
            new_item = models.Transaction(
                amount=float(row["amount"]),
                category=str(row["category"]),
                description=str(row["description"]),
                mood=str(row["mood"]),
                type="expense"
            )
            db.add(new_item)
            added_count += 1
            
        db.commit()
        return {"status": "Başarılı", "message": f"{added_count} adet harcama toplu olarak eklendi."}
    except Exception as e:
        return {"error": "CSV Okuma Hatası", "details": str(e)}

@app.get("/transactions/export-csv", tags=["Finance"])
async def export_csv(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """Veritabanındaki tüm harcamaları tek tıkla CSV olarak indirir."""
    transactions = db.query(models.Transaction).all()
    if not transactions:
        raise HTTPException(status_code=404, detail="Dışa aktarılacak harcama bulunamadı.")
    
    data = []
    for t in transactions:
        data.append({
            "id": t.id,
            "amount": t.amount,
            "category": t.category,
            "description": t.description,
            "mood": t.mood
        })
    
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=finbuddy_harcamalar.csv"
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)