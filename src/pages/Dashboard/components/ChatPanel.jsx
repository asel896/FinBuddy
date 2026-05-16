import React, { useState, useRef, useEffect } from "react";
import "./ChatPanel.css";
import LottieIcon from "./LottieIcon"; 
import animOctopus from "../animations/octopus1.json";

const QUICK_INSIGHTS = [
  { icon: "☕", text: "Kahve harcaman bu ay 680 TL — geçen aya göre %34 fazla" },
  { icon: "🍔", text: "Hafta sonları yemek harcaman hafta içinin 2.3 katı" },
  { icon: "🎯", text: "iPhone hedefine 4.200 TL kaldı — 6 haftada ulaşabilirsin" },
];

const ChatPanel = ({ expenses, setExpenses }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Merhaba! Ben BuddyOcto. Harcamalarını analiz etmemi, hedeflerini takip etmemi veya herhangi bir konuda sohbet etmemi isteyebilirsin. Bugün nasıl bir harcama yaptın?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
          system: `Sen BuddyOcto adinda samimi, zeki ve destekleyici bir kisisel finans asistanisin.
          Kullanicinin harcama verilerine eriisimin var:
          ${JSON.stringify(expenses)}
          Toplam harcama: ${expenses.reduce((s, e) => s + e.amount, 0)} TL
          Bu ay butce limiti: 3000 TL
          iPhone hedefi: 15000 TL, biriken: 10800 TL
          Kurallar:
          - Turkce konus, samimi ve motive edici ol
          - Kullanici harcama soylerse bunu kaydet ve analiz et
          - Psikolojik finans konusunda derin analizler sun
          - Emojilerle daha canli bir dil kullan
          - Kisa ve oz cevaplar ver (max 3-4 cumle)`,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.text })),
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Bir sorun olustu, tekrar dener misin?";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      const amountMatch = userMsg.match(/(\d+)\s*(tl|lira)?/i);
      if (
        amountMatch &&
        (userMsg.toLowerCase().includes("harcadim") ||
          userMsg.toLowerCase().includes("verdim") ||
          userMsg.toLowerCase().includes("odedim"))
      ) {
        const amount = parseInt(amountMatch[1]);
        setExpenses((prev) => [
          { id: Date.now(), desc: userMsg, amount, category: "Genel", date: "Az once", mood: "😊", color: "#14b8a6" },
          ...prev,
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Baglanti sorunu yasiyorum, birazdan tekrar dener misin?" },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-top">
          <LottieIcon animationData={animOctopus} size={52} className="chat-header-octo" />
          <div>
            <h2>BuddyOcto Asistan</h2>
            <p>Harcamalarını doğal dille anlat, analiz edeyim</p>
          </div>
        </div>
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
            {msg.role === "assistant" && (
              <LottieIcon animationData={animOctopus} size={32} autoplay className="msg-avatar-lottie" />
            )}
            <div className="msg-bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="msg assistant">
            <LottieIcon animationData={animOctopus} size={32} autoplay className="msg-avatar-lottie" />
            <div className="msg-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-row">
        <LottieIcon
          animationData={animOctopus}
          size={38}
          externalTrigger={input.length > 0}
          className="input-octo"
        />
        <input
          className="chat-inp"
          placeholder='Örn: "Bugün kahvede 85 TL harcadım"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="chat-send" onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Gönder"}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;