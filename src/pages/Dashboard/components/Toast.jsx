import { useState, useCallback, useEffect, useRef } from "react";
import "./Toast.css";

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = "info", duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Shortcuts
  const success = (msg, opts) => addToast({ message: msg, type: "success", ...opts });
  const error   = (msg, opts) => addToast({ message: msg, type: "error",   ...opts });
  const warning = (msg, opts) => addToast({ message: msg, type: "warning", ...opts });
  const info    = (msg, opts) => addToast({ message: msg, type: "info",    ...opts });

  return { toasts, removeToast, success, error, warning, info };
};

// ── Single Toast Item ─────────────────────────────────────────────────────────
const ToastItem = ({ id, message, type, duration, onRemove }) => {
  const timerRef = useRef(null);
  const [leaving, setLeaving] = useState(false);

  const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(id), 350);
  }, [id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, duration]);

  return (
    <div className={`toast toast--${type} ${leaving ? "toast--leave" : "toast--enter"}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={dismiss}>×</button>
    </div>
  );
};

// ── Toast Container ───────────────────────────────────────────────────────────
export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <ToastItem key={t.id} {...t} onRemove={removeToast} />
    ))}
  </div>
);

// ── Demo export (sadece test için) ────────────────────────────────────────────
export default ToastContainer;