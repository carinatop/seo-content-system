"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressModal, { ProgressState } from "../../_components/ProgressModal";
import VoiceSamplesUploader, { LocalSample } from "../../_components/VoiceSamplesUploader";
import NewArticleModal from "../../_components/NewArticleModal";

type Tab = "articles" | "voice" | "brain";

export default function BrandDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("articles");
  const [brand, setBrand] = useState<any>(null);
  const [pieces, setPieces] = useState<any[]>([]);
  const [savedSamples, setSavedSamples] = useState<any[]>([]);
  const [newSamples, setNewSamples] = useState<LocalSample[]>([]);
  const [progress, setProgress] = useState<ProgressState>(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const b = await fetch(`/api/brands/${id}`).then((r) => r.json());
    setBrand(b.brand);
    const p = await fetch(`/api/pieces?brand=${id}`).then((r) => r.json());
    setPieces(p.pieces || []);
    const s = await fetch(`/api/brands/${id}/samples`).then((r) => r.json());
    setSavedSamples(s.samples || []);
  }
  useEffect(() => { load(); }, [id]);

  async function uploadSamples() {
    if (!newSamples.length) return;
    setProgress({ label: "Uploading samples", hint: "Storing voice references…", eta: "~2s" });
    try {
      for (const s of newSamples) {
        await fetch(`/api/brands/${id}/samples`, { method: "POST", body: JSON.stringify(s) });
      }
      setNewSamples([]);
      setProgress(null);
      load();
    } catch (e: any) {
      setProgress({ label: "", error: e.message });
    }
  }

  async function deleteSample(sid: string) {
    await fetch(`/api/brands/${id}/samples?sample_id=${sid}`, { method: "DELETE" });
    load();
  }

  if (!brand) return <p>Loading…</p>;

  const progressPct = (p: any) => {
    const order = ["idea", "brief", "outline", "draft", "qa", "published"];
    const i = order.indexOf(p.status);
    return Math.max(0, i) / (order.length - 1);
  };

  return (
    <>
      <ProgressModal state={progress} onClose={() => setProgress(null)} />
      {showNew && (
        <NewArticleModal
          brandId={id}
          onClose={() => setShowNew(false)}
          onCreated={(pid) => router.push(`/drafts/${pid}`)}
        />
      )}

      <div style={{ marginBottom: 8 }}>
        <Link href="/brands" style={{ fontSize: 13, color: "var(--muted)" }}>← All brands</Link>
      </div>
      <h2 style={{ marginBottom: 4 }}>{brand.name}</h2>
      <p className="sub">{brand.niche}</p>

      <div className="tabs">
        <button className={tab === "articles" ? "tab active" : "tab"} onClick={() => setTab("articles")}>Articles</button>
        <button className={tab === "voice" ? "tab active" : "tab"} onClick={() => setTab("voice")}>Voice samples</button>
        <button className={tab === "brain" ? "tab active" : "tab"} onClick={() => setTab("brain")}>Brand brain</button>
      </div>

      {tab === "articles" && (
        <>
          <div className="row between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Articles</h3>
              <p className="sub" style={{ margin: "4px 0 0" }}>Each article opens in a guided workspace.</p>
            </div>
            <button onClick={() => setShowNew(true)}>+ New article</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr><th>Title</th><th>Keyword</th><th>Length</th><th>Progress</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {pieces.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                    <td style={{ color: "var(--muted)" }}>{p.target_keyword || "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{p.word_count_target || 1500}</td>
                    <td style={{ width: 120 }}>
                      <div className="progress-track" style={{ margin: 0 }}>
                        <div className="progress-bar" style={{ width: `${progressPct(p) * 100}%` }} />
                      </div>
                    </td>
                    <td><span className="badge">{p.status}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/drafts/${p.id}`}>Open workspace →</Link>
                    </td>
                  </tr>
                ))}
                {pieces.length === 0 && (
                  <tr><td colSpan={6} style={{ color: "var(--muted)", textAlign: "center", padding: 32 }}>
                    No articles yet. Click <strong>+ New article</strong> to start.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "voice" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Voice samples / reference articles</h3>
          <p className="sub">Upload past articles (.txt, .md) or paste them. Claude uses them to match your voice.</p>

          {savedSamples.length > 0 && (
            <table style={{ marginBottom: 20 }}>
              <thead><tr><th>Title</th><th>Length</th><th></th></tr></thead>
              <tbody>
                {savedSamples.map((s) => (
                  <tr key={s.id}>
                    <td>{s.title || "(untitled)"}</td>
                    <td style={{ color: "var(--muted)" }}>{s.body.length} chars</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="ghost" onClick={() => deleteSample(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <VoiceSamplesUploader samples={newSamples} onChange={setNewSamples} compact />
          {newSamples.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button onClick={uploadSamples}>Upload {newSamples.length} sample(s)</button>
            </div>
          )}
        </div>
      )}

      {tab === "brain" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Brand brain</h3>
          <p className="sub">The context pack injected into every generation.</p>
          <pre>{JSON.stringify({
            name: brand.name,
            niche: brand.niche,
            audience: brand.audience_json,
            tone: brand.tone_json,
            voice_rules: brand.voice_rules_json,
            commercial: brand.commercial_json,
            seo_notes: brand.seo_notes,
          }, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
