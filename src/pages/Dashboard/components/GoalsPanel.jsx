import React, { useState } from "react";
import "./GoalsPanel.css";
import LottieIcon from "./LottieIcon"; 
import animOctopus from "../animations/octopus1.json";
import animTarget  from "../animations/target.json";
import animMoney   from "../animations/money.json";

const COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6"];

const INITIAL_GOALS = [
  {
    id: 1,
    name: "iPhone Almak",
    current: 10800,
    target: 15000,
    color: "#14b8a6",
    animationData: animTarget,
    insight: (
      <>
        Bu tempoda <strong>6 hafta</strong> içinde hedefe ulaşırsın. Bu hafta 3 kahveyi ev
        kahvesiyle değiştirsen <strong>255 TL</strong> tasarruf edersin!
      </>
    ),
  },
  {
    id: 2,
    name: "Yaz Tatili",
    current: 3200,
    target: 8000,
    color: "#8b5cf6",
    animationData: animMoney,
    insight: (
      <>
        Hafta sonu dışarıda yemek yerine evde yersen ayda <strong>1.200 TL</strong> biriktirirsin.
      </>
    ),
  },
];

const GoalsPanel = () => {
  const [goals, setGoals]     = useState(INITIAL_GOALS);
  const [name, setName]       = useState("");
  const [target, setTarget]   = useState("");
  const [current, setCurrent] = useState("");
  const [color, setColor]     = useState("#14b8a6");
  const [submitted, setSubmitted] = useState(false);

  const progress =
    target && current
      ? Math.min(100, Math.round((parseFloat(current) / parseFloat(target)) * 100))
      : 0;

  const handleAdd = () => {
    if (!name.trim() || !target) return;
    setGoals((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: name.trim(),
        current: parseFloat(current) || 0,
        target: parseFloat(target),
        color,
        animationData: animTarget,
        insight: null,
      },
    ]);
    setName("");
    setTarget("");
    setCurrent("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <div>
          <h2>Hedefler</h2>
          <p>Finansal hedeflerini takip et</p>
        </div>
      </div>

      {/* ── Hedef Ekleme — goal-card ile aynı kutu ── */}
      <div className="goal-card">

        {/* Başlık — goal-header ile aynı yapı */}
        <div className="goal-header">
          <LottieIcon animationData={animTarget} size={38} />
          <div>
            <div className="goal-name">Yeni Hedef Ekle</div>
            <div className="goal-sub">Kendi hedefini tanımla, çubuk otomatik dolsun</div>
          </div>
        </div>

        {/* Inputlar */}
        <input
          className="goal-input"
          placeholder="Hedef adı  (örn: Tatil fonu)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="goal-input-row">
          <input
            className="goal-input"
            type="number"
            placeholder="Hedef tutar (TL)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <input
            className="goal-input"
            type="number"
            placeholder="Mevcut (TL)"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>

        {/* Renk seçici */}
        <div className="goal-color-row">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`goal-color-dot ${color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        {/* Canlı progress bar önizlemesi */}
        {(name || target) && (
          <>
            <div className="goal-bar" style={{ marginTop: 12 }}>
              <div
                className="goal-fill"
                style={{ width: `${progress}%`, background: color }}
              />
            </div>
            <div className="goal-insight" style={{ marginBottom: 0 }}>
              <span className="goal-octo-wrap">
                <LottieIcon animationData={animOctopus} size={22} />
              </span>
              Önizleme —{" "}
              <strong>
                {name || "hedef"}{target ? ` · %${progress}` : ""}
              </strong>
            </div>
          </>
        )}

        {/* Kaydet butonu — goal-insight tonunda */}
        <button
          className={`goal-add-btn ${submitted ? "success" : ""}`}
          onClick={handleAdd}
          disabled={!name.trim() || !target}
        >
          {submitted ? "✓ Hedef Eklendi!" : "+ Hedef Ekle"}
        </button>
      </div>

      {/* ── Mevcut Hedef Kartları ── */}
      {goals.map((g) => {
        const pct = Math.min(Math.round((g.current / g.target) * 100), 100);
        return (
          <div className="goal-card" key={g.id}>
            <div className="goal-header">
              <LottieIcon animationData={g.animationData} size={38} />
              <div>
                <div className="goal-name">{g.name}</div>
                <div className="goal-sub">
                  {g.current.toLocaleString("tr-TR")} / {g.target.toLocaleString("tr-TR")} TL
                </div>
              </div>
              <div className="goal-pct">{pct}%</div>
            </div>
            <div className="goal-bar">
              <div className="goal-fill" style={{ width: `${pct}%`, background: g.color }} />
            </div>
            {g.insight && (
              <div className="goal-insight">
                <span className="goal-octo-wrap">
                  <LottieIcon animationData={animOctopus} size={22} />
                </span>{" "}
                {g.insight}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GoalsPanel;