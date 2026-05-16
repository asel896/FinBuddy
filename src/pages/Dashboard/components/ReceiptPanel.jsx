import React, { useState, useRef, useCallback } from "react";
import "./ReceiptPanel.css";
import Lottie from "react-lottie-player";
import LottieIcon from "./LottieIcon";
import animScan from "../animations/receipt.json";

// ── Kategori renk haritası ──
const CATEGORY_COLORS = {
  "Market":     "#14b8a6",
  "Yemek":      "#f59e0b",
  "İçecek":     "#8b5cf6",
  "Temizlik":   "#3b82f6",
  "Kişisel Bakım": "#ec4899",
  "Elektronik": "#06b6d4",
  "Giyim":      "#f97316",
  "Fatura":     "#ef4444",
  "Ulaşım":     "#84cc16",
  "Eğlence":    "#a855f7",
  "Sağlık":     "#22c55e",
  "Diğer":      "#6b7280",
};

// ── Gemini API çağrısı ──
const analyzeWithGemini = async (file, apiKey) => {
  // Dosyayı base64'e çevir
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const isPdf = file.type === "application/pdf";
  const mimeType = isPdf ? "application/pdf" : file.type;

  const prompt = `Bu bir market fişi, restoran fişi veya faturadır. Lütfen aşağıdaki JSON formatında analiz et:

{
  "merchant": "İşyeri/Market adı (bulunamazsa 'Bilinmiyor')",
  "date": "Tarih (bulunamazsa bugünün tarihi)",
  "items": [
    {
      "name": "Ürün/kalem adı",
      "price": 12.50,
      "category": "Kategori (Market/Yemek/İçecek/Temizlik/Kişisel Bakım/Elektronik/Giyim/Fatura/Ulaşım/Eğlence/Sağlık/Diğer)"
    }
  ],
  "total": 125.50
}

Önemli kurallar:
- Sadece JSON döndür, başka hiçbir şey yazma
- Fiyatlar sayı olsun (string değil)
- Her kalemi ayrı bir item olarak listele
- Toplam tutarı da hesapla
- Kategoriyi içeriğe göre mantıklı seç`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64 } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Gemini API hatası");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // JSON'u temizle ve parse et
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// ── Dosya boyutunu formatla ──
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ────────────────────────────────────────────────
const ReceiptPanel = ({ setExpenses }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // resimler için
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);   // Gemini sonucu
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const inputRef = useRef(null);

  // ── Dosya seçimi ──
  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowed.includes(selectedFile.type)) {
      setError({ title: "Desteklenmeyen format", msg: "JPG, PNG, WEBP veya PDF yükleyebilirsin." });
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError({ title: "Dosya çok büyük", msg: "Maksimum 20 MB yükleyebilirsin." });
      return;
    }
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setSuccess(false);

    if (selectedFile.type !== "application/pdf") {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSuccess(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Analiz ──
  const handleAnalyze = async () => {
    if (!file) return;
    if (!apiKey.trim()) {
      setError({ title: "API anahtarı gerekli", msg: "Gemini API anahtarını gir. Google AI Studio'dan ücretsiz alabilirsin." });
      return;
    }
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await analyzeWithGemini(file, apiKey.trim());
      setResult(parsed);
    } catch (err) {
      setError({ title: "Analiz başarısız", msg: err.message || "Bir hata oluştu, tekrar dene." });
    }
    setAnalyzing(false);
  };

  // ── Harcamalara ekle ──
  const handleConfirm = () => {
    if (!result?.items?.length) return;

    const newExpenses = result.items.map((item, idx) => ({
      id: Date.now() + idx,
      desc: item.name,
      amount: Math.round(item.price),
      category: item.category || "Diğer",
      date: result.date || "Az önce",
      mood: "😊",
      color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Diğer"],
      merchant: result.merchant,
    }));

    setExpenses((prev) => [...newExpenses, ...prev]);
    setSuccess(true);
    setResult(null);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const totalAmount = result?.items?.reduce((s, i) => s + (i.price || 0), 0) ?? 0;

  return (
    <div className="receipt-panel">

      {/* ── Başlık ── */}
      <div style={{ padding: "28px 28px 0" }}>
        <div className="tab-header" style={{ marginBottom: 16 }}>
          <div>
            <h2>Fiş & Fatura Analizi</h2>
            <p>Fotoğraf veya PDF yükle, kalemleri otomatik ayıralım</p>
          </div>
        </div>

        {/* ── Gemini API Key alanı ── */}
        <div style={{
          padding: "14px 16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🔑</span>
          <input
            className="db-inp"
            type={showApiKey ? "text" : "password"}
            placeholder="Gemini API anahtarını gir (AIza...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", padding: "0" }}
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            style={{
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13,
            }}
          >
            {showApiKey ? "Gizle" : "Göster"}
          </button>
        </div>
      </div>

      {/* ── Upload zone ── */}
      {!success && (
        <div
          className={`upload-zone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
          style={{ margin: "0 28px" }}
          onClick={() => !file && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <div className="upload-icon-lottie">
  <LottieIcon animationData={animScan} size={64} autoplay loop />
</div>
              <div className="upload-title">Fiş veya fatura yükle</div>
              <div className="upload-sub">Sürükle bırak ya da tıkla</div>
              <div className="upload-types">
                <span className="upload-type-pill">JPG</span>
                <span className="upload-type-pill">PNG</span>
                <span className="upload-type-pill">WEBP</span>
                <span className="upload-type-pill">PDF</span>
              </div>
              <div className="upload-sub" style={{ fontSize: 11 }}>Maks. 20 MB</div>
            </>
          ) : (
            <div className="file-preview">
              {preview ? (
                <img src={preview} alt="fiş önizleme" className="file-thumb" />
              ) : (
                <div className="file-thumb-pdf">📋</div>
              )}
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatSize(file.size)}</div>
              </div>
              <button
                className="file-remove"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              >
                Kaldır
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {/* ── Analiz butonu ── */}
      {file && !analyzing && !result && !success && (
        <div className="analyze-row">
          <button className="analyze-btn" onClick={handleAnalyze} disabled={!apiKey.trim()}>
            <span>✨</span>
            Gemini ile Analiz Et
          </button>
        </div>
      )}

      {/* ── Analiz ediliyor ── */}
      {analyzing && (
        <div className="analyzing-state" style={{ margin: "16px 28px 0" }}>
          <div className="analyzing-spinner" />
          <div className="analyzing-text">
            <strong>Analiz ediliyor...</strong>
            Gemini fişi okuyup kalemleri ayırıyor
          </div>
        </div>
      )}

      {/* ── Hata ── */}
      {error && (
        <div className="error-box">
          <strong>⚠️ {error.title}</strong>
          {error.msg}
        </div>
      )}

      {/* ── Sonuçlar ── */}
      {result && (
        <div className="results-section">
          <div className="results-header">
            <div className="results-title">📋 Analiz Sonucu</div>
            <div className="results-total">
              Toplam: <strong>{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</strong>
            </div>
          </div>

          {/* Market / işyeri özeti */}
          <div className="receipt-summary">
            <div className="receipt-summary-icon">🏪</div>
            <div className="receipt-summary-info">
              <div className="receipt-merchant">{result.merchant || "Bilinmiyor"}</div>
              <div className="receipt-date">{result.date || "Tarih yok"}</div>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              {result.items?.length} kalem
            </div>
          </div>

          {/* Kalemler */}
          <div className="receipt-items">
            {result.items?.map((item, i) => (
              <div key={i} className="receipt-item">
                <div
                  className="item-category-dot"
                  style={{ background: CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Diğer"] }}
                />
                <span className="item-name">{item.name}</span>
                <span className="item-category-badge">{item.category}</span>
                <span className="item-price">
                  -{(item.price ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                </span>
              </div>
            ))}
          </div>

          {/* Onay butonları */}
          <div className="confirm-row">
            <button className="confirm-btn primary" onClick={handleConfirm}>
              ✅ Harcamalara Ekle ({result.items?.length} kalem)
            </button>
            <button className="confirm-btn secondary" onClick={handleRemove}>
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── Başarı ── */}
      {success && (
        <div className="success-state" style={{ margin: "28px 28px 0" }}>
          <div className="success-icon">🎉</div>
          <div className="success-title">Harcamalara eklendi!</div>
          <div className="success-sub">Tüm kalemler Harcamalar sekmesine aktarıldı.</div>
          <button className="success-new-btn" onClick={() => setSuccess(false)}>
            + Yeni Fiş Analiz Et
          </button>
        </div>
      )}
    </div>
  );
};

export default ReceiptPanel;