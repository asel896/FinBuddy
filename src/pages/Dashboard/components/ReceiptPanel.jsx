import React, { useState, useRef, useCallback, useEffect } from "react";
import "./ReceiptPanel.css";
import LottieIcon from "./LottieIcon";
import animScan from "../animations/receipt.json";

// ── Kategori renk haritası ──
const CATEGORY_COLORS = {
  "Market":        "#14b8a6",
  "Yemek":         "#f59e0b",
  "İçecek":        "#8b5cf6",
  "Temizlik":      "#3b82f6",
  "Kişisel Bakım": "#ec4899",
  "Elektronik":    "#06b6d4",
  "Giyim":         "#f97316",
  "Fatura":        "#ef4444",
  "Ulaşım":        "#84cc16",
  "Eğlence":       "#a855f7",
  "Sağlık":        "#22c55e",
  "Diğer":         "#6b7280",
};

// ── Backend endpoint üzerinden Gemini API çağrısı ──
// API key burada yok — sunucuda .env içinde saklanır
const analyzeReceipt = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/analyze-receipt", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Sunucu hatası: ${response.status}`);
  }

  return await response.json(); // { merchant, date, items, total }
};

// ── Dosya boyutunu formatla ──
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Geçmiş taramaları localStorage'a kaydet / yükle ──
const HISTORY_KEY = "receipt_scan_history";

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveToHistory = (result) => {
  const history = loadHistory();
  const entry = {
    id: Date.now(),
    merchant: result.merchant || "Bilinmiyor",
    date: result.date || new Date().toLocaleDateString("tr-TR"),
    itemCount: result.items?.length || 0,
    total: result.items?.reduce((s, i) => s + (i.price || 0), 0) || 0,
    scannedAt: new Date().toLocaleString("tr-TR"),
  };
  const updated = [entry, ...history].slice(0, 20); // max 20 kayıt
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
};

// ────────────────────────────────────────────────
const ReceiptPanel = ({ setExpenses }) => {
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [analyzing, setAnalyzing]     = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(false);
  const [history, setHistory]         = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const inputRef = useRef(null);

  // Sayfa açılınca geçmişi yükle
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

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
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await analyzeReceipt(file);
      setResult(parsed);
      const updated = saveToHistory(parsed);
      setHistory(updated);
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

  // ── Geçmiş kaydı sil ──
  const handleDeleteHistory = (id) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
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
          <button className="analyze-btn" onClick={handleAnalyze}>
            <span>✨</span>
            Analiz Et
          </button>
        </div>
      )}

      {/* ── Analiz ediliyor ── */}
      {analyzing && (
        <div className="analyzing-state" style={{ margin: "16px 28px 0" }}>
          <div className="analyzing-spinner" />
          <div className="analyzing-text">
            <strong>Analiz ediliyor...</strong>
            Fiş okunuyor, kalemler ayrıştırılıyor
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

      {/* ── Geçmiş Taramalar ── */}
      <div className="history-section" style={{ margin: "28px 28px 0", paddingBottom: 28 }}>
        <div
          className="history-header"
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: showHistory ? "12px 12px 0 0" : 12,
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🕓</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
              Geçmiş Taramalar
            </span>
            {history.length > 0 && (
              <span style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 20,
                fontSize: 11,
                padding: "2px 8px",
                color: "rgba(255,255,255,0.5)",
              }}>
                {history.length}
              </span>
            )}
          </div>
          <span style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            transform: showHistory ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            display: "inline-block",
          }}>
            ▼
          </span>
        </div>

        {showHistory && (
          <div style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            overflow: "hidden",
          }}>
            {history.length === 0 ? (
              <div style={{
                padding: "28px 16px",
                textAlign: "center",
                color: "rgba(255,255,255,0.25)",
                fontSize: 13,
              }}>
                Henüz tarama yapılmadı
              </div>
            ) : (
              <>
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "8px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <button
                    onClick={handleClearHistory}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,100,100,0.5)",
                      fontSize: 12,
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    Tümünü Temizle
                  </button>
                </div>

                {history.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                      🧾
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.85)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {entry.merchant}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                        {entry.scannedAt} · {entry.itemCount} kalem
                      </div>
                    </div>

                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.6)",
                      flexShrink: 0,
                    }}>
                      {entry.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </div>

                    <button
                      onClick={() => handleDeleteHistory(entry.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.15)",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: "4px",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                      title="Sil"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ReceiptPanel;