# 🤖 FinBuddy: Kişisel Finansal Yol Arkadaşı (Frontend)

**FinBuddy**, harcamaları sadece rakam olarak değil, arkasındaki duygularla birlikte analiz eden, kullanıcıyla sohbet edebilen ve finansal hedeflere ulaştıran yeni nesil bir **"Psikolojik Finans"** asistanıdır.

Bu döküman, projenin frontend mimarisini, kullanıcı deneyimi (UX) hedeflerini ve geliştirme sürecindeki görev dağılımını kapsar.

---

## 🌟 Frontend Vizyonu
> *"Finansal stres, yanlış kararların değil, farkındalık eksikliğinin sonucudur."*

FinBuddy'nin arayüzü, bu farkındalığı en basit ve samimi şekilde kullanıcıya sunmayı amaçlar. Karmaşık banka tabloları yerine, rehberlik eden bir asistan deneyimi ön plandadır.

### 🎯 Hedeflerimiz
*   **🧩 Karmaşıklığı Gidermek:** Soğuk tablolar yerine anlaşılır grafikler ve asistan desteği.
*   **🧠 Duygusal Bağ:** Harcama anındaki ruh halini (Mutlu, Üzgün, Stresli) anlamlı veriye dönüştürmek.
*   **📈 Motivasyon:** "Buddy" bildirimleri ve interaktif ilerleme barlarıyla tasarrufu teşvik etmek.

---

## 🏗️ Teknik Yapılandırma

| Teknoloji | Kullanım Amacı |
| :--- | :--- |
| **React.js / Vite** | Hızlı ve modern geliştirme ortamı |
| **Tailwind CSS** | Modern ve responsive (mobil uyumlu) tasarım |
| **Redux Toolkit** | Anlık veri akışı ve global state yönetimi |
| **Recharts** | Duygu-harcama korelasyonu analizi grafikleri |
| **Framer Motion** | Akıcı geçişler ve mikro animasyonlar |

---

## 🚀 Uygulanacak "Vurucu" Özellikler

1.  **💬 BuddyChat (AI Sohbet Arayüzü):** Kullanıcının sorularına metin ve anlık grafiklerle cevap veren akıllı ekran.
2.  **🎭 MoodCheck (Duygu Odaklı Giriş):** Harcama girilirken ruh halinin de seçildiği emoji tabanlı form.
3.  **🎯 BuddyGoals (Hedef Takip):** Hayalleri (iPhone, Tatil vb.) görselleştiren dinamik ilerleme barları.
4.  **📸 OCR Dashboard:** Fiş fotoğraflarının işlenme sürecini gösteren *Skeleton Screens* ve onay mekanizması.

---

## 📂 Dosya Yapısı (Frontend Architecture)

```plaintext
/src
  /components     # Atomik bileşenler (Buton, Input, Modal)
  /features       # Ana modüller (Chatbot, Dashboard, Analytics)
  /hooks          # API entegrasyonu ve custom logic
  /pages          # Sayfa yapıları (Giriş, Dashboard, Profil)
  /styles         # Global CSS ve Tailwind konfigürasyonu
  /assets         # Logo, ikonlar ve illüstrasyonlar
