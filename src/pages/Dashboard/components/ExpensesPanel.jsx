import React, { useState } from "react";
import "./ExpensesPanel.css";
import LottieIcon from "./LottieIcon";
import MonthlyExpensesChart from "./MonthlyExpensesChart";
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

const ExpensesPanel = ({ expenses, setExpenses }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ desc: "", amount: "", mood: "😊" });

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const addExpense = () => {
    if (!newExpense.desc || !newExpense.amount) return;
    setExpenses((prev) => [
      {
        id: Date.now(),
        desc: newExpense.desc,
        amount: parseInt(newExpense.amount),
        category: "Manuel",
        date: "Az önce",
        mood: newExpense.mood,
        color: "#14b8a6",
      },
      ...prev,
    ]);
    setNewExpense({ desc: "", amount: "", mood: "😊" });
    setShowAddExpense(false);
  };

  return (
    <div className="tab-panel">
      {/* ── Başlık ── */}
      <div className="tab-header">
        <div>
          <h2>Harcamalar</h2>
          <p>
            {expenses.length} kayıt —{" "}
            {totalSpent.toLocaleString("tr-TR")} TL toplam
          </p>
        </div>
        <button
          className="add-btn"
          onClick={() => setShowAddExpense(!showAddExpense)}
        >
          + Harcama Ekle
        </button>
      </div>

      {/* ── Aylık grafik ── */}
    <MonthlyExpensesChart expenses={expenses} />

      {/* ── Harcama ekleme formu ── */}
      {showAddExpense && (
        <div className="add-expense-form">
          <input
            className="db-inp"
            placeholder="Ne harcadın?"
            value={newExpense.desc}
            onChange={(e) =>
              setNewExpense({ ...newExpense, desc: e.target.value })
            }
          />
          <input
            className="db-inp"
            placeholder="Tutar (TL)"
            type="number"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense({ ...newExpense, amount: e.target.value })
            }
          />
          <div className="mood-row">
            <span>Nasıl hissediyorsun?</span>
            <div className="mood-picker">
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`mood-btn ${
                    newExpense.mood === m ? "selected" : ""
                  }`}
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
        {expenses.map((e) => (
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpensesPanel;