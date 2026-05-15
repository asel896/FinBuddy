import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const MOCK_EXPENSES = [
  { id: 1, desc: "Arkadaşımla yemek", amount: 450, category: "Yemek", date: "Bugün", mood: "😊", color: "#14b8a6" },
  { id: 2, desc: "Kahve", amount: 85, category: "Kahve", date: "Dün", mood: "😴", color: "#8b5cf6" },
  { id: 3, desc: "Market alışverişi", amount: 320, category: "Market", date: "Dün", mood: "😐", color: "#f59e0b" },
  { id: 4, desc: "Uber", amount: 120, category: "Ulaşım", date: "2 gün önce", mood: "😤", color: "#ef4444" },
  { id: 5, desc: "Netflix", amount: 130, category: "Eğlence", date: "3 gün önce", mood: "😊", color: "#3b82f6" },
];

const MOODS = ["😊", "😴", "😐", "😤", "😢", "🤩"];

const QUICK_INSIGHTS = [
  { icon: "☕", text: "Kahve harcaman bu ay 680 TL — geçen aya göre %34 fazla" },
  { icon: "🍔", text: "Hafta sonları yemek harcaman hafta içinin 2.3 katı" },
  { icon: "🎯", text: "iPhone hedefine 4.200 TL kaldı — 6 haftada ulaşabilirsin" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Merhaba! 👋 Ben BuddyOcto. Harcamalarını analiz etmemi, hedeflerini takip etmemi veya herhangi bir konuda sohbet etmemi isteyebilirsin. Bugün nasıl bir harcama yaptın?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ desc: "", amount: "", mood: "😊" });
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Sen BuddyOcto adında samimi, zeki ve destekleyici bir kişisel finans asistanısın. 
          Kullanıcının harcama verilerine erişimin var:
          ${JSON.stringify(expenses)}
          
          Toplam harcama: ${expenses.reduce((s, e) => s + e.amount, 0)} TL
          Bu ay bütçe limiti: 3000 TL
          iPhone hedefi: 15000 TL, biriken: 10800 TL
          
          Kurallar:
          - Türkçe konuş, samimi ve motive edici ol
          - Kullanıcı harcama söylerse (örn: "bugün 200 TL harcadım") bunu kaydet ve analiz et
          - Psikolojik finans konusunda derin analizler sun
          - Emojilerle daha canlı bir dil kullan
          - Kısa ve öz cevaplar ver (max 3-4 cümle)`,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.text })),
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Bir sorun oluştu, tekrar dener misin?";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      // Harcama girişi algılama — basit regex
      const amountMatch = userMsg.match(/(\d+)\s*(tl|lira)?/i);
      if (amountMatch && (userMsg.toLowerCase().includes("harcadım") || userMsg.toLowerCase().includes("verdim") || userMsg.toLowerCase().includes("ödedim"))) {
        const amount = parseInt(amountMatch[1]);
        setExpenses((prev) => [
          { id: Date.now(), desc: userMsg, amount, category: "Genel", date: "Az önce", mood: "😊", color: "#14b8a6" },
          ...prev,
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Bağlantı sorunu yaşıyorum, birazdan tekrar dener misin? 🐙" }]);
    }
    setLoading(false);
  };

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

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budget = 3000;
  const budgetPct = Math.min((totalSpent / budget) * 100, 100);
  const goalPct = Math.min((10800 / 15000) * 100, 100);

  const handleLogout = () => {
    localStorage.removeItem("buddyocto_user");
    navigate("/login");
  };

  return (
    <div className="db-root">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-octo">🐙</span>
          <span className="sidebar-title">BuddyOcto</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "chat", icon: "💬", label: "Asistan" },
            { id: "expenses", icon: "💸", label: "Harcamalar" },
            { id: "goals", icon: "🎯", label: "Hedefler" },
            { id: "insights", icon: "🧠", label: "Analizler" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Bütçe özeti */}
        <div className="sidebar-budget">
          <div className="budget-label">
            <span>Bu Ay</span>
            <span className="budget-amount">{totalSpent.toLocaleString("tr-TR")} TL</span>
          </div>
          <div className="budget-bar">
            <div className="budget-fill" style={{ width: `${budgetPct}%`, background: budgetPct > 80 ? "#ef4444" : "#14b8a6" }} />
          </div>
          <div className="budget-sub">Limitin: {budget.toLocaleString("tr-TR")} TL</div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="db-main">

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div className="chat-panel">
            <div className="chat-header">
              <div>
                <h2>BuddyOcto Asistan</h2>
                <p>Harcamalarını doğal dille anlat, analiz eteyim</p>
              </div>
              {/* Quick insights */}
              <div className="quick-insights">
                {QUICK_INSIGHTS.map((q, i) => (
                  <div key={i} className="insight-pill">
                    {q.icon} {q.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  {msg.role === "assistant" && <span className="msg-avatar">🐙</span>}
                  <div className="msg-bubble">{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div className="msg assistant">
                  <span className="msg-avatar">🐙</span>
                  <div className="msg-bubble typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-row">
              <input
                className="chat-inp"
                placeholder='Örn: "Bugün kahvede 85 TL harcadım" veya "Neden limitimi aştım?"'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button className="chat-send" onClick={sendMessage} disabled={loading}>
                {loading ? "..." : "Gönder"}
              </button>
            </div>
          </div>
        )}

        {/* EXPENSES TAB */}
        {activeTab === "expenses" && (
          <div className="tab-panel">
            <div className="tab-header">
              <div>
                <h2>Harcamalar</h2>
                <p>{expenses.length} kayıt • {totalSpent.toLocaleString("tr-TR")} TL toplam</p>
              </div>
              <button className="add-btn" onClick={() => setShowAddExpense(!showAddExpense)}>
                + Harcama Ekle
              </button>
            </div>

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
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="add-btn" onClick={addExpense}>Kaydet</button>
              </div>
            )}

            <div className="expense-list">
              {expenses.map((e) => (
                <div key={e.id} className="expense-card">
                  <div className="expense-dot" style={{ background: e.color }} />
                  <div className="expense-info">
                    <span className="expense-desc">{e.desc}</span>
                    <span className="expense-meta">{e.category} • {e.date}</span>
                  </div>
                  <span className="expense-mood">{e.mood}</span>
                  <span className="expense-amount">-{e.amount.toLocaleString("tr-TR")} TL</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <div className="tab-panel">
            <div className="tab-header">
              <div>
                <h2>Hedefler</h2>
                <p>Finansal hedeflerini takip et</p>
              </div>
            </div>

            <div className="goal-card">
              <div className="goal-header">
                <span className="goal-icon">📱</span>
                <div>
                  <div className="goal-name">iPhone Almak</div>
                  <div className="goal-sub">10.800 / 15.000 TL</div>
                </div>
                <div className="goal-pct">{Math.round(goalPct)}%</div>
              </div>
              <div className="goal-bar">
                <div className="goal-fill" style={{ width: `${goalPct}%` }} />
              </div>
              <div className="goal-insight">
                🐙 Bu tempoda <strong>6 hafta</strong> içinde hedefe ulaşırsın. Bu hafta 3 kahveyi ev kahvesiyle değiştirsen <strong>255 TL</strong> tasarruf edersin!
              </div>
            </div>

            <div className="goal-card">
              <div className="goal-header">
                <span className="goal-icon">✈️</span>
                <div>
                  <div className="goal-name">Yaz Tatili</div>
                  <div className="goal-sub">3.200 / 8.000 TL</div>
                </div>
                <div className="goal-pct">40%</div>
              </div>
              <div className="goal-bar">
                <div className="goal-fill" style={{ width: "40%", background: "#8b5cf6" }} />
              </div>
              <div className="goal-insight">
                🐙 Hafta sonu dışarıda yemek yerine evde yersen ayda <strong>1.200 TL</strong> biriktirirsin.
              </div>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div className="tab-panel">
            <div className="tab-header">
              <div>
                <h2>Psikolojik Finans Analizi</h2>
                <p>Duygularınla harcamaların arasındaki ilişki</p>
              </div>
            </div>

            <div className="insight-grid">
              <div className="insight-card red">
                <div className="insight-icon">😤</div>
                <div className="insight-title">Stresli Günler</div>
                <div className="insight-val">+%43</div>
                <div className="insight-desc">Stresli olduğun günlerde ortalama harcaman %43 artıyor</div>
              </div>
              <div className="insight-card green">
                <div className="insight-icon">😊</div>
                <div className="insight-title">Mutlu Günler</div>
                <div className="insight-val">-220 TL</div>
                <div className="insight-desc">Mutlu olduğunda daha bilinçli alışveriş yapıyorsun</div>
              </div>
              <div className="insight-card purple">
                <div className="insight-icon">☕</div>
                <div className="insight-title">Kahve Bağımlılığı</div>
                <div className="insight-val">680 TL/ay</div>
                <div className="insight-desc">Aylık kahve harcaman bir iPhone'un %4.5'i</div>
              </div>
              <div className="insight-card blue">
                <div className="insight-icon">🌙</div>
                <div className="insight-title">Gece Alışverişi</div>
                <div className="insight-val">%67</div>
                <div className="insight-desc">Harcamalarının %67'si saat 21:00 sonrası yapılıyor</div>
              </div>
            </div>

            <div className="prediction-card">
              <div className="prediction-title">🔮 Bu Ay Tahmini</div>
              <div className="prediction-text">
                Mevcut harcama temponla bu ayı <strong>3.840 TL</strong> ile kapatacaksın.
                Bütçeni <strong>840 TL</strong> aşacaksın. Kahve ve dışarıda yemek harcamalarını
                kısarsan farkı kapatabilirsin.
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;