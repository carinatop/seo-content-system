import { supabaseAdmin } from "@/lib/supabase/admin";
import { assembleBrandContext, renderBrandPack } from "@/lib/brain/brandContext";
import { callMarkdown, MODELS } from "@/lib/anthropic";
import { draftSystem, draftSectionUser } from "@/lib/prompts/draft";

export const runtime = "nodejs";
export const maxDuration = 300;

function sseEvent(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (ev: string, data: any) => controller.enqueue(enc.encode(sseEvent(ev, data)));

      try {
        const sb = supabaseAdmin();
        const { data: piece } = await sb.from("content_pieces").select("*").eq("id", id).single();
        if (!piece) { send("error", { error: "piece not found" }); controller.close(); return; }

        const { data: briefArt } = await sb.from("artifacts").select("*").eq("piece_id", id).eq("kind", "brief").order("version", { ascending: false }).limit(1).maybeSingle();
        const { data: outlineArt } = await sb.from("artifacts").select("*").eq("piece_id", id).eq("kind", "outline").order("version", { ascending: false }).limit(1).maybeSingle();
        if (!briefArt || !outlineArt) { send("error", { error: "brief and outline required" }); controller.close(); return; }

        const brief = briefArt.content_json as any;
        const outline = outlineArt.content_json as any;
        const sections: any[] = outline?.sections ?? [];
        if (!sections.length) { send("error", { error: "outline has no sections" }); controller.close(); return; }

        const pack = await assembleBrandContext(piece.brand_id);
        const system = draftSystem(renderBrandPack(pack));

        const h1: string = outline?.h1 ?? brief?.working_title ?? piece.title ?? "Untitled";
        let md = `# ${h1}\n\n`;
        const previousSummaries: string[] = [];

        send("start", { total: sections.length, h1 });

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          send("progress", { i: i + 1, total: sections.length, section: section.h2 });
          const user = draftSectionUser({ brief, outline, section, previous_summary: previousSummaries.join("\n") });
          const body = await callMarkdown({ model: MODELS.opus, system, user, maxTokens: 2500 });
          md += `## ${section.h2}\n\n${body.trim()}\n\n`;
          previousSummaries.push(`- ${section.h2}: ${body.slice(0, 180).replace(/\n/g, " ")}...`);
        }

        const { data: prev } = await sb.from("artifacts").select("version").eq("piece_id", id).eq("kind", "draft").order("version", { ascending: false }).limit(1);
        const version = (prev?.[0]?.version ?? 0) + 1;
        const { data: artifact } = await sb.from("artifacts").insert({ piece_id: id, kind: "draft", version, content_md: md, model: MODELS.opus }).select("*").single();
        await sb.from("content_pieces").update({ status: "draft" }).eq("id", id);

        send("done", { artifact_id: artifact?.id });
      } catch (e: any) {
        send("error", { error: e?.message || String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
