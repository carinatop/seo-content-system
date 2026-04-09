import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data: piece } = await sb.from("content_pieces").select("*").eq("id", id).single();
  if (!piece) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: artifacts } = await sb.from("artifacts").select("*").eq("piece_id", id).order("version", { ascending: false });
  const { data: qa } = await sb.from("qa_reports").select("*").eq("piece_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  const latest = (kind: string) => (artifacts ?? []).find((a) => a.kind === kind);
  const brief = latest("brief");
  const outline = latest("outline");
  const draft = latest("draft");
  const meta = latest("meta");

  return NextResponse.json({
    piece,
    brief: brief?.content_json ?? null,
    outline: outline?.content_json ?? null,
    draftMd: draft?.content_md ?? null,
    meta: meta?.content_json ?? null,
    qa: qa ?? null,
  });
}
