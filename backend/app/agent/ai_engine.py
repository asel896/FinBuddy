import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Gemini yapılandırması
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


SYSTEM_INSTRUCTION = """
Sen FinBuddy adında, kullanıcıya finansal tavsiyeler veren dost canlısı bir asistansın.
Görevin:
1. Kullanıcının harcamalarını analiz etmek.
2. Tasarruf hedeflerine ulaşması için motivasyon sağlamak.
3. Finansal verileri karmaşık olmayan, neşeli bir dille açıklamak.
Kısa ve öz yanıtlar ver. Emoji kullanmaktan çekinme.
"""

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=SYSTEM_INSTRUCTION
)


async def get_financial_advice(user_query: str, context: str = ""):
    if not os.getenv("GEMINI_API_KEY"):
        return "Hata: Gemini API Key tanımlanmamış. Lütfen .env dosyanızı kontrol edin."
    
    # Eğer context boşsa kullanıcıya bilgi verelim
    if not context:
        context = "Henüz kaydedilmiş bir harcama bulunmuyor."
        
    prompt = f"Kullanıcı Sorusu: {user_query}\n\nFinansal Durum Özeti: {context}"
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI Motoru Hatası: {str(e)}"