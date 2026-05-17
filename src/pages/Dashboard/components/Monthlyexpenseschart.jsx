import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./MonthlyExpensesChart.css";

const FALLBACK_DATA = [
  { month: "Oca", expenses: 3200, income: 5400 },
  { month: "Şub", expenses: 2800, income: 5200 },
  { month: "Mar", expenses: 4100, income: 6100 },
  { month: "Nis", expenses: 3600, income: 5800 },
  { month: "May", expenses: 5200, income: 7200 },
  { month: "Haz", expenses: 4700, income: 6500 },
  { month: "Tem", expenses: 3900, income: 5900 },
  { month: "Ağu", expenses: 4300, income: 6300 },
  { month: "Eyl", expenses: 3100, income: 5100 },
  { month: "Eki", expenses: 4800, income: 6800 },
  { month: "Kas", expenses: 5600, income: 7400 },
  { month: "Ara", expenses: 6200, income: 8100 },
];

const AY_ETIKET = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

const FILTERS = ["3 Ay", "6 Ay", "Tümü"];

function buildChartData(expenses) {
  if (!expenses || expenses.length === 0) return null;

  const byMonth = {};
  AY_ETIKET.forEach((ay, i) => {
    byMonth[i] = { month: ay, expenses: 0, income: 0 };
  });

  expenses.forEach((e) => {
    const now = new Date();
    let monthIndex = now.getMonth();
    if (e.date && e.date !== "Az önce") {
      const parsed = new Date(e.date);
      if (!isNaN(parsed)) monthIndex = parsed.getMonth();
    }
    byMonth[monthIndex].expenses += e.amount || 0;
  });

  const result = Object.values(byMonth);
  const hasData = result.some((r) => r.expenses > 0);
  return hasData ? result : null;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="mec-tooltip">
        <p className="mec-tooltip__label">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="mec-tooltip__row">
            <span className="mec-tooltip__dot" style={{ background: entry.color }} />
            <span className="mec-tooltip__name">{entry.name}</span>
            <span className="mec-tooltip__value">
              ₺{entry.value.toLocaleString("tr-TR")}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MonthlyExpensesChart = ({ expenses }) => {
  const [activeFilter, setActiveFilter] = useState("Tümü");

  const realData = buildChartData(expenses);
  const isRealData = realData !== null;
  const rawData = realData || FALLBACK_DATA;

  const avg = Math.round(
    rawData.reduce((s, d) => s + d.expenses, 0) / rawData.length
  );
  const dataWithAvg = rawData.map((d) => ({ ...d, avg }));

  const filteredData =
    activeFilter === "3 Ay"
      ? dataWithAvg.slice(-3)
      : activeFilter === "6 Ay"
      ? dataWithAvg.slice(-6)
      : dataWithAvg;

  const totalExpenses = filteredData.reduce((s, d) => s + d.expenses, 0);
  const totalIncome = filteredData.reduce((s, d) => s + d.income, 0);
  const savingsRate =
    totalIncome > 0
      ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)
      : null;

  return (
    <div className="mec-card">
      <div className="mec-header">
        <div className="mec-header__left">
          <h2 className="mec-title">Aylık Harcama Analizi</h2>
          <p className="mec-subtitle">
            {isRealData
              ? "Gerçek harcamalarına göre"
              : "Örnek veri — harcama ekledikçe güncellenir"}
          </p>
        </div>
        <div className="mec-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`mec-filter-btn ${activeFilter === f ? "mec-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mec-stats">
        <div className="mec-stat">
          <span className="mec-stat__label">Toplam Gelir</span>
          <span className="mec-stat__value mec-stat__value--income">
            {totalIncome > 0 ? `₺${totalIncome.toLocaleString("tr-TR")}` : "—"}
          </span>
        </div>
        <div className="mec-stat-divider" />
        <div className="mec-stat">
          <span className="mec-stat__label">Toplam Gider</span>
          <span className="mec-stat__value mec-stat__value--expense">
            ₺{totalExpenses.toLocaleString("tr-TR")}
          </span>
        </div>
        <div className="mec-stat-divider" />
        <div className="mec-stat">
          <span className="mec-stat__label">Tasarruf Oranı</span>
          <span className="mec-stat__value mec-stat__value--savings">
            {savingsRate ? `%${savingsRate}` : "—"}
          </span>
        </div>
      </div>

      <div className="mec-chart-wrapper">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97066" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f97066" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8892a4", fontSize: 12, fontFamily: "inherit" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8892a4", fontSize: 11, fontFamily: "inherit" }}
              tickFormatter={(v) =>
                v >= 1000 ? `₺${(v / 1000).toFixed(0)}k` : `₺${v}`
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              formatter={(value) => (
                <span style={{ color: "#8892a4", fontSize: "12px" }}>{value}</span>
              )}
            />
            {totalIncome > 0 && (
              <Bar
                dataKey="income"
                name="Gelir"
                fill="url(#incomeGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            )}
            <Bar
              dataKey="expenses"
              name="Gider"
              fill="url(#expenseGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Line
              type="monotone"
              dataKey="avg"
              name="Ort. Gider"
              stroke="#facc15"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 4"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyExpensesChart;