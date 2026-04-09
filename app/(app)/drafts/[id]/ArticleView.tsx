"use client";
import { useState } from "react";

type Props = {
  piece: any;
  brief: any;
  outline: any;
  draftMd: string | null;
  meta: any;
  qa: any;
};

/** Minimal markdown → HTML renderer (headings, paragraphs, bold, italic, links, lists). */
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // headings
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // unordered lists
  html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (_m, block) => {
    const items = block
      .trim()
      .split("\n")
      .map((l: string) => `<li>${l.replace(/^- /, "")}</li>`)
      .join("");
    return `\n<ul>${items}</ul>\n`;
  });

  // paragraphs
  html = html
    .split(/\n{2,}/)
    .map((chunk) => {
      if (/^\s*<(h\d|ul|ol|li|pre|blockquote)/.test(chunk)) return chunk;
      if (!chunk.trim()) return "";
      return `<p>${chunk.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");

  return html;
}

export default function ArticleView({ piece, brief, outline, draftMd, meta, qa }: Props) {
  const [tab, setTab] = useState<"article" | "meta" | "brief" | "outline" | "qa">("article");

  const title = meta?.meta_title || brief?.working_title || piece.title;
  const html = draftMd ? renderMarkdown(draftMd) : "";

  async function copyMd() {
    if (!draftMd) return;
    await navigator.clipboard.writeText(draftMd);
    alert("Markdown copied to clipboard");
  }
  function downloadMd() {
    if (!draftMd) return;
    const blob = new Blob([draftMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "article").replace(/[^\w-]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function downloadHtml() {
    if (!draftMd) return;
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7;color:#222}
h1{font-size:32px;margin-bottom:8px}h2{font-size:24px;margin-top:36px}h3{font-size:18px}
p{margin:14px 0}a{color:#2563eb}ul{padding-left:22px}li{margin:6px 0}
.meta{color:#666;font-size:14px;border-bottom:1px solid #eee;padding-bottom:16px;margin-bottom:24px}
</style></head><body>
<div class="meta">${meta?.meta_description ?? ""}</div>
${html}
</body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "article").replace(/[^\w-]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function printPdf() {
    if (!draftMd) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7;color:#222}
h1{font-size:32px}h2{font-size:24px;margin-top:32px}h3{font-size:18px}
p{margin:14px 0}a{color:#2563eb}ul{padding-left:22px}
.meta{color:#666;font-size:14px;border-bottom:1px solid #eee;padding-bottom:16px;margin-bottom:24px}
@media print { body { margin: 0; } }
</style></head><body>
<div class="meta">${meta?.meta_description ?? ""}</div>
${html}
<script>setTimeout(() => window.print(), 300);</script>
</body></html>`);
    w.document.close();
  }

  return (
    <>
      <h2>{piece.title}</h2>
      <p className="sub">
        <span className="badge">{piece.status}</span>{" "}
        {qa && (
          <span className={`badge ${qa.verdict === "publish" ? "good" : qa.verdict === "revise" ? "warn" : "bad"}`}>
            QA {qa.overall} · {qa.verdict}
          </span>
        )}
      </p>

      <div className="row" style={{ gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {(["article", "meta", "brief", "outline", "qa"] as const).map((t) => (
          <button key={t} className={tab === t ? "" : "ghost"} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "article" && (
        <>
          <div className="card">
            <div className="row between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <strong>Publish-ready article</strong>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="ghost" onClick={copyMd} disabled={!draftMd}>Copy markdown</button>
                <button className="ghost" onClick={downloadMd} disabled={!draftMd}>Download .md</button>
                <button className="ghost" onClick={downloadHtml} disabled={!draftMd}>Download .html</button>
                <button onClick={printPdf} disabled={!draftMd}>Print / Save as PDF</button>
              </div>
            </div>
            {draftMd ? (
              <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p style={{ color: "var(--muted)" }}>No draft yet. Run brief → outline → draft from the brand page.</p>
            )}
          </div>
          <style>{`
            .article { font-family: Georgia, serif; line-height: 1.75; font-size: 15.5px; color: #d7dde6; max-width: 720px; }
            .article h1 { font-size: 30px; margin: 0 0 12px; color: #fff; }
            .article h2 { font-size: 22px; margin: 32px 0 10px; color: #fff; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
            .article h3 { font-size: 17px; margin: 24px 0 8px; color: #fff; }
            .article p { margin: 14px 0; }
            .article a { color: var(--accent); }
            .article ul { padding-left: 22px; margin: 14px 0; }
            .article li { margin: 6px 0; }
            .article strong { color: #fff; }
          `}</style>
        </>
      )}

      {tab === "meta" && (
        <div className="card">
          {meta ? (
            <>
              <h3 style={{ marginTop: 0 }}>Title options</h3>
              <ul>{(meta.titles ?? []).map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
              <h3>Meta title</h3>
              <p>{meta.meta_title}</p>
              <h3>Meta description</h3>
              <p>{meta.meta_description}</p>
              <h3>FAQs</h3>
              {(meta.faqs ?? []).map((f: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <strong>Q: {f.q}</strong>
                  <p style={{ margin: "4px 0 0" }}>A: {f.a}</p>
                </div>
              ))}
              <h3>CTAs</h3>
              <p><strong>Soft:</strong> {meta.ctas?.soft}</p>
              <p><strong>Mid:</strong> {meta.ctas?.mid}</p>
              <p><strong>Hard:</strong> {meta.ctas?.hard}</p>
            </>
          ) : <p style={{ color: "var(--muted)" }}>No metadata yet. Run the meta step.</p>}
        </div>
      )}

      {tab === "brief" && <div className="card"><pre>{brief ? JSON.stringify(brief, null, 2) : "No brief yet."}</pre></div>}
      {tab === "outline" && <div className="card"><pre>{outline ? JSON.stringify(outline, null, 2) : "No outline yet."}</pre></div>}
      {tab === "qa" && (
        <div className="card">
          {qa ? (
            <>
              <h3 style={{ marginTop: 0 }}>QA Report — {qa.verdict}</h3>
              <p>Overall score: <strong>{qa.overall}</strong></p>
              <h4>Scores</h4>
              <pre>{JSON.stringify(qa.scores_json, null, 2)}</pre>
              <h4>Revision notes</h4>
              <ul>{(qa.revision_notes ?? []).map((n: string, i: number) => <li key={i}>{n}</li>)}</ul>
            </>
          ) : <p style={{ color: "var(--muted)" }}>No QA report yet. Run the qa step.</p>}
        </div>
      )}
    </>
  );
}
