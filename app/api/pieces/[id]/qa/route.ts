import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assembleBrandContext, renderBrandPack } from "@/lib/brain/brandContext";
import { callJSON, MODELS } from "@/lib/anthropic";
import { qaSystem, qaUser } from "@/lib/prompts/qa";

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

  generateQA(id, piece, briefArt, draftArt).catch(async (err) => {
    console.error("qa error:", err);
    await supabaseAdmin().from("content_pieces").update({ status: "draft" }).eq("id", id);
  });

  return NextResponse.json({ status: "generating" });
}

async function generateQA(id: string, piece: any, briefArt: any, draftArt: any) {
  const sb = supabaseAdmin();
  const pack = await assembleBrandContext(piece.brand_id);
  const report = await callJSON<{
    scores: Record<string, number>;
    overall: number;
    verdict: "publish" | "revise" | "reject";
    evidence: Record<string, string>;
    revision_notes: string[];
  }>({
    model: MODELS.opus,
    system: qaSystem(renderBrandPack(pack)),
    user: qaUser({ brief: briefArt.content_json, draft_md: draftArt.content_md }),
    maxTokens: 2500,
  });

  await sb.from("qa_reports").insert({
    piece_id: id,
    artifact_id: draftArt.id,
    scores_json: report.scores,
    overall: report.overall,
    verdict: report.verdict,
    revision_notes: report.revision_notes,
  });

  await sb.from("content_pieces").update({
    qa_score_latest: report.overall,
    status: report.verdict === "publish" ? "approved" : "qa",
  }).eq("id", id);
}
