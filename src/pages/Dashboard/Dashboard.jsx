import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

// Shared
import LottieIcon from "./components/LottieIcon";

// Tab panels
import ChatPanel     from "./components/ChatPanel";
import ExpensesPanel from "./components/ExpensesPanel";
import GoalsPanel    from "./components/GoalsPanel";
import InsightsPanel from "./components/InsightsPanel";
import ReceiptPanel  from "./components/ReceiptPanel";

// Bileşenler
import ProfileCard                   from "./components/ProfileCard";
import { ToastContainer, useToast } from "./components/Toast";

// Animations
import animOctopus from "./animations/octopus1.json";
import animChat    from "./animations/chat.json";
import animMoney   from "./animations/money.json";
import animTarget  from "./animations/target.json";
import animStats   from "./animations/stats.json";
import animScan    from "./animations/scan.json";
import animExport  from "./animations/export.json";

const NAV_TABS = [
  { id: "chat",     animationData: animChat,   label: "Asistan"      },
  { id: "expenses", animationData: animMoney,  label: "Harcamalar"   },
  { id: "goals",    animationData: animTarget, label: "Hedefler"     },
  { id: "insights", animationData: animStats,  label: "Analizler"    },
  { id: "receipt",  animationData: animScan,   label: "Fiş & Fatura" },
];

const MOCK_EXPENSES = [
  { id: 1, desc: "Arkadaşımla yemek", amount: 450, category: "Yemek",   date: "2025-05-16", mood: "😊", color: "#14b8a6" },
  { id: 2, desc: "Kahve",             amount: 85,  category: "Kahve",   date: "2025-05-15", mood: "😴", color: "#8b5cf6" },
  { id: 3, desc: "Market alışverişi", amount: 320, category: "Market",  date: "2025-05-15", mood: "😐", color: "#f59e0b" },
  { id: 4, desc: "Uber",              amount: 120, category: "Ulaşım",  date: "2025-05-14", mood: "😤", color: "#ef4444" },
  { id: 5, desc: "Netflix",           amount: 130, category: "Eğlence", date: "2025-05-13", mood: "😊", color: "#3b82f6" },
];

const MOCK_GOALS = [
  { id: 1, name: "iPhone Almak", current: 10800, target: 15000, color: "#14b8a6" },
  { id: 2, name: "Yaz Tatili",   current: 3200,  target: 8000,  color: "#8b5cf6" },
];

const BUDGET = 3000;

// ── Sidebar Export bileşeni ────────────────────────────────────────
const SidebarExport = ({ expenses, goals }) => {
  const [done, setDone] = useState(null);

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doExport = (key) => {
    const date = new Date().toISOString().slice(0, 10);
    if (key === "csv") {
      const rows = [["Açıklama", "Tutar (TL)", "Kategori", "Tarih", "Duygu"]];
      expenses.forEach((e) =>
        rows.push([e.desc, e.amount, e.category, e.date, e.mood || ""])
      );
      if (goals.length) {
        rows.push([]);
        rows.push(["Hedef", "Mevcut (TL)", "Hedef (TL)", "İlerleme %"]);
        goals.forEach((g) =>
          rows.push([g.name, g.current, g.target, Math.round((g.current / g.target) * 100) + "%"])
        );
      }
      download(
        "\uFEFF" + rows.map((r) => r.join(",")).join("\n"),
        `buddyocto-${date}.csv`,
        "text/csv;charset=utf-8"
      );
    } else {
      download(
        JSON.stringify({ exportedAt: new Date().toISOString(), expenses, goals }, null, 2),
        `buddyocto-${date}.json`,
        "application/json"
      );
    }
    setDone(key);
    setTimeout(() => setDone(null), 2000);
  };

  return (
    <div className="sidebar-export">
      <div className="sidebar-export-header">
        <span className="sidebar-export-icon">
          <LottieIcon animationData={animExport} size={24} autoplay />
        </span>
        <div>
          <div className="sidebar-export-title">Dışa Aktar</div>
          <div className="sidebar-export-sub">Harcamaları indir</div>
        </div>
      </div>
      <div className="sidebar-export-btns">
        <button
          className={`sidebar-export-btn csv ${done === "csv" ? "done" : ""}`}
          onClick={() => doExport("csv")}
          disabled={done !== null}
        >
          {done === "csv" ? "✓ İndirildi" : "CSV İndir"}
        </button>
        <button
          className={`sidebar-export-btn json ${done === "json" ? "done" : ""}`}
          onClick={() => doExport("json")}
          disabled={done !== null}
        >
          {done === "json" ? "✓ İndirildi" : "JSON İndir"}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [expenses, setExpenses]   = useState(MOCK_EXPENSES);
  const [goals, setGoals]         = useState(MOCK_GOALS);

  const { toasts, removeToast, success, error, warning } = useToast();

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const handleSetExpenses = (updater) => {
    setExpenses((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const newTotal = next.reduce((s, e) => s + e.amount, 0);
      if (next.length > prev.length) {
        if (newTotal > BUDGET) {
          error(`⚠️ Limit aşıldı! ${(newTotal - BUDGET).toLocaleString("tr-TR")} TL fazla.`);
        } else if (newTotal > BUDGET * 0.9) {
          warning("Bütçenin %90'ına ulaştın, dikkatli ol!");
        } else {
          success("Harcama başarıyla eklendi!");
        }
      }
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("buddyocto_user");
    navigate("/login");
  };

  return (
    <div className="db-root">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <LottieIcon animationData={animOctopus} size={36} />
          <span className="sidebar-title">BuddyOcto</span>
        </div>

        <ProfileCard
          name="Kullanıcı"
          email="kullanici@email.com"
          monthlyTotal={totalSpent}
          monthlyBudget={BUDGET}
        />

        <nav className="sidebar-nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              className={"nav-item" + (activeTab === tab.id ? " active" : "")}
              onClick={() => setActiveTab(tab.id)}
            >
              <LottieIcon
                animationData={tab.animationData}
                size={24}
                autoplay={activeTab === tab.id}
                className="nav-lottie"
              />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <SidebarExport expenses={expenses} goals={goals} />

        <button className="logout-btn" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="db-main">
        {activeTab === "chat" && (
          <ChatPanel expenses={expenses} setExpenses={handleSetExpenses} />
        )}
        {activeTab === "expenses" && (
          <ExpensesPanel expenses={expenses} setExpenses={handleSetExpenses} />
        )}
        {activeTab === "goals" && <GoalsPanel goals={goals} setGoals={setGoals} />}
        {activeTab === "insights" && <InsightsPanel />}
        {activeTab === "receipt" && (
          <ReceiptPanel setExpenses={handleSetExpenses} />
        )}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Dashboard;