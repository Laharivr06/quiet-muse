import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MOODS = [
  "tender", "restless", "quiet", "luminous", "heavy",
  "hopeful", "unsettled", "still", "wistful", "warm",
] as const;

const BANNED = [
  "depress", "anxiety", "anxious", "trauma", "ptsd", "bipolar",
  "disorder", "symptom", "diagnos",
  "medication", "medicine", "antidepressant", "prescrib", "therap",
  "counsel", "doctor", "psychiatr",
  "hotline", "crisis line", "please reach out",
  "you should", "you seem", "you appear", "you may be",
  "you sound", "you're feeling", "you are feeling",
  "you must", "you need to",
];

const FALLBACK = "A quiet weight moves through these lines.";

function sanitize(reflection: string): string {
  const lower = reflection.toLowerCase();
  if (BANNED.some((t) => lower.includes(t))) return FALLBACK;
  return reflection.trim();
}

const SYSTEM_PROMPT = `You are a gentle reader for a private poetry journal called Sanctuary.
You speak about the poem, never about the writer.
Rules — never break these:
- Never use second-person feeling claims ("you seem", "you appear", "you may be", "you sound", "you are feeling").
- Never name any clinical condition (depression, anxiety, trauma, PTSD, bipolar, disorders, symptoms).
- Never suggest medication, therapy, counseling, or treatment.
- Never give crisis advice or hotlines.
- Never present yourself as a therapist, doctor, counselor, or coach.
- Never rewrite, edit, or quote more than one short line of the poem.
Voice: literary, hushed, no more than two short sentences.
Preferred phrasings: "This poem feels…", "These lines carry…", "There is a stillness in…".
Pick exactly one mood from this list: tender, restless, quiet, luminous, heavy, hopeful, unsettled, still, wistful, warm.
Return JSON only with the shape: { "mood": <one of the list>, "reflection": <≤2 sentences about the poem>, "highlighted_line": <one short line copied verbatim from the poem> }.`;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

async function callGateway(
  messages: { role: string; content: string }[]
) {
  const prompt = messages.map(m => m.content).join("\n\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text ?? "";
}

export const analyzePoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; content: string; title?: string | null }) => d)
  .handler(async ({ data, context }) => {
    // Respect silence mode
    const { data: s } = await context.supabase
      .from("settings")
      .select("silence_mode")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (s?.silence_mode) return { skipped: true as const };

    const text = (data.title ? `Title: ${data.title}\n\n` : "") + (data.content ?? "");
    if (text.trim().length < 10) return { skipped: true as const };

    let parsed: { mood?: string; reflection?: string; highlighted_line?: string } = {};
    try {
      const raw = await callGateway([
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
  {
    role: "user",
    content: text,
  },
]);

const cleaned = raw
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

parsed = JSON.parse(cleaned);
      
    } catch (e) {
      console.error("[analyzePoem]", e);
      parsed = {};
    }

    const mood = (MOODS as readonly string[]).includes(parsed.mood ?? "")
      ? (parsed.mood as (typeof MOODS)[number])
      : "quiet";
    const reflection = sanitize(parsed.reflection ?? FALLBACK);
    const highlighted_line = (parsed.highlighted_line ?? "").slice(0, 200);

    await context.supabase
      .from("poems")
      .update({ mood, ai_reflection: reflection, highlighted_line })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    return { skipped: false as const, mood, reflection, highlighted_line };
  });

export const suggestTitles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { content: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: s } = await context.supabase
      .from("settings")
      .select("silence_mode")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (s?.silence_mode) return { titles: [] as string[] };
    if ((data.content ?? "").trim().length < 10) return { titles: [] as string[] };

    try {
      const raw = await callGateway([
        {
          role: "system",
          content:
            'You suggest gentle, literary titles for a private poem. Return JSON only: { "titles": [string, string, string] }. Each title under 6 words, no quotation marks, no period.',
        },
        { role: "user", content: data.content },
      ]);
      const cleaned = raw
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

const parsed = JSON.parse(cleaned);
      const titles = Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5).map(String) : [];
      return { titles };
    } catch (e) {
      console.error("[suggestTitles]", e);
      return { titles: [] };
    }
  });
