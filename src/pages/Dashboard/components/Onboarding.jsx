import React, { useState } from "react";
import "./Onboarding.css";
import LottieIcon from "./LottieIcon";
import animOctopus from "../animations/octopus1.json";
import animMoney   from "../animations/money.json";
import animTarget  from "../animations/target.json";

const STEPS = [
  {
    id: "name",
    anim: animOctopus,
    title: "Merhaba! Ben BuddyOcto 🐙",
    subtitle: "Sana nasıl hitap edeyim?",
    placeholder: "Adın nedir?",
    type: "text",
  },
  {
    id: "budget",
    anim: animMoney,
    title: "Aylık bütçen ne kadar?",
    subtitle: "Harcamalarını bu limite göre takip edeceğiz.",
    placeholder: "Örn: 5000",
    type: "number",
  },
  {
    id: "goal",
    anim: animTarget,
    title: "İlk hedefin ne?",
    subtitle: "Biriktirmek istediğin bir şey var mı?",
    placeholder: "Örn: Tatil fonu",
    type: "text",
  },
];

const Onboarding = ({ onFinish }) => {
  const [step, setStep]   = useState(0);
  const [values, setValues] = useState({ name: "", budget: "", goal: "" });
  const [exiting, setExiting] = useState(false);

  const current = STEPS[step];
  const value   = values[current.id];
  const isLast  = step === STEPS.length - 1;

  const handleNext = () => {
    if (!value.trim()) return;
    if (isLast) {
      setExiting(true);
      localStorage.setItem("buddyocto_onboarding", JSON.stringify(values));
      setTimeout(() => onFinish(values), 600);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleNext();
  };

  return (
    <div className={`ob-overlay ${exiting ? "ob-exit" : ""}`}>
      <div className="ob-card">

        {/* Progress dots */}
        <div className="ob-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`ob-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
            />
          ))}
        </div>

        {/* Lottie */}
        <div className="ob-anim">
          <LottieIcon animationData={current.anim} size={100} autoplay />
        </div>

        {/* Metin */}
        <h2 className="ob-title">{current.title}</h2>
        <p className="ob-sub">{current.subtitle}</p>

        {/* Input */}
        <input
          key={current.id}
          className="ob-inp"
          type={current.type}
          placeholder={current.placeholder}
          value={value}
          autoFocus
          onChange={(e) =>
            setValues((v) => ({ ...v, [current.id]: e.target.value }))
          }
          onKeyDown={handleKey}
        />

        {/* Buton */}
        <button
          className="ob-btn"
          onClick={handleNext}
          disabled={!value.trim()}
        >
          {isLast ? "Hadi Başlayalım! 🚀" : "Devam Et →"}
        </button>

        {/* Adım sayısı */}
        <p className="ob-step-label">{step + 1} / {STEPS.length}</p>
      </div>
    </div>
  );
};

export default Onboarding;