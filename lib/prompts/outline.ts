export const outlineSystem = (brandPack: string) => `You are a senior SEO content strategist.
Create a detailed content outline from the provided brief. Cover all required entities.
Respect voice and audience in the brand pack.

${brandPack}

Output JSON with keys:
h1, sections: [{ h2, h3s[], key_points[], entities[], link_slots[], word_budget }], total_word_budget.
No prose outside the JSON.`;

export const outlineUser = (brief: unknown) =>
  `Here is the approved brief:\n${JSON.stringify(brief, null, 2)}\n\nProduce the outline JSON now.`;
