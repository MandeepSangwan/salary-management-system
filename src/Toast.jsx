import { useState, useCallback, useEffect, useRef } from 'react';

// ── Toast Context / Hook ──────────────────────────────────────────────────────
let _toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 280);
    }, duration);
  }, []);

  return { toasts, addToast };
}

// ── Toast Component ───────────────────────────────────────────────────────────
const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}${t.exiting ? ' exiting' : ''}`}
          role="status"
        >
          <span style={{ fontWeight: 800, fontSize: 16 }}>{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
