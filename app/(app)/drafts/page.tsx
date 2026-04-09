export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AllArticlesPage() {
  const sb = supabaseAdmin();
  const { data: pieces } = await sb
    .from("content_pieces")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: brands } = await sb.from("brands").select("id, name");
  const brandMap = new Map((brands ?? []).map((b) => [b.id, b.name]));

  return (
    <>
      <h2>All articles</h2>
      <p className="sub">Every article across all brands.</p>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Title</th><th>Brand</th><th>Keyword</th><th>Status</th><th>QA</th></tr>
          </thead>
          <tbody>
            {(pieces ?? []).map((p) => (
              <tr key={p.id}>
                <td><Link href={`/drafts/${p.id}`}>{p.title}</Link></td>
                <td style={{ color: "var(--muted)" }}>{brandMap.get(p.brand_id) ?? "—"}</td>
                <td style={{ color: "var(--muted)" }}>{p.target_keyword}</td>
                <td><span className="badge">{p.status}</span></td>
                <td>{p.qa_score_latest ?? "—"}</td>
              </tr>
            ))}
            {(pieces ?? []).length === 0 && (
              <tr><td colSpan={5} style={{ color: "var(--muted)", textAlign: "center", padding: 32 }}>No articles yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
