import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assembleBrandContext, renderBrandPack } from "@/lib/brain/brandContext";
import { callJSON, MODELS } from "@/lib/anthropic";
import { outlineSystem, outlineUser } from "@/lib/prompts/outline";

export const maxDuration = 120;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data: piece } = await sb.from("content_pieces").select("*").eq("id", id).single();
  if (!piece) return NextResponse.json({ error: "piece not found" }, { status: 404 });

  const { data: briefArt } = await sb.from("artifacts").select("*").eq("piece_id", id).eq("kind", "brief").order("version", { ascending: false }).limit(1).maybeSingle();
  if (!briefArt) return NextResponse.json({ error: "brief required first" }, { status: 400 });

  await sb.from("content_pieces").update({ status: "generating" }).eq("id", id);

  generateOutline(id, piece, briefArt).catch(async (err) => {
    console.error("outline error:", err);
    await supabaseAdmin().from("content_pieces").update({ status: "brief" }).eq("id", id);
  });

  return NextResponse.json({ status: "generating" });
}

async function generateOutline(id: string, piece: any, briefArt: any) {
  const sb = supabaseAdmin();
  const pack = await assembleBrandContext(piece.brand_id);
  const outline = await callJSON<Record<string, unknown>>({
    model: MODELS.opus,
    system: outlineSystem(renderBrandPack(pack)),
    user: outlineUser(briefArt.content_json),
    maxTokens: 3500,
  });

  const { data: prev } = await sb.from("artifacts").select("version").eq("piece_id", id).eq("kind", "outline").order("version", { ascending: false }).limit(1);
  const version = (prev?.[0]?.version ?? 0) + 1;

  await sb.from("artifacts").insert({ piece_id: id, kind: "outline", version, content_json: outline, model: MODELS.opus });
  await sb.from("content_pieces").update({ status: "outline" }).eq("id", id);
}
