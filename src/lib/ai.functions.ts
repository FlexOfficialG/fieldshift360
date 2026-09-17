import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  farm: z.object({
    name: z.string(),
    lat: z.number(),
    lon: z.number(),
    crop: z.string(),
    start: z.string(),
    end: z.string(),
  }),
  dataStatus: z.string(),
  dataNote: z.string().nullable(),
  variables: z.array(
    z.object({
      code: z.string(),
      longName: z.string(),
      unit: z.string(),
      mean: z.number().nullable(),
      min: z.number().nullable(),
      max: z.number().nullable(),
      validDays: z.number(),
      missingDays: z.number(),
    }),
  ),
  indicators: z.array(z.object({ label: z.string(), value: z.number(), level: z.string() })),
  scenario: z
    .object({
      temperatureDelta: z.number(),
      rainfallPercent: z.number(),
      indicators: z.array(z.object({ label: z.string(), value: z.number(), level: z.string() })),
    })
    .nullable(),
});

export type AiInterpretation = {
  status: "ok" | "unavailable";
  message: string | null;
  sections: { title: string; body: string }[];
  model: string | null;
};

const SECTIONS = ["CURRENT SITUATION", "MAIN DRIVER", "SCENARIO IMPACT", "MONITORING PRIORITY"];

const OutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["current_situation", "main_driver", "scenario_impact", "monitoring_priority"],
  properties: {
    current_situation: { type: "string" },
    main_driver: { type: "string" },
    scenario_impact: { type: "string" },
    monitoring_priority: { type: "string" },
  },
} as const;

export const interpretResults = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<AiInterpretation> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return {
        status: "unavailable",
        message: "AI INTERPRETATION UNAVAILABLE — no AI credential is configured on the server.",
        sections: [],
        model: null,
      };
    }

    const model = "openai/gpt-6-astra";
    const prompt = [
      "You interpret an agricultural climate analysis. Use ONLY the JSON below.",
      "Never invent NASA measurements, datasets, locations, or scientific findings.",
      "Never state guaranteed yield outcomes. Use cautious language such as 'may indicate' and",
      "'further local assessment is recommended'. Two to four sentences per section, plain text.",
      "Distinguish NASA observations, Field Shift calculated indicators, and the user's hypothetical scenario.",
      data.scenario
        ? "A hypothetical scenario is present: describe its calculated effect, clearly as hypothetical."
        : "No scenario is present: for scenario_impact, state that no hypothetical scenario has been run.",
      "",
      "JSON payload:",
      JSON.stringify(data),
    ].join("\n");

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model,
          input: prompt,
          stream: true,
          reasoning: { effort: "low", summary: "auto" },
          text: {
            format: {
              type: "json_schema",
              name: "field_shift_interpretation",
              strict: true,
              schema: OutputSchema,
            },
          },
        }),
      });
    } catch (error) {
      return {
        status: "unavailable",
        message: `AI INTERPRETATION UNAVAILABLE — request failed: ${error instanceof Error ? error.message : "network error"}`,
        sections: [],
        model,
      };
    }

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      const hint =
        res.status === 402
          ? "AI credits are exhausted for this workspace."
          : res.status === 429
            ? "The AI service is rate limited. Try again shortly."
            : res.status === 403
              ? "AI access is blocked by workspace policy."
              : "";
      return {
        status: "unavailable",
        message: `AI INTERPRETATION UNAVAILABLE — HTTP ${res.status}. ${hint} ${body.slice(0, 200)}`.trim(),
        sections: [],
        model,
      };
    }

    // Reasoning models stream; accumulate output text deltas server-side.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && !text) {
            text = evt.response?.output_text ?? "";
          }
        } catch {
          /* ignore keep-alive fragments */
        }
      }
    }

    let parsed: Record<string, string> | null = null;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      parsed = null;
    }

    if (!parsed) {
      return {
        status: "unavailable",
        message: "AI INTERPRETATION UNAVAILABLE — the model returned no readable interpretation.",
        sections: [],
        model,
      };
    }

    const keys = ["current_situation", "main_driver", "scenario_impact", "monitoring_priority"];
    return {
      status: "ok",
      message: null,
      model,
      sections: keys.map((k, i) => ({ title: SECTIONS[i]!, body: String(parsed?.[k] ?? "").trim() })),
    };
  });
