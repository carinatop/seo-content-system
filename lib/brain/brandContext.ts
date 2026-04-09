import { supabaseAdmin } from "@/lib/supabase/admin";

export type BrandContextPack = {
  brand: { id: string; name: string; niche: string | null };
  audience: any;
  tone: any;
  voice_rules: any;
  commercial: any;
  seo_notes: string | null;
  sample_excerpts: string[];
};

/** Assemble a compact brand context pack for prompt injection (≤~1500 tokens). */
export async function assembleBrandContext(brandId: string): Promise<BrandContextPack> {
  const sb = supabaseAdmin();
  const { data: brand } = await sb.from("brands").select("*").eq("id", brandId).single();
  if (!brand) throw new Error("brand not found");
  const { data: samples } = await sb
    .from("brand_samples")
    .select("body")
    .eq("brand_id", brandId)
    .limit(2);
  return {
    brand: { id: brand.id, name: brand.name, niche: brand.niche },
    audience: brand.audience_json ?? {},
    tone: brand.tone_json ?? {},
    voice_rules: brand.voice_rules_json ?? {},
    commercial: brand.commercial_json ?? {},
    seo_notes: brand.seo_notes,
    sample_excerpts: (samples ?? []).map((s) => (s.body || "").slice(0, 600)),
  };
}

/** Render a brand pack as a compact system-prompt block. */
export function renderBrandPack(pack: BrandContextPack): string {
  return `BRAND CONTEXT PACK
Brand: ${pack.brand.name}${pack.brand.niche ? ` (${pack.brand.niche})` : ""}
Audience: ${JSON.stringify(pack.audience)}
Tone: ${JSON.stringify(pack.tone)}
Voice rules: ${JSON.stringify(pack.voice_rules)}
Commercial: ${JSON.stringify(pack.commercial)}
SEO notes: ${pack.seo_notes ?? "(none)"}
Approved voice samples (excerpts):
${pack.sample_excerpts.map((s, i) => `[${i + 1}] ${s}`).join("\n\n") || "(none)"}`;
}
