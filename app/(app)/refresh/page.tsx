export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function RefreshPage() {
  const sb = supabaseAdmin();
  const { data: candidates } = await sb
    .from("refresh_candidates")
    .select("*, content_pieces(title, target_keyword, final_url)")
    .is("resolved_at", null)
    .order("priority", { ascending: true });

  return (
    <>
      <h2>Refresh Queue</h2>
      <p className="sub">Published pieces flagged for update.</p>
      <div className="card">
        <table>
          <thead>
            <tr><th>Priority</th><th>Title</th><th>Reasons</th><th>Detected</th></tr>
          </thead>
          <tbody>
            {(candidates ?? []).map((c: any) => (
              <tr key={c.id}>
                <td><span className="badge">{c.priority}</span></td>
                <td>{c.content_pieces?.title ?? c.piece_id}</td>
                <td>{(c.reasons ?? []).join(", ")}</td>
                <td>{new Date(c.detected_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(candidates ?? []).length === 0 && (
              <tr><td colSpan={4} style={{ color: "var(--muted)" }}>
                No refresh candidates. Run the refresh scan (Phase 7 — not yet built).
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
