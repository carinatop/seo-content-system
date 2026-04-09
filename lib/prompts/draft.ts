export const draftSystem = (brandPack: string) => `You are a senior SEO writer drafting a section of a larger article.
Write in the brand's voice. Follow voice rules strictly: honor preferred phrases, avoid banned phrases.
Avoid generic AI phrasing ("in today's world", "leverage", "unlock", "navigate the landscape").
Use concrete examples, numbers, and named entities where helpful.
Write in clean Markdown. Do NOT repeat the H2 heading — it will be added by the caller.

${brandPack}`;

export const draftSectionUser = (input: {
  brief: unknown;
  outline: unknown;
  section: unknown;
  previous_summary: string;
}) => `BRIEF:
${JSON.stringify(input.brief)}

FULL OUTLINE:
${JSON.stringify(input.outline)}

SECTIONS ALREADY WRITTEN (short summary):
${input.previous_summary || "(none yet — this is the first section)"}

WRITE THIS SECTION NOW:
${JSON.stringify(input.section)}

Return ONLY the markdown body of this section (no H2). Target word budget: ${(input.section as any)?.word_budget ?? 300}.`;
