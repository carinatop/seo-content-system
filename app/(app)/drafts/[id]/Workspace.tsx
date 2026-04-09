"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import ProgressModal, { ProgressState } from "../../_components/ProgressModal";
import ArticleView from "./ArticleView";

type StepKey = "brief" | "outline" | "draft" | "meta" | "qa";

const STEPS: { key: StepKey; label: string; desc: string; eta: string }[] = [
  { key: "brief",   label: "Brief",   desc: "Claude Opus analyzes the topic, audience, and brand voice to produce a structured SEO brief with keywords, entities, and angle.", eta: "~30–60s" },
  { key: "outline", label: "Outline", desc: "Claude Opus builds the heading structure, section word budgets, entity coverage, and link slots.", eta: "~30–60s" },
  { key: "draft",   label: "Draft",   desc: "Claude Opus writes each section sequentially to keep voice consistent. This is the longest step.", eta: "~2–4 min" },
  { key: "meta",    label: "Meta",    desc: "Claude Haiku produces 5 title options, meta description, FAQs, and CTA variants.", eta: "~20–40s" },
  { key: "qa",      label: "QA",      desc: "Claude Opus scores 10 dimensions and gives a publish/revise verdict with revision notes.", eta: "~20–40s" },
];

// Map piece.status → the step that just completed
const STATUS_TO_COMPLETED_STEP: Record<string, StepKey | null> = {
  idea: null, generating: null,
  brief: "brief", outline: "outline", draft: "draft", meta: "meta",
  qa: "qa", approved: "qa", published: "qa",
};

type Data = {
  piece: any;
  brief: any;
  outline: any;
  draftMd: string | null;
  meta: any;
  qa: any;
};

export default function Workspace({ pieceId }: { pieceId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [activeStep, setActiveStep] = useState<StepKey>("brief");
  const [progress, setProgress] = useState<ProgressState>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/pieces/${pieceId}/state`).then((r) => r.json());
    setData(r);
    return r;
  }, [pieceId]);

  // Auto-set step based on loaded data
  function syncStep(r: Data) {
    const done: Record<StepKey, boolean> = {
      brief: !!r.brief, outline: !!r.outline, draft: !!r.draftMd, meta: !!r.meta, qa: !!r.qa,
    };
    const next = STEPS.find((s) => !done[s.key])?.key ?? "qa";
    setActiveStep(next);
  }

  useEffect(() => { load().then(syncStep); }, [load]);

  const completed: Record<StepKey, boolean> = data ? {
    brief: !!data.brief, outline: !!data.outline, draft: !!data.draftMd, meta: !!data.meta, qa: !!data.qa,
  } : { brief: false, outline: false, draft: false, meta: false, qa: false };

  const isGenerating = data?.piece?.status === "generating";

  // Poll while generating
  function startPolling(stepKey: StepKey) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const r = await load();
      const status = r.piece?.status;
      // Still generating? Keep polling
      if (status === "generating") return;
      // Done or error — stop polling
      stopPolling();
      setProgress(null);
      syncStep(r);
    }, 3000);
  }
  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }
  useEffect(() => () => stopPolling(), []);

  async function runStep(step: StepKey) {
    const info = STEPS.find((s) => s.key === step)!;
    setProgress({ label: `Generating ${info.label.toLowerCase()}…`, hint: info.desc, eta: info.eta });
    try {
      const res = await fetch(`/api/pieces/${pieceId}/${step}`, { method: "POST", body: "{}" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      // API returns immediately — start polling for completion
      startPolling(step);
    } catch (e: any) {
      setProgress((p) => ({ ...(p ?? { label: "" }), error: e.message || String(e) }));
    }
  }

  if (!data) return <p>Loading workspace…</p>;
  const piece = data.piece;

  return (
    <>
      <ProgressModal
        state={progress}
        onClose={() => { setProgress(null); stopPolling(); }}
        onRetry={() => runStep(activeStep)}
      />

      <div style={{ marginBottom: 8 }}>
        <Link href={`/brands/${piece.brand_id}`} style={{ fontSize: 13, color: "var(--muted)" }}>← Back to brand</Link>
      </div>
      <h2 style={{ marginBottom: 4 }}>{piece.title}</h2>
      <p className="sub">
        <span className="badge">{piece.status}</span>
        {piece.target_keyword && <> · <span style={{ color: "var(--muted)" }}>keyword: {piece.target_keyword}</span></>}
        {piece.word_count_target && <> · <span style={{ color: "var(--muted)" }}>{piece.word_count_target} words</span></>}
      </p>

      <Stepper active={activeStep} completed={completed} onJump={(s) => {
        if (completed[s] || s === STEPS.find((x) => !completed[x.key])?.key) setActiveStep(s);
      }} />

      <StepPanel
        step={activeStep}
        completed={completed}
        data={data}
        onRun={() => runStep(activeStep)}
        generating={isGenerating}
      />
    </>
  );
}

function Stepper({
  active, completed, onJump,
}: {
  active: StepKey;
  completed: Record<StepKey, boolean>;
  onJump: (s: StepKey) => void;
}) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => {
        const isDone = completed[s.key];
        const isActive = s.key === active;
        const clickable = isDone || isActive;
        return (
          <div key={s.key} className={`step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
            <button
              type="button"
              className="step-circle"
              disabled={!clickable}
              onClick={() => onJump(s.key)}
              aria-label={s.label}
            >
              {isDone ? "✓" : i + 1}
            </button>
            <div className="step-label">{s.label}</div>
            {i < STEPS.length - 1 && <div className={`step-bar ${isDone ? "done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

function StepPanel({
  step, completed, data, onRun, generating,
}: {
  step: StepKey;
  completed: Record<StepKey, boolean>;
  data: Data;
  onRun: () => void;
  generating: boolean;
}) {
  const info = STEPS.find((s) => s.key === step)!;
  const done = completed[step];

  if (!done) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 32px" }}>
        <div style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>
          Step {STEPS.findIndex((s) => s.key === step) + 1} of {STEPS.length}
        </div>
        <h3 style={{ margin: "0 0 12px", fontSize: 22 }}>{info.label}</h3>
        <p style={{ color: "var(--muted)", maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.6 }}>
          {info.desc}
        </p>
        <button onClick={onRun} disabled={generating} style={{ padding: "12px 28px", fontSize: 15 }}>
          {generating ? "Generating…" : `▶ Run ${info.label.toLowerCase()}`}
          {!generating && <span style={{ opacity: .7, marginLeft: 6 }}>· {info.eta}</span>}
        </button>
      </div>
    );
  }

  if (step === "qa" && completed.qa) {
    return <ArticleView piece={data.piece} brief={data.brief} outline={data.outline} draftMd={data.draftMd} meta={data.meta} qa={data.qa} />;
  }

  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 16 }}>
        <strong>{info.label} — completed</strong>
        <button className="ghost" onClick={onRun} disabled={generating}>↻ Regenerate</button>
      </div>
      {step === "brief" && <pre>{JSON.stringify(data.brief, null, 2)}</pre>}
      {step === "outline" && <pre>{JSON.stringify(data.outline, null, 2)}</pre>}
      {step === "draft" && data.draftMd && (
        <ArticleView piece={data.piece} brief={data.brief} outline={data.outline} draftMd={data.draftMd} meta={data.meta} qa={data.qa} />
      )}
      {step === "meta" && data.meta && (
        <>
          <h4 style={{ marginTop: 0 }}>Title options</h4>
          <ul>{(data.meta.titles ?? []).map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
          <h4>Meta title</h4><p>{data.meta.meta_title}</p>
          <h4>Meta description</h4><p>{data.meta.meta_description}</p>
          <h4>FAQs</h4>
          {(data.meta.faqs ?? []).map((f: any, i: number) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <strong>Q: {f.q}</strong>
              <p style={{ margin: "4px 0 0" }}>A: {f.a}</p>
            </div>
          ))}
          <h4>CTAs</h4>
          <p><strong>Soft:</strong> {data.meta.ctas?.soft}</p>
          <p><strong>Mid:</strong> {data.meta.ctas?.mid}</p>
          <p><strong>Hard:</strong> {data.meta.ctas?.hard}</p>
        </>
      )}
    </div>
  );
}
