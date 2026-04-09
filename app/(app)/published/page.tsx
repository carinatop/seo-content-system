import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function PublishedPage() {
  const sb = supabaseAdmin();
  const { data: pieces } = await sb
    .from("content_pieces")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <>
      <h2>Published</h2>
      <p className="sub">Finalized content with live URLs.</p>
      <div className="card">
        <table>
          <thead>
            <tr><th>Title</th><th>Keyword</th><th>URL</th><th>Last refresh</th></tr>
          </thead>
          <tbody>
            {(pieces ?? []).map((p) => (
              <tr key={p.id}>
                <td><Link href={`/drafts/${p.id}`}>{p.title}</Link></td>
                <td>{p.target_keyword}</td>
                <td>{p.final_url ? <a href={p.final_url} target="_blank">↗ open</a> : "—"}</td>
                <td>{p.last_refresh_at ?? "—"}</td>
              </tr>
            ))}
            {(pieces ?? []).length === 0 && (
              <tr><td colSpan={4} style={{ color: "var(--muted)" }}>No published pieces yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
