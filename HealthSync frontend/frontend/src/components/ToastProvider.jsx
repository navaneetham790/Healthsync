import { createContext, useCallback, useContext, useEffect, useState } from "react";
import "./ToastProvider.css";
const ToastContext = createContext(null);
let publish;
export const notify = {
  success: (message) => publish?.(message, "success"), error: (message) => publish?.(message, "error"),
  warning: (message) => publish?.(message, "warning"), info: (message) => publish?.(message, "info"),
};
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID(); setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000);
  }, []);
  useEffect(() => { publish = addToast; return () => { publish = undefined; }; }, [addToast]);
  return <ToastContext.Provider value={addToast}>{children}<div className="toast-region" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div className={`toast toast--${toast.type}`} key={toast.id} role="status"><span>{toast.message}</span><button aria-label="Dismiss notification" onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}>×</button></div>)}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
