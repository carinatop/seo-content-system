import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assembleBrandContext, renderBrandPack } from "@/lib/brain/brandContext";
import { callMarkdown, MODELS } from "@/lib/anthropic";
import { draftSystem, draftSectionUser } from "@/lib/prompts/draft";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel-specific, ignored on Netlify

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();

  // Mark as generating immediately
  await sb.from("content_pieces").update({ status: "generating" }).eq("id", id);

  // Fire off the actual generation without awaiting (runs in background)
  generateDraft(id).catch(async (err) => {
    console.error("draft generation failed:", err);
    // Revert status so user can retry
    await sb.from("content_pieces").update({ status: "outline" }).eq("id", id);
  });

  return NextResponse.json({ status: "generating", message: "Draft generation started. Poll /state for updates." });
}

async function generateDraft(id: string) {
  const sb = supabaseAdmin();
  const { data: piece } = await sb.from("content_pieces").select("*").eq("id", id).single();
  if (!piece) throw new Error("piece not found");

  const { data: briefArt } = await sb.from("artifacts").select("*").eq("piece_id", id).eq("kind", "brief").order("version", { ascending: false }).limit(1).maybeSingle();
  const { data: outlineArt } = await sb.from("artifacts").select("*").eq("piece_id", id).eq("kind", "outline").order("version", { ascending: false }).limit(1).maybeSingle();
  if (!briefArt || !outlineArt) throw new Error("brief and outline required");

  const brief = briefArt.content_json as any;
  const outline = outlineArt.content_json as any;
  const sections: any[] = outline?.sections ?? [];
  if (!sections.length) throw new Error("outline has no sections");

  const pack = await assembleBrandContext(piece.brand_id);
  const system = draftSystem(renderBrandPack(pack));

  const h1: string = outline?.h1 ?? brief?.working_title ?? piece.title ?? "Untitled";
  let md = `# ${h1}\n\n`;
  const previousSummaries: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Update progress in DB so frontend can poll it
    await sb.from("content_pieces").update({
      status: "generating",
      // Store progress in a JSON field we can read
    }).eq("id", id);

    const user = draftSectionUser({ brief, outline, section, previous_summary: previousSummaries.join("\n") });
    const body = await callMarkdown({ model: MODELS.opus, system, user, maxTokens: 2500 });
    md += `## ${section.h2}\n\n${body.trim()}\n\n`;
    previousSummaries.push(`- ${section.h2}: ${body.slice(0, 180).replace(/\n/g, " ")}...`);
  }

  const { data: prev } = await sb.from("artifacts").select("version").eq("piece_id", id).eq("kind", "draft").order("version", { ascending: false }).limit(1);
  const version = (prev?.[0]?.version ?? 0) + 1;

  await sb.from("artifacts").insert({ piece_id: id, kind: "draft", version, content_md: md, model: MODELS.opus }).select("*").single();
  await sb.from("content_pieces").update({ status: "draft" }).eq("id", id);
}
