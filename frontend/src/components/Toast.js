import { useEffect } from "react";

/**
 * Shared glass-morphism toast notification.
 */
export default function Toast({ message, type, show, onDismiss }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onDismiss?.(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className={`glass-toast glass-toast-${type} ${show ? "glass-toast-show" : ""}`}>
      <span className="glass-toast-icon">
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      {message}
    </div>
  );
}
