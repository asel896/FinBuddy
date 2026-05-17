import React, { useState, useMemo } from "react";
import "./ExpensesPanel.css";
import LottieIcon from "./LottieIcon";

import animSmile from "../animations/smile.json";
import animNeutral from "../animations/neutral.json";
import animCry from "../animations/cry.json";
import animAngry from "../animations/angry.json";
import animSad from "../animations/sad.json";
import animAmazing from "../animations/amazing.json";

const MOOD_ANIM = {
  "😊": animSmile,
  "😴": animNeutral,
  "😐": animCry,
  "😤": animAngry,
  "😢": animSad,
  "🤩": animAmazing,
};

const MOODS = ["😊", "😴", "😐", "😤", "😢", "🤩"];

const SORT_OPTIONS = [
  { value: "date_desc",   label: "En Yeni" },
  { value: "date_asc",    label: "En Eski" },
  { value: "amount_desc", label: "En Yüksek" },
  { value: "amount_asc",  label: "En Düşük" },
];

const DATE_OPTIONS = [
  { value: "all",   label: "Tümü" },
  { value: "today", label: "Bugün" },
  { value: "week",  label: "Bu Hafta" },
  { value: "month", label: "Bu Ay" },
];

const ExpensesPanel = ({ expenses, setExpenses }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ desc: "", amount: "", mood: "😊" });

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMood,     setFilterMood]     = useState("all");
  const [filterDate,     setFilterDate]     = useState("all");
  const [sortBy,         setSortBy]         = useState("date_desc");
  const [showFilters,    setShowFilters]    = useState(false);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const categories = useMemo(() => {
    const cats = [...new Set(expenses.map((e) => e.category))];
    return cats;
  }, [expenses]);

  const filtered = useMemo(() => {
    let list = [...expenses];

    if (filterCategory !== "all") {
      list = list.filter((e) => e.category === filterCategory);
    }

    if (filterMood !== "all") {
      list = list.filter((e) => e.mood === filterMood);
    }

    if (filterDate !== "all") {
      const now = new Date();
      list = list.filter((e) => {
        const date = new Date(e.date);
        if (isNaN(date)) return true;
        if (filterDate === "today") {
          return date.toDateString() === now.toDateString();
        }
        if (filterDate === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return date >= weekAgo;
        }
        if (filterDate === "month") {
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    list.sort((a, b) => {
      if (sortBy === "amount_desc") return b.amount - a.amount;
      if (sortBy === "amount_asc")  return a.amount - b.amount;
      if (sortBy === "date_asc")    return new Date(a.date) - new Date(b.date);
      return new Date(b.date) - new Date(a.date);
    });

    return list;
  }, [expenses, filterCategory, filterMood, filterDate, sortBy]);

  const activeFilterCount = [
    filterCategory !== "all",
    filterMood !== "all",
    filterDate !== "all",
    sortBy !== "date_desc",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory("all");
    setFilterMood("all");
    setFilterDate("all");
    setSortBy("date_desc");
  };

  const addExpense = () => {
    if (!newExpense.desc || !newExpense.amount) return;
    setExpenses((prev) => [
      {
        id: Date.now(),
        desc: newExpense.desc,
        amount: parseInt(newExpense.amount),
        category: "Manuel",
        date: new Date().toISOString().slice(0, 10),
        mood: newExpense.mood,
        color: "#14b8a6",
      },
      ...prev,
    ]);
    setNewExpense({ desc: "", amount: "", mood: "😊" });
    setShowAddExpense(false);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="tab-panel">
      {/* ── Başlık ── */}
      <div className="tab-header">
        <div>
          <h2>Harcamalar</h2>
          <p>
            {filtered.length} kayıt —{" "}
            <span className="total-badge">
              {filtered.reduce((s, e) => s + e.amount, 0).toLocaleString("tr-TR")} TL
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filtrele {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button
            className="add-btn"
            onClick={() => setShowAddExpense(!showAddExpense)}
          >
            + Ekle
          </button>
        </div>
      </div>

      {/* ── Filtre paneli ── */}
      {showFilters && (
        <div className="filter-panel">

          {/* Kategori */}
          <div className="filter-group">
            <span className="filter-label">Kategori</span>
            <div className="filter-pills">
              <button
                className={`filter-pill ${filterCategory === "all" ? "active" : ""}`}
                onClick={() => setFilterCategory("all")}
              >
                Tümü
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-pill ${filterCategory === cat ? "active" : ""}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tarih */}
          <div className="filter-group">
            <span className="filter-label">Tarih</span>
            <div className="filter-pills">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-pill ${filterDate === opt.value ? "active" : ""}`}
                  onClick={() => setFilterDate(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sıralama */}
          <div className="filter-group">
            <span className="filter-label">Sıralama</span>
            <div className="filter-pills">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-pill ${sortBy === opt.value ? "active" : ""}`}
                  onClick={() => setSortBy(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duygu */}
          <div className="filter-group">
            <span className="filter-label">Duygu</span>
            <div className="filter-pills">
              <button
                className={`filter-pill ${filterMood === "all" ? "active" : ""}`}
                onClick={() => setFilterMood("all")}
              >
                Tümü
              </button>
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`filter-pill ${filterMood === m ? "active" : ""}`}
                  onClick={() => setFilterMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button className="filter-clear-btn" onClick={clearFilters}>
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* ── Harcama ekleme formu ── */}
      {showAddExpense && (
        <div className="add-expense-form">
          <input
            className="db-inp"
            placeholder="Ne harcadın?"
            value={newExpense.desc}
            onChange={(e) => setNewExpense({ ...newExpense, desc: e.target.value })}
          />
          <input
            className="db-inp"
            placeholder="Tutar (TL)"
            type="number"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          />
          <div className="mood-row">
            <span>Nasıl hissediyorsun?</span>
            <div className="mood-picker">
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`mood-btn ${newExpense.mood === m ? "selected" : ""}`}
                  onClick={() => setNewExpense({ ...newExpense, mood: m })}
                  title={m}
                >
                  <LottieIcon
                    animationData={MOOD_ANIM[m] || animSmile}
                    size={30}
                    autoplay={newExpense.mood === m}
                  />
                </button>
              ))}
            </div>
          </div>
          <button className="add-btn" onClick={addExpense}>
            Kaydet
          </button>
        </div>
      )}

      {/* ── Harcama listesi ── */}
      <div className="expense-list">
        {filtered.length === 0 ? (
          <div className="expense-empty">
            <p>🐙 Sonuç bulunamadı!</p>
            <p>Farklı filtreler deneyin.</p>
          </div>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className="expense-card">
              <div className="expense-dot" style={{ background: e.color }} />
              <div className="expense-info">
                <span className="expense-desc">{e.desc}</span>
                <span className="expense-meta">
                  {e.category} — {e.date}
                </span>
              </div>
              <LottieIcon
                animationData={MOOD_ANIM[e.mood] || animSmile}
                size={28}
                className="expense-mood-lottie"
              />
              <span className="expense-amount">
                -{e.amount.toLocaleString("tr-TR")} TL
              </span>
              <button
                className="expense-delete"
                onClick={() => deleteExpense(e.id)}
                title="Sil"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpensesPanel;