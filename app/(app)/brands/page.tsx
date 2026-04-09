"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingModal from "../_components/LoadingModal";
import VoiceSamplesUploader, { LocalSample } from "../_components/VoiceSamplesUploader";

type Brand = { id: string; name: string; niche: string | null };

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState({
    name: "", niche: "", audience: "", tone: "", banned: "", preferred: "",
    products: "", cta_style: "soft", seo_notes: "",
  });
  const [samples, setSamples] = useState<LocalSample[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/brands").then((r) => r.json());
    setBrands(r.brands || []);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    try {
      const body = {
        name: form.name,
        niche: form.niche,
        audience: { description: form.audience },
        tone: { adjectives: form.tone.split(",").map((s) => s.trim()).filter(Boolean) },
        voice_rules: {
          banned: form.banned.split(",").map((s) => s.trim()).filter(Boolean),
          preferred: form.preferred.split(",").map((s) => s.trim()).filter(Boolean),
        },
        commercial: { products: form.products, cta_style: form.cta_style },
        seo_notes: form.seo_notes,
      };
      const res = await fetch("/api/brands", { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create brand");

      // upload any voice samples
      if (samples.length && data.brand?.id) {
        setBusy("sample");
        for (const s of samples) {
          await fetch(`/api/brands/${data.brand.id}/samples`, {
            method: "POST",
            body: JSON.stringify(s),
          });
        }
      }

      setForm({ name: "", niche: "", audience: "", tone: "", banned: "", preferred: "", products: "", cta_style: "soft", seo_notes: "" });
      setSamples([]);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <LoadingModal busy={busy} />
      <h2>Brands</h2>
      <p className="sub">Each brand is an isolated Brain powering generation.</p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Add brand</h3>
        <form onSubmit={create}>
          <label>Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Niche</label>
          <input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
          <label>Audience description</label>
          <textarea value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
          <label>Tone adjectives (comma-separated)</label>
          <input placeholder="direct, warm, practical" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} />
          <label>Banned phrases</label>
          <input placeholder="leverage, unlock, in today's world" value={form.banned} onChange={(e) => setForm({ ...form, banned: e.target.value })} />
          <label>Preferred phrases</label>
          <input value={form.preferred} onChange={(e) => setForm({ ...form, preferred: e.target.value })} />
          <label>Products / offers</label>
          <textarea value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} />
          <label>CTA style</label>
          <select value={form.cta_style} onChange={(e) => setForm({ ...form, cta_style: e.target.value })}>
            <option value="soft">soft</option>
            <option value="mid">mid</option>
            <option value="hard">hard</option>
          </select>
          <label>SEO notes</label>
          <textarea value={form.seo_notes} onChange={(e) => setForm({ ...form, seo_notes: e.target.value })} />

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <h4 style={{ margin: "0 0 6px" }}>Voice samples / reference articles</h4>
            <VoiceSamplesUploader samples={samples} onChange={setSamples} />
          </div>

          <div style={{ marginTop: 20 }}>
            <button disabled={!!busy}>Create brand</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Your brands</h3>
        <table>
          <thead><tr><th>Name</th><th>Niche</th><th></th></tr></thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.niche}</td>
                <td><Link href={`/brands/${b.id}`}>Open →</Link></td>
              </tr>
            ))}
            {brands.length === 0 && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>No brands yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
