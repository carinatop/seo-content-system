import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assembleBrandContext, renderBrandPack } from "@/lib/brain/brandContext";
import { callJSON, MODELS } from "@/lib/anthropic";
import { metaSystem, metaUser } from "@/lib/prompts/meta";

export const maxDuration = 120;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data: piece } = await sb.from("content_pieces").select("*").eq("id", id).single();
  if (!piece) return NextResponse.json({ error: "piece not found" }, { status: 404 });

  const { data: briefArt } = await sb.from("artifacts").select("*").eq("piece_id", id).eq("kind", "brief").order("version", { ascending: false }).limit(1).maybeSingle();
  const { data: draftArt } = await sb.from("artifacts").select("*").eq("piece_id", id).eq("kind", "draft").order("version", { ascending: false }).limit(1).maybeSingle();
  if (!briefArt || !draftArt?.content_md) return NextResponse.json({ error: "brief and draft required" }, { status: 400 });

  await sb.from("content_pieces").update({ status: "generating" }).eq("id", id);

  generateMeta(id, piece, briefArt, draftArt).catch(async (err) => {
    console.error("meta error:", err);
    await supabaseAdmin().from("content_pieces").update({ status: "draft" }).eq("id", id);
  });

  return NextResponse.json({ status: "generating" });
}

async function generateMeta(id: string, piece: any, briefArt: any, draftArt: any) {
  const sb = supabaseAdmin();
  const pack = await assembleBrandContext(piece.brand_id);
  const meta = await callJSON<Record<string, unknown>>({
    model: MODELS.haiku,
    system: metaSystem(renderBrandPack(pack)),
    user: metaUser({ brief: briefArt.content_json, draft_md: draftArt.content_md }),
    maxTokens: 2500,
  });

  const { data: prev } = await sb.from("artifacts").select("version").eq("piece_id", id).eq("kind", "meta").order("version", { ascending: false }).limit(1);
  const version = (prev?.[0]?.version ?? 0) + 1;

  await sb.from("artifacts").insert({ piece_id: id, kind: "meta", version, content_json: meta, model: MODELS.haiku });
  await sb.from("content_pieces").update({ status: "meta" }).eq("id", id);
}
