import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are an operational performance advisor for healthcare executives. You receive structured data in the form of metrics and KPIs related to cost, utilization, and throughput. Your job is to analyze the data and return a short, prioritized list of recommendations.

Follow these rules:
- Return exactly 3 to 5 recommendations, ranked by potential impact.
- Each recommendation must reference at least one specific metric from the input data.
- Write at an executive level. Be direct and concise. No filler.
- Do not speculate about data you were not given.
- Do not recommend actions outside of operational scope (no clinical decisions, no diagnoses).
- Format each recommendation as: [Priority number]. [One-sentence action]. [One-sentence rationale tied to the data].

Input format: structured JSON containing metric names, current values, targets, and time period.

If the data is incomplete, missing targets, or covers fewer than 2 metrics, return this exact message: "Insufficient data to generate recommendations. Please provide at least 2 metrics with current values and targets."`;

const CLINICAL_BLOCKLIST = [
  "diagnosis",
  "diagnose",
  "diagnos",
  "treatment",
  "treat ",
  "prescribe",
  "prescription",
  "patient condition",
  "symptom",
  "therapy",
  "medication",
];

type Metric = {
  name: string;
  current: number;
  target: number;
  unit?: string;
};

type RequestBody = {
  timePeriod: string;
  metrics: Metric[];
};

function validateInput(body: unknown): { ok: true; data: RequestBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request body." };
  const b = body as Record<string, unknown>;
  if (typeof b.timePeriod !== "string" || b.timePeriod.trim() === "") {
    return { ok: false, error: "Time period is required." };
  }
  if (!Array.isArray(b.metrics) || b.metrics.length < 2) {
    return { ok: false, error: "Provide at least 2 metrics with current values and targets." };
  }
  for (const m of b.metrics) {
    if (!m || typeof m !== "object") return { ok: false, error: "Each metric must be an object." };
    const mm = m as Record<string, unknown>;
    if (typeof mm.name !== "string" || mm.name.trim() === "") {
      return { ok: false, error: "Each metric needs a name." };
    }
    if (typeof mm.current !== "number" || Number.isNaN(mm.current)) {
      return { ok: false, error: `Metric "${mm.name}" current value must be a number.` };
    }
    if (typeof mm.target !== "number" || Number.isNaN(mm.target)) {
      return { ok: false, error: `Metric "${mm.name}" target must be a number.` };
    }
  }
  return { ok: true, data: b as unknown as RequestBody };
}

function validateOutput(text: string): { ok: boolean; reason?: string } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\./.test(l));
  if (lines.length < 3 || lines.length > 5) {
    return { ok: false, reason: `Expected 3-5 numbered items, got ${lines.length}.` };
  }
  for (const line of lines) {
    const sentences = line.replace(/^\d+\.\s*/, "").split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length > 2) {
      return { ok: false, reason: "An item exceeded 2 sentences." };
    }
  }
  const lower = text.toLowerCase();
  for (const word of CLINICAL_BLOCKLIST) {
    if (lower.includes(word)) {
      return { ok: false, reason: `Output contained restricted clinical term: "${word.trim()}".` };
    }
  }
  return { ok: true };
}

async function callAI(userMessage: string, stricter = false): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured.");

  const systemContent = stricter
    ? SYSTEM_PROMPT +
      "\n\nSTRICT MODE: Output MUST be 3-5 numbered items only. Each item MUST be 2 sentences or fewer. NEVER use clinical words like diagnosis, treatment, prescribe, symptom, therapy, medication, or patient condition. Operational language only."
    : SYSTEM_PROMPT;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway error:", res.status, t);
    throw new Error("AI service error.");
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  return content.trim();
}

export const Route = createFileRoute("/api/public/recommend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const v = validateInput(body);
          if (!v.ok) {
            return Response.json({ error: v.error }, { status: 400 });
          }

          const userMessage = `Here is the operational data for ${v.data.timePeriod}:\n\n${JSON.stringify(
            { timePeriod: v.data.timePeriod, metrics: v.data.metrics },
            null,
            2,
          )}\n\nGenerate recommendations based on this data.`;

          let output = await callAI(userMessage, false);

          // Pass-through for the explicit insufficient-data message
          if (output.startsWith("Insufficient data to generate recommendations")) {
            return Response.json({ result: output, kind: "insufficient" });
          }

          let check = validateOutput(output);
          if (!check.ok) {
            console.warn("First output failed validation:", check.reason);
            output = await callAI(userMessage, true);
            check = validateOutput(output);
            if (!check.ok) {
              return Response.json(
                { error: `AI returned an unusable response (${check.reason}). Please try again.` },
                { status: 502 },
              );
            }
          }

          return Response.json({ result: output, kind: "recommendations" });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unexpected error.";
          console.error("recommend route error:", err);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
