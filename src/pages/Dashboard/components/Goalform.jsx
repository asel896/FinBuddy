import { useState } from "react";
import "./GoalForm.css";

const COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6"];

const GoalForm = ({ onAddGoal }) => {
  const [name, setName]       = useState("");
  const [target, setTarget]   = useState("");
  const [current, setCurrent] = useState("");
  const [color, setColor]     = useState("#14b8a6");
  const [submitted, setSubmitted] = useState(false);

  const progress =
    target && current
      ? Math.min(100, Math.round((parseFloat(current) / parseFloat(target)) * 100))
      : 0;

  const handleSubmit = () => {
    if (!name.trim() || !target) return;
    onAddGoal?.({
      id: Date.now(),
      name: name.trim(),
      target: parseFloat(target),
      current: parseFloat(current) || 0,
      color,
    });
    setName("");
    setTarget("");
    setCurrent("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="gf-wrap">
      <div className="gf-title-row">
        <span className="gf-emoji">🎯</span>
        <div>
          <div className="gf-heading">Yeni Hedef</div>
          <div className="gf-sub">Kendi hedefini tanımla, çubuk otomatik dolsun</div>
        </div>
      </div>

      <div className="gf-fields">
        <input
          className="gf-input"
          placeholder="Hedef adı  (örn: Tatil fonu)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="gf-row">
          <input
            className="gf-input"
            type="number"
            placeholder="Hedef tutar (TL)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <input
            className="gf-input"
            type="number"
            placeholder="Mevcut (TL)"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>

        <div className="gf-color-row">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`gf-dot ${color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Önizleme — GoalsPanel'deki card tasarımıyla birebir aynı */}
      {name || target ? (
        <div className="goal-card gf-preview-card">
          <div className="goal-header">
            <div
              className="goal-icon-dot"
              style={{ background: color }}
            />
            <div>
              <div className="goal-name">{name || "Hedef adı"}</div>
              <div className="goal-sub">
                {current ? parseInt(current).toLocaleString("tr-TR") : "0"} /{" "}
                {target ? parseInt(target).toLocaleString("tr-TR") : "—"} TL
              </div>
            </div>
            <div className="goal-pct">{progress}%</div>
          </div>
          <div className="goal-bar">
            <div
              className="goal-fill"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>
          <div className="goal-insight">
            <span>Önizleme — kaydetmek için butona bas</span>
          </div>
        </div>
      ) : null}

      <button
        className={`gf-submit ${submitted ? "success" : ""}`}
        onClick={handleSubmit}
        disabled={!name.trim() || !target}
      >
        {submitted ? "✓ Hedef Eklendi!" : "Hedef Ekle"}
      </button>
    </div>
  );
};

export default GoalForm;