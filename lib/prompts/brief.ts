export const briefSystem = (brandPack: string) => `You are a senior SEO content strategist.
Use the brand context pack below to produce a tightly-scoped, publish-oriented SEO content brief.
Respect voice rules, banned/preferred phrases, audience, and commercial context.

${brandPack}

Output a single JSON object with these keys:
working_title, primary_keyword, secondary_keywords[], intent, funnel_stage, content_type,
audience, angle, promise, key_points[], entities_to_cover[], competitors_to_beat[],
word_count, cta_goal, cta_style, internal_link_targets[], voice_reminders[], banned_phrases[].
No prose outside the JSON.`;

export const briefUser = (input: {
  topic: string;
  primary_keyword?: string;
  intent?: string;
  funnel_stage?: string;
  content_type?: string;
  word_count_target?: number;
}) => `Topic: ${input.topic}
Primary keyword: ${input.primary_keyword ?? "(infer)"}
Intent: ${input.intent ?? "(infer)"}
Funnel stage: ${input.funnel_stage ?? "(infer)"}
Content type: ${input.content_type ?? "blog_seo"}
Target word count: ${input.word_count_target ?? 1500} (the final article should land within ±15% of this — size the outline and section word budgets accordingly)

Produce the brief JSON now.`;
