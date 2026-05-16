import React, { useMemo } from "react";
import "./InsightsPanel.css";
import LottieIcon           from "./LottieIcon";
import MonthlyExpensesChart from "./MonthlyExpensesChart";
import CategoryPieChart     from "./CategoryPieChart";

import animAngry from "../animations/angry.json";
import animSmile from "../animations/smile.json";
import animMoney from "../animations/money.json";
import animStats from "../animations/stats.json";

const BUDGET = 3000;

// ── Gerçek harcamalardan insight'ları hesapla ──
function buildInsights(expenses) {
  if (!expenses || expenses.length === 0) return null;

  // Duygu bazında ortalama harcama
  const byMood = {};
  expenses.forEach((e) => {
    const mood = e.mood || "😐";
    if (!byMood[mood]) byMood[mood] = { total: 0, count: 0 };
    byMood[mood].total += e.amount || 0;
    byMood[mood].count += 1;
  });

  const moodAvg    = (mood) => byMood[mood] ? byMood[mood].total / byMood[mood].count : 0;
  const stressAvg  = moodAvg("😤");
  const happyAvg   = moodAvg("😊");
  const overallAvg = expenses.reduce((s, e) => s + e.amount, 0) / expenses.length;

  const stressDiff = stressAvg && overallAvg
    ? Math.round(((stressAvg - overallAvg) / overallAvg) * 100)
    : null;

  const happyDiff = happyAvg && overallAvg
    ? Math.round(happyAvg - overallAvg)
    : null;

  // En çok harcanan kategori
  const byCat = {};
  expenses.forEach((e) => {
    const cat = e.category || "Diğer";
    byCat[cat] = (byCat[cat] || 0) + (e.amount || 0);
  });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  const total      = expenses.reduce((s, e) => s + e.amount, 0);
  const projection = Math.round((total / expenses.length) * 30);

  return { stressDiff, happyDiff, topCat, total, projection };
}

// ────────────────────────────────────────────────
const InsightsPanel = ({ expenses = [] }) => {
  const ins = useMemo(() => buildInsights(expenses), [expenses]);

  const stressVal = ins?.stressDiff != null
    ? `${ins.stressDiff > 0 ? "+" : ""}%${ins.stressDiff}`
    : "+%43";

  const happyVal = ins?.happyDiff != null
    ? `${ins.happyDiff > 0 ? "+" : ""}${ins.happyDiff} TL`
    : "-220 TL";

  const topCatName = ins?.topCat?.[0] ?? "Kahve";
  const topCatVal  = ins?.topCat
    ? `${ins.topCat[1].toLocaleString("tr-TR")} TL`
    : "680 TL/ay";

  const total      = ins?.total ?? 0;
  const projection = ins?.projection ?? 3840;
  const projOver   = Math.max(projection - BUDGET, 0);

  return (
    <div className="tab-panel">

      {/* ── Başlık ── */}
      <div className="tab-header">
        <div>
          <h2>Psikolojik Finans Analizi</h2>
          <p>Duygularınla harcamaların arasındaki ilişki</p>
        </div>
      </div>

      {/* ── 4'lü insight kartları ── */}
      <div className="insight-grid">
        <div className="insight-card red">
          <div className="insight-icon">
            <LottieIcon animationData={animAngry} size={36} />
          </div>
          <div className="insight-title">Stresli Günler</div>
          <div className="insight-val">{stressVal}</div>
          <div className="insight-desc">
            Stresli olduğunda ortalama harcaman belirgin şekilde artıyor
          </div>
        </div>

        <div className="insight-card green">
          <div className="insight-icon">
            <LottieIcon animationData={animSmile} size={36} />
          </div>
          <div className="insight-title">Mutlu Günler</div>
          <div className="insight-val">{happyVal}</div>
          <div className="insight-desc">
            Mutlu olduğunda daha bilinçli alışveriş yapıyorsun
          </div>
        </div>

        <div className="insight-card purple">
          <div className="insight-icon">
            <LottieIcon animationData={animMoney} size={36} />
          </div>
          <div className="insight-title">En Çok: {topCatName}</div>
          <div className="insight-val">{topCatVal}</div>
          <div className="insight-desc">
            Bu kategori toplam harcamanın en büyük dilimini oluşturuyor
          </div>
        </div>

        <div className="insight-card blue">
          <div className="insight-icon">
            <LottieIcon animationData={animStats} size={36} />
          </div>
          <div className="insight-title">Bu Ay Toplam</div>
          <div className="insight-val">
            {total > 0 ? `${total.toLocaleString("tr-TR")} TL` : "—"}
          </div>
          <div className="insight-desc">
            {total > 0
              ? `${expenses.length} harcama kaydedildi`
              : "Henüz harcama eklenmedi"}
          </div>
        </div>
      </div>

      {/* ── Tahmin kartı ── */}
      <div className="prediction-card">
        <div className="prediction-title">
          <LottieIcon animationData={animStats} size={22} autoplay />
          Bu Ay Tahmini
        </div>
        <div className="prediction-text">
          Mevcut harcama temponla bu ayı{" "}
          <strong>{projection.toLocaleString("tr-TR")} TL</strong> ile kapatacaksın.{" "}
          {projOver > 0 ? (
            <>
              Bütçeni <strong>{projOver.toLocaleString("tr-TR")} TL</strong> aşacaksın.{" "}
              {ins?.topCat
                ? `${ins.topCat[0]} harcamalarını kısarsan farkı kapatabilirsin.`
                : "Harcamalarını gözden geçirmeni öneririm."}
            </>
          ) : (
            "Bütçen dahilinde kalıyorsun, tebrikler!"
          )}
        </div>
      </div>

      {/* ── Aylık harcama & gelir grafiği ── */}
      <MonthlyExpensesChart expenses={expenses} />

      {/* ── Kategori pasta grafiği ── */}
      <CategoryPieChart expenses={expenses} />

    </div>
  );
};

export default InsightsPanel;