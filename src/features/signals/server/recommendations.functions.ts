import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server function that asks the Lovable AI Gateway to emit up to 3
 * prioritized operational signals for the supplied off-target KPIs.
 * Output is enforced via a forced tool call, so no free-form parsing.
 */

const KpiInput = z.object({
  slug: z.string(),
  label: z.string(),
  current: z.number(),
  target: z.number(),
  unit: z.string(),
  better: z.enum(["higher", "lower"]),
  deviationPct: z.number(),
  status: z.enum(["green", "yellow", "red"]),
});

const Input = z.object({
  kpis: z.array(KpiInput).min(1).max(20),
});

export type Signal = {
  priority: 1 | 2 | 3;
  metricSlug: string;
  signal: string;
  impact: string;
  nextAction: string;
};

export const getRecommendations = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<{ signals: Signal[]; generatedAt: string; error?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { signals: [], generatedAt: new Date().toISOString(), error: "LOVABLE_API_KEY missing" };
    }

    const offTarget = data.kpis.filter((k) => k.status !== "green");
    if (offTarget.length === 0) {
      return { signals: [], generatedAt: new Date().toISOString() };
    }

    const systemPrompt = `You are a hospital operations analyst. Given KPI data, surface up to 3 prioritized signals.
Each signal must include:
- "signal": one sentence stating what is happening (use concrete numbers).
- "impact": one sentence quantifying the operational or financial consequence.
- "nextAction": one sentence with a concrete, immediate next step a nursing/ops leader can take.
Prioritize by severity (status red > yellow) and operational impact. Be concise. Match this tone:
"Cost per Case is 23% above target for the third consecutive month."
"At current volume, this gap represents $1.2M in unplanned spend this quarter."
"Pull case-level cost breakdown for the top 3 service lines and identify the top driver before the next ops review."`;

    const userPrompt = `KPIs:\n${JSON.stringify(data.kpis, null, 2)}`;

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "emit_signals",
                description: "Emit up to 3 prioritized operational signals.",
                parameters: {
                  type: "object",
                  properties: {
                    signals: {
                      type: "array",
                      maxItems: 3,
                      items: {
                        type: "object",
                        properties: {
                          priority: { type: "number", enum: [1, 2, 3] },
                          metricSlug: { type: "string" },
                          signal: { type: "string" },
                          impact: { type: "string" },
                          nextAction: { type: "string" },
                        },
                        required: ["priority", "metricSlug", "signal", "impact", "nextAction"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["signals"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "emit_signals" } },
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("AI gateway error:", resp.status, text);
        if (resp.status === 429) return { signals: [], generatedAt: new Date().toISOString(), error: "Rate limit reached. Try again in a moment." };
        if (resp.status === 402) return { signals: [], generatedAt: new Date().toISOString(), error: "AI credits exhausted." };
        return { signals: [], generatedAt: new Date().toISOString(), error: "AI gateway error" };
      }

      const json = await resp.json();
      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      const args = call?.function?.arguments;
      if (!args) return { signals: [], generatedAt: new Date().toISOString(), error: "Empty AI response" };
      const parsed = JSON.parse(args);
      const signals: Signal[] = (parsed.signals ?? []).slice(0, 3).map((s: Signal, i: number) => ({
        ...s,
        priority: ((i + 1) as 1 | 2 | 3),
      }));
      return { signals, generatedAt: new Date().toISOString() };
    } catch (e) {
      console.error("recommendations error:", e);
      return { signals: [], generatedAt: new Date().toISOString(), error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
