"use client";
import { useEffect, useState } from "react";

const STEP_INFO: Record<string, { label: string; hint: string; eta: string }> = {
  create: { label: "Creating brand", hint: "Saving Brand Brain to database…", eta: "~2s" },
  sample: { label: "Uploading sample", hint: "Storing voice reference…", eta: "~1s" },
  piece: { label: "Creating content piece", hint: "Saving piece to database…", eta: "~1s" },
  brief: { label: "Generating SEO brief", hint: "Claude Opus is analyzing the topic, audience, and brand voice to produce a structured brief.", eta: "~30–60s" },
  outline: { label: "Generating outline", hint: "Claude Opus is building heading structure, entity coverage, and link slots.", eta: "~30–60s" },
  draft: { label: "Drafting article", hint: "Claude Opus is writing each section sequentially to keep voice consistent. This is the longest step.", eta: "~2–4 min" },
  meta: { label: "Generating titles, meta, FAQs, CTAs", hint: "Claude Haiku is producing 5 title options, meta description, FAQs, and CTA variants.", eta: "~20–40s" },
  qa: { label: "Running QA scoring", hint: "Claude Opus is scoring 10 dimensions and giving a publish/revise verdict.", eta: "~20–40s" },
};

export default function LoadingModal({ busy }: { busy: string | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  if (!busy) return null;
  const step = busy.includes(":") ? busy.split(":")[1] : busy;
  const info = STEP_INFO[step] ?? { label: step, hint: "Working…", eta: "" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,10,14,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "32px 36px",
          minWidth: 380,
          maxWidth: 500,
          boxShadow: "0 20px 60px rgba(0,0,0,.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div className="spinner" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{info.label}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {elapsed}s elapsed{info.eta && ` · est ${info.eta}`}
            </div>
          </div>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{info.hint}</p>
      </div>
      <style>{`
        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
