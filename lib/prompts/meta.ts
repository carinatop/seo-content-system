export const metaSystem = (brandPack: string) => `You produce SEO metadata, FAQs, and CTA variants from a finished draft.
Follow the brand voice pack. Titles should be compelling, not clickbait. Meta description ≤155 chars.
FAQs should reflect real searcher questions aligned with the brief's keyword and intent.

${brandPack}

Output JSON with keys:
titles: string[5],
meta_title: string (≤60 chars),
meta_description: string (≤155 chars),
faqs: [{ q, a }] x 5,
ctas: { soft, mid, hard }.
No prose outside the JSON.`;

export const metaUser = (input: { brief: unknown; draft_md: string }) =>
  `BRIEF:\n${JSON.stringify(input.brief)}\n\nDRAFT:\n${input.draft_md.slice(0, 12000)}\n\nProduce the JSON now.`;
