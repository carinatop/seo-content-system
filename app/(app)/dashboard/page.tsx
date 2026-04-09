export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function Dashboard() {
  const sb = supabaseAdmin();
  const [{ count: brands }, { count: pieces }, { count: drafts }] = await Promise.all([
    sb.from("brands").select("*", { count: "exact", head: true }),
    sb.from("content_pieces").select("*", { count: "exact", head: true }),
    sb.from("content_pieces").select("*", { count: "exact", head: true }).eq("status", "draft"),
  ]);

  return (
    <>
      <h2>Overview</h2>
      <p className="sub">Your SEO content system at a glance.</p>
      <div className="row" style={{ gap: 16 }}>
        <div className="card" style={{ flex: 1 }}><div className="sub" style={{ marginBottom: 4 }}>Brands</div><div style={{ fontSize: 32 }}>{brands ?? 0}</div></div>
        <div className="card" style={{ flex: 1 }}><div className="sub" style={{ marginBottom: 4 }}>Pieces</div><div style={{ fontSize: 32 }}>{pieces ?? 0}</div></div>
        <div className="card" style={{ flex: 1 }}><div className="sub" style={{ marginBottom: 4 }}>Drafts awaiting review</div><div style={{ fontSize: 32 }}>{drafts ?? 0}</div></div>
      </div>
    </>
  );
}
