"use client";
import { useState } from "react";

type Props = {
  brandId: string;
  onClose: () => void;
  onCreated: (pieceId: string) => void;
};

const WORD_OPTIONS = [
  { value: 800, label: "800 words — short read" },
  { value: 1200, label: "1200 words — standard" },
  { value: 1500, label: "1500 words — in-depth" },
  { value: 2000, label: "2000 words — long-form" },
  { value: 2500, label: "2500 words — pillar content" },
];

export default function NewArticleModal({ brandId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [wordCount, setWordCount] = useState<number>(1500);
  const [customWords, setCustomWords] = useState(false);
  const [contentType, setContentType] = useState("blog_seo");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/pieces", {
        method: "POST",
        body: JSON.stringify({
          brand_id: brandId,
          title,
          target_keyword: keyword,
          content_type: contentType,
          word_count_target: wordCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create piece");
      onCreated(data.piece.id);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ minWidth: 480 }}>
        <div className="row between" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>New article</h3>
          <button type="button" className="ghost" onClick={onClose} style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <label>Working title / topic</label>
          <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Employer payroll responsibilities in the UK" />

          <label>Target keyword</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. employer payroll uk" />

          <label>Article length</label>
          {!customWords ? (
            <select
              value={wordCount}
              onChange={(e) => {
                if (e.target.value === "custom") setCustomWords(true);
                else setWordCount(Number(e.target.value));
              }}
            >
              {WORD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              <option value="custom">Custom…</option>
            </select>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number" min={300} max={8000} step={100}
                value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))}
              />
              <button type="button" className="ghost" onClick={() => setCustomWords(false)}>Presets</button>
            </div>
          )}

          <label>Content type</label>
          <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
            <option value="blog_seo">Blog / SEO article</option>
            <option value="educational">Educational guide</option>
            <option value="newsletter">Newsletter</option>
            <option value="conversion">Conversion page</option>
          </select>

          {err && <p style={{ color: "var(--bad)", fontSize: 13, marginTop: 12 }}>{err}</p>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" disabled={busy}>{busy ? "Creating…" : "Create & start"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
