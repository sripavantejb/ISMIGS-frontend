import { useState, useEffect, useRef } from "react";
import { API_BASE } from "@/config/api";

export interface GVATrendDataPoint {
  fiscalYear: string;
  totalCurrent: number;
}

export interface GVAAffectedSector {
  name: string;
  solution?: string;
  priceTrend?: string;
  consumptionOutlook?: string;
  productionOutlook?: string;
  depletionRisk?: string;
}

export interface GVAImpactContent {
  /** One sentence for hero: how this industry affects GVA. */
  industryAffectsGvaShort: string;
  /** "From 2023-24 to 2024-25 [observed]. For 2024-25/2025-26 we expect ..." */
  trendSummary: string;
  /** 3–5 one-line bullets shown by default. */
  hookPoints: string[];
  whoIsAffected: string;
  solutions: string[];
  keySuggestions: string[];
  /** Sectors most affected by this GVA industry; each can have expandable details. */
  affectedSectors: GVAAffectedSector[];
}

const GVA_IMPACT_SYSTEM_PROMPT = `You are an expert on the Indian economy and sectoral Gross Value Added (GVA). Your role is to help users understand how an industry's GVA affects people and what they can do about it.

Use the provided GVA-by-year numbers when given. You must produce:

1. **industryAffectsGvaShort** (one sentence): How does this industry affect GVA and the broader economy? Plain language for a hero subtitle.

2. **trendSummary** (one short paragraph): State clearly what happened and what to expect. Example format: "From 2023-24 to 2024-25, GVA [rose/fell/held]. For 2024-25 / 2025-26 we expect [e.g. power cuts, price increase, stress, or growth]." Be specific to the numbers when provided. Call out concrete outcomes like power loss, price increase, or sector stress where relevant.

3. **hookPoints** (3–5 one-line bullets): Key takeaways visible at a glance—e.g. "GVA up 8% in 2023-24", "Expect input cost pressure in 2025", "Rural employment tied to this sector." No full sentences; scannable.

4. **Who is affected** (2–4 sentences): When this industry's GVA changes—who is impacted? Direct workers, businesses, downstream sectors, consumers. Include forward-looking and seasonal risks where relevant. India-specific, plain language.

5. **Solutions** (4–6 short bullets): What can policymakers and the sector do? Actionable.

6. **Key suggestions for users** (3–5 short bullets): What should users or businesses do or expect? E.g. higher bills, supply gaps, power cuts, diversification. One sentence each.

7. **affectedSectors** (array of 4–8 objects): Sectors or industries most affected when this GVA industry changes. Each object must have: "name" (sector name, e.g. "Food processing", "Agri-inputs", "Rural employment"). For each sector provide 1–2 sentence summaries where relevant: "solution" (what is the solution for this sector), "priceTrend" (prices increasing/decreasing/stable), "consumptionOutlook" (consumption going up/down), "productionOutlook" (production going up/down), "depletionRisk" (depletion or stress expected or not). Where relevant, reference the actual trend years from the provided GVA data (e.g. "Due to 2023-24 trends, …") so sector impact is tied to real analytics. Plain text only, no markdown.`;

function buildGVAImpactPrompt(
  industryName: string,
  latestYear?: string,
  trendData?: GVATrendDataPoint[]
): string {
  let prompt = `Industry: ${industryName}`;
  if (latestYear) {
    prompt += `\nLatest data year: ${latestYear}. Use current and near-future years (e.g. 2025, 2026, 2027) for forward-looking suggestions where relevant.`;
  }
  if (trendData && trendData.length > 0) {
    const trendLine = trendData
      .map((d) => `${d.fiscalYear}: ${Math.round(d.totalCurrent).toLocaleString("en-IN")} (current price, ₹ crore)`)
      .join("; ");
    prompt += `\n\nGVA by year (current prices, ₹ crore): ${trendLine}. Use these numbers in your trendSummary: state "From [year] to [year]" and "For [next year] we expect ..." with concrete outcomes (e.g. power cuts, price increase, stress).`;
  }
  prompt += `\n\nRespond with a valid JSON object only, no other text, with exactly these keys:
- "industryAffectsGvaShort": string (one sentence for hero)
- "trendSummary": string (one short paragraph: from X to Y [observed]; for next year we expect ...)
- "hookPoints": array of strings (3-5 one-line bullets)
- "whoIsAffected": string (paragraph of 2-4 sentences)
- "solutions": array of strings (4-6 actionable bullets)
- "keySuggestions": array of strings (3-5 short user-facing suggestions)
- "affectedSectors": array of objects, each with "name" (string) and optionally "solution", "priceTrend", "consumptionOutlook", "productionOutlook", "depletionRisk" (each 1-2 sentences)`;
  return prompt;
}

function parseAffectedSectors(raw: unknown): GVAAffectedSector[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).map((item) => {
    if (!item || typeof item !== "object") return { name: "" };
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : "";
    if (!name) return { name: "" };
    return {
      name,
      solution: typeof o.solution === "string" ? o.solution : undefined,
      priceTrend: typeof o.priceTrend === "string" ? o.priceTrend : undefined,
      consumptionOutlook: typeof o.consumptionOutlook === "string" ? o.consumptionOutlook : undefined,
      productionOutlook: typeof o.productionOutlook === "string" ? o.productionOutlook : undefined,
      depletionRisk: typeof o.depletionRisk === "string" ? o.depletionRisk : undefined,
    };
  }).filter((s) => s.name.trim() !== "");
}

async function fetchGVAImpact(
  industryName: string,
  latestYear?: string,
  trendData?: GVATrendDataPoint[]
): Promise<GVAImpactContent> {
  const res = await fetch(`${API_BASE}/api/openai/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: GVA_IMPACT_SYSTEM_PROMPT },
        { role: "user", content: buildGVAImpactPrompt(industryName, latestYear, trendData) },
      ],
      max_tokens: 1200,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || /invalid.*key|api_key|authorization/i.test(text)) {
      throw new Error("OpenAI API key is invalid or not set. Add OPENAI_API_KEY in .env and restart the dev server.");
    }
    throw new Error(`Failed to load impact: ${text || res.statusText}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("No response from AI.");

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const industryAffectsGvaShort =
      typeof parsed.industryAffectsGvaShort === "string"
        ? parsed.industryAffectsGvaShort
        : "";
    const trendSummary =
      typeof parsed.trendSummary === "string" ? parsed.trendSummary : "";
    const hookPoints = Array.isArray(parsed.hookPoints)
      ? (parsed.hookPoints as unknown[]).map((s) => String(s)).filter(Boolean)
      : [];
    const whoIsAffected = typeof parsed.whoIsAffected === "string" ? parsed.whoIsAffected : "";
    const solutions = Array.isArray(parsed.solutions)
      ? (parsed.solutions as unknown[]).map((s) => String(s)).filter(Boolean)
      : [];
    const keySuggestions = Array.isArray(parsed.keySuggestions)
      ? (parsed.keySuggestions as unknown[]).map((s) => String(s)).filter(Boolean)
      : [];
    const affectedSectors = parseAffectedSectors(parsed.affectedSectors);
    return {
      industryAffectsGvaShort,
      trendSummary,
      hookPoints,
      whoIsAffected,
      solutions,
      keySuggestions,
      affectedSectors,
    };
  } catch {
    throw new Error("Could not parse AI response. Please try again.");
  }
}

export function useGVAImpact(
  industryName: string | null,
  latestYear?: string,
  trendData?: GVATrendDataPoint[]
) {
  const [data, setData] = useState<GVAImpactContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestedRef = useRef<string | null>(null);

  const trendKey = trendData?.map((d) => `${d.fiscalYear}:${d.totalCurrent}`).join("|") ?? "";

  useEffect(() => {
    if (!industryName?.trim()) {
      setData(null);
      setError(null);
      return;
    }
    const key = `${industryName}:${latestYear ?? ""}:${trendKey}`;
    if (requestedRef.current === key) return;
    requestedRef.current = key;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetchGVAImpact(industryName, latestYear, trendData)
      .then((content) => {
        if (!cancelled) {
          setData(content);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [industryName, latestYear, trendKey]);

  return { data, loading, error };
}
