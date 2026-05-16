import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import "./CategoryPieChart.css";

// ── Kategori renkleri (mevcut projeyle uyumlu) ──
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

const FALLBACK_DATA = [
  { category: "Market",   total: 1840, percentage: 32.1 },
  { category: "Yemek",    total: 1200, percentage: 20.9 },
  { category: "Fatura",   total: 980,  percentage: 17.1 },
  { category: "Ulaşım",   total: 640,  percentage: 11.2 },
  { category: "İçecek",   total: 420,  percentage: 7.3  },
  { category: "Diğer",    total: 650,  percentage: 11.4 },
];

// ── Harcamalardan kategori verisi üret ──
function buildCategoryData(expenses) {
  if (!expenses || expenses.length === 0) return null;

  const totals = {};
  let grand = 0;

  expenses.forEach((e) => {
    const cat = e.category || "Diğer";
    totals[cat] = (totals[cat] || 0) + (e.amount || 0);
    grand += e.amount || 0;
  });

  if (grand === 0) return null;

  return Object.entries(totals)
    .map(([category, total]) => ({
      category,
      total,
      percentage: parseFloat(((total / grand) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.total - a.total);
}

// ── Aktif dilim render'ı ──
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
  } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={1}
      />
    </g>
  );
};

// ── Tooltip ──
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="cpc-tooltip">
        <div className="cpc-tooltip__cat">{d.category}</div>
        <div className="cpc-tooltip__row">
          <span className="cpc-tooltip__val">
            ₺{d.total.toLocaleString("tr-TR")}
          </span>
          <span className="cpc-tooltip__pct">%{d.percentage}</span>
        </div>
      </div>
    );
  }
  return null;
};

// ────────────────────────────────────────────────
const CategoryPieChart = ({ expenses }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const realData = useMemo(() => buildCategoryData(expenses), [expenses]);
  const isRealData = realData !== null;
  const data = realData || FALLBACK_DATA;

  const total = data.reduce((s, d) => s + d.total, 0);

  // Aktif kategori (hover veya ilk eleman)
  const active = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="cpc-card">
      {/* ── Başlık ── */}
      <div className="cpc-header">
        <div>
          <h2 className="cpc-title">Kategori Dağılımı</h2>
          <p className="cpc-subtitle">
            {isRealData
              ? "Harcamalarına göre dağılım"
              : "Örnek veri — harcama ekledikçe güncellenir"}
          </p>
        </div>
        <div className="cpc-total-badge">
          <span className="cpc-total-label">Toplam</span>
          <span className="cpc-total-value">
            ₺{total.toLocaleString("tr-TR")}
          </span>
        </div>
      </div>

      {/* ── İçerik: Pasta + Liste ── */}
      <div className="cpc-body">

        {/* Pasta grafik */}
        <div className="cpc-chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                dataKey="total"
                nameKey="category"
                paddingAngle={3}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS["Diğer"]}
                    opacity={
                      activeIndex === null ||
                      data[activeIndex]?.category === entry.category
                        ? 1
                        : 0.35
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Ortadaki yazı */}
          <div className="cpc-center-label">
            {active ? (
              <>
                <span className="cpc-center-pct">%{active.percentage}</span>
                <span className="cpc-center-cat">{active.category}</span>
              </>
            ) : (
              <>
                <span className="cpc-center-pct">{data.length}</span>
                <span className="cpc-center-cat">kategori</span>
              </>
            )}
          </div>
        </div>

        {/* Kategori listesi */}
        <div className="cpc-list">
          {data.map((entry, i) => {
            const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS["Diğer"];
            const isActive = activeIndex === i;
            return (
              <div
                key={entry.category}
                className={`cpc-list-item ${isActive ? "cpc-list-item--active" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {/* Renk dot */}
                <div
                  className="cpc-dot"
                  style={{ background: color }}
                />

                {/* Kategori adı + bar */}
                <div className="cpc-list-info">
                  <div className="cpc-list-top">
                    <span className="cpc-list-name">{entry.category}</span>
                    <span className="cpc-list-amount">
                      ₺{entry.total.toLocaleString("tr-TR")}
                    </span>
                    <span className="cpc-list-pct">%{entry.percentage}</span>
                  </div>
                  <div className="cpc-bar-track">
                    <div
                      className="cpc-bar-fill"
                      style={{
                        width: `${entry.percentage}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default CategoryPieChart;