import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assembleBrandContext, renderBrandPack } from "@/lib/brain/brandContext";
import { callJSON, MODELS } from "@/lib/anthropic";
import { briefSystem, briefUser } from "@/lib/prompts/brief";

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();

  const { data: piece, error } = await sb.from("content_pieces").select("*").eq("id", id).single();
  if (error || !piece) return NextResponse.json({ error: "piece not found" }, { status: 404 });

  // Mark generating and return immediately
  await sb.from("content_pieces").update({ status: "generating" }).eq("id", id);

  generateBrief(id, piece, body).catch(async (err) => {
    console.error("brief error:", err);
    await supabaseAdmin().from("content_pieces").update({ status: "idea" }).eq("id", id);
  });

  return NextResponse.json({ status: "generating" });
}

async function generateBrief(id: string, piece: any, body: any) {
  const sb = supabaseAdmin();
  const pack = await assembleBrandContext(piece.brand_id);
  const system = briefSystem(renderBrandPack(pack));
  const user = briefUser({
    topic: body.topic ?? piece.title,
    primary_keyword: body.primary_keyword ?? piece.target_keyword,
    intent: body.intent,
    funnel_stage: body.funnel_stage,
    content_type: body.content_type ?? piece.content_type,
    word_count_target: piece.word_count_target ?? 1500,
  });

  const brief = await callJSON<Record<string, unknown>>({ model: MODELS.opus, system, user, maxTokens: 3000 });

  const { data: prev } = await sb.from("artifacts").select("version").eq("piece_id", id).eq("kind", "brief").order("version", { ascending: false }).limit(1);
  const version = (prev?.[0]?.version ?? 0) + 1;

  await sb.from("artifacts").insert({ piece_id: id, kind: "brief", version, content_json: brief, model: MODELS.opus });
  await sb.from("content_pieces").update({ status: "brief" }).eq("id", id);
}
