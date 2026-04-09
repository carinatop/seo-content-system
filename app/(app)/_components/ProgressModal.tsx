"use client";
import { useEffect, useState } from "react";

export type ProgressState = {
  label: string;
  hint?: string;
  eta?: string;
  current?: number;
  total?: number;
  substatus?: string;
  error?: string | null;
} | null;

export default function ProgressModal({
  state,
  onClose,
  onRetry,
}: {
  state: ProgressState;
  onClose?: () => void;
  onRetry?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!state) { setElapsed(0); return; }
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state?.label]);

  if (!state) return null;
  const pct =
    state.current && state.total ? Math.round((state.current / state.total) * 100) : null;
  const isError = !!state.error;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={isError ? { borderColor: "var(--bad)" } : {}}>
        <div className="row" style={{ gap: 14, alignItems: "center", marginBottom: 14 }}>
          {!isError && <div className="spinner" />}
          {isError && <div style={{ fontSize: 24 }}>⚠</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {isError ? "Something went wrong" : state.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {elapsed}s elapsed{state.eta && ` · est ${state.eta}`}
            </div>
          </div>
        </div>

        {state.substatus && !isError && (
          <p style={{ color: "var(--text)", fontSize: 14, margin: "8px 0" }}>
            {state.substatus}
          </p>
        )}
        {state.hint && !isError && (
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, margin: "4px 0 12px" }}>
            {state.hint}
          </p>
        )}

        {pct !== null && !isError && (
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
        )}
        {pct === null && !isError && (
          <div className="progress-track">
            <div className="progress-bar indeterminate" />
          </div>
        )}

        {isError && (
          <>
            <p style={{ color: "var(--bad)", fontSize: 13, margin: "4px 0 16px", wordBreak: "break-word" }}>
              {state.error}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {onClose && <button className="ghost" onClick={onClose}>Close</button>}
              {onRetry && <button onClick={onRetry}>Retry</button>}
            </div>
          </>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(8,10,14,0.78);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; backdrop-filter: blur(4px);
        }
        .modal-card {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 28px 32px;
          min-width: 420px; max-width: 540px;
          box-shadow: 0 20px 60px rgba(0,0,0,.5);
        }
        .spinner {
          width: 26px; height: 26px;
          border: 3px solid var(--border); border-top-color: var(--accent);
          border-radius: 50%; animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .progress-track {
          width: 100%; height: 6px; background: #0f1318;
          border-radius: 999px; overflow: hidden; margin-top: 8px;
        }
        .progress-bar {
          height: 100%; background: var(--accent); transition: width .4s ease;
        }
        .progress-bar.indeterminate {
          width: 40%;
          animation: slide 1.4s ease-in-out infinite;
        }
        @keyframes slide {
          0%   { margin-left: -40%; }
          100% { margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
