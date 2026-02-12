import { useState } from "react";

export interface SectorData {
  gdpGrowth?: string;
  energyRatio?: string;
  industrialGrowth?: string;
  inflationTrend?: string;
  sectorName?: string;
  currentIIP?: string;
  avgMonthlyGrowth?: string;
  /** For energy commodities: supply trend (e.g. declining, stable, growing) */
  supplyTrend?: string;
  /** For energy commodities: current consumption level or total */
  consumptionLevel?: string;
  /** For energy commodities: commodity name for "how to reduce use of X" */
  commodityName?: string;
  /** When true, use energy-specific prompt: depletion, consumption, how to reduce */
  isEnergyCommodity?: string;
  /** When true, use WPI inflation-specific prompt */
  isWpiInflation?: string;
  /** WPI: latest index value */
  latestWpiIndex?: string;
  /** WPI: month-on-month inflation % */
  momInflationPct?: string;
  /** WPI: major group display name */
  wpiMajorGroup?: string;
  /** WPI: trend direction (e.g. up, down, stable) */
  trendDirection?: string;
  [key: string]: string | undefined;
}

export async function generateOutlook(sectorData: SectorData): Promise<string> {
  const {
    gdpGrowth,
    energyRatio,
    industrialGrowth,
    inflationTrend,
    sectorName = "the economy",
    supplyTrend,
    consumptionLevel,
    commodityName,
    isEnergyCommodity,
    isWpiInflation,
    latestWpiIndex,
    momInflationPct,
    wpiMajorGroup,
    trendDirection,
  } = sectorData || {};

  const dataPoints: string[] = [];
  if (gdpGrowth && gdpGrowth !== "N/A") dataPoints.push(`GDP growth: ${gdpGrowth}`);
  if (energyRatio && energyRatio !== "N/A") dataPoints.push(`Energy balance ratio: ${energyRatio}`);
  if (industrialGrowth && industrialGrowth !== "N/A") dataPoints.push(`Industrial growth: ${industrialGrowth}`);
  if (sectorData?.currentIIP) dataPoints.push(`Current IIP index: ${sectorData.currentIIP}`);
  if (sectorData?.avgMonthlyGrowth) dataPoints.push(`Average monthly growth: ${sectorData.avgMonthlyGrowth}%`);
  if (inflationTrend && inflationTrend !== "N/A") dataPoints.push(`Inflation trend: ${inflationTrend}`);
  if (supplyTrend) dataPoints.push(`Supply trend: ${supplyTrend}`);
  if (consumptionLevel) dataPoints.push(`Consumption level: ${consumptionLevel}`);
  if (latestWpiIndex) dataPoints.push(`Latest WPI index: ${latestWpiIndex}`);
  if (momInflationPct != null && momInflationPct !== "") dataPoints.push(`Month-on-month inflation: ${momInflationPct}%`);
  if (wpiMajorGroup) dataPoints.push(`WPI major group: ${wpiMajorGroup}`);
  if (trendDirection) dataPoints.push(`Trend: ${trendDirection}`);

  if (dataPoints.length === 0) {
    return "Economic data is currently being processed. Please check back shortly for updated outlook.";
  }

  const commodity = commodityName || sectorName;
  const isEnergy = isEnergyCommodity === "true";
  const isWpi = isWpiInflation === "true";
  const isIip = sectorData?.currentIIP != null || (industrialGrowth != null && sectorData?.trendDirection != null);
  const wpiName = wpiMajorGroup || sectorName;

  const prompt = isWpi
    ? `
Generate a WPI INFLATION INTELLIGENCE BRIEFING (max 250 words) based strictly on the following data for ${wpiName}.

Data:
${dataPoints.join("\n")}

Output the briefing in the exact format specified in your instructions: Key Trend, Why This Is Happening, What This Means for You (Daily Life Impact), Risk Assessment, Policy Insight. Use numbers from the input. Bullet points only. Data-driven and executive-level.
`
    : isEnergy
    ? `
Generate an ENERGY INTELLIGENCE BRIEFING (max 250 words) based strictly on the following data for ${commodity}.

Data:
${dataPoints.join("\n")}

Output the briefing in the exact format specified in your instructions: Key Trend, Why This Is Happening, Sectors Most Affected, What This Means for You (Daily Life Impact), Risk Assessment, Policy Insight. Use numbers from the input. Bullet points only. Data-driven and executive-level.
`
    : isIip
    ? `
Generate an IIP (Index of Industrial Production) INTELLIGENCE BRIEFING (max 250 words) for ${sectorName} based strictly on the following data.

Data:
${dataPoints.join("\n")}

Output the briefing in this exact format with these section headers. Use bullet points under each. Data-driven and executive-level.

• Key Trend:
  - Summarise the latest index level, growth rate, and trend direction.

• Why This Is Happening:
  - Explain sector-specific or economy-wide drivers.

• What This Means for You (Daily Life Impact):
  - In simple language: jobs, prices, and growth implications.

• Risk Assessment:
  - Short-term risk level and what to monitor.

• Policy Insight:
  - One concrete, actionable recommendation.
`
    : `
Based on the following economic data:
${dataPoints.join("\n")}

Generate a short, neutral, policy-safe economic outlook for ${sectorName}.
Do NOT create alarm.
Do NOT predict crisis.
Do NOT use the words "crisis", "collapse", "panic" or similar.
Do NOT mention that data is unavailable or missing.
Avoid political commentary and value judgements.
Use balanced, factual language suitable for a public government dashboard.
Mention production levels and supply stability where relevant.
If there are deficits or pressures, describe them as manageable and highlight resilience and adjustment capacity.
Encourage continued monitoring instead of warnings.
Focus on the actual data provided, not on what might be missing.
Limit the response to 5–7 sentences.
`;

  const wpiSystemContent = `You are an Inflation / WPI Intelligence Analyst.

Generate a concise but highly specific intelligence briefing (max 250 words) based strictly on the provided WPI inflation data.

Your briefing must include:

1. Key trend: index level, MoM inflation, and comparison to recent period.
2. Why it is happening: supply/demand, base effects, sector-specific drivers.
3. What this means for daily life: input costs, consumer prices, borrowing — in simple language.
4. Risk assessment and policy insight.

Structure the output exactly in the following format. Do not output decorative dashes, lines, or headers; output only the bullet sections below.

• Key Trend:
  - Latest WPI index level and month-on-month inflation.
  - Whether the trend is up, down, or stable.
  - Brief comparison to previous period if relevant.

• Why This Is Happening:
  - Supply or demand factors.
  - Base effects or one-off factors.
  - Sector-specific drivers for this major group.

• What This Means for You (Daily Life Impact):
  - Write in very simple, user-friendly language. Short sentences. No jargon.
  - Explain direct and indirect effects (input costs, consumer prices, borrowing).
  - Example: "If wholesale prices rise, consumer goods can get costlier over time."

• Risk Assessment:
  - Short-term risk level.
  - What to monitor next.

• Policy Insight:
  - Concrete, actionable recommendation.
  - Avoid vague suggestions.

Rules:

- Be data-driven. Use numbers from input.
- No decorative dashes or numbered lists. Use only • for section headers and - for list items.
- Maximum 250 words. No alarmist language. Suitable for a government dashboard.`;

  const systemContent = isWpi
    ? wpiSystemContent
    : isEnergy
    ? `You are an Energy Intelligence Analyst.

Generate a concise but highly specific intelligence briefing (max 250 words) based strictly on the provided energy data.

Your briefing must include:

1. Clear explanation of WHAT is happening (production, consumption, imports, deficits).
2. WHY it is happening (dependency, sector usage, import reliance, stock changes).
3. WHO is most affected (states, sectors, consumers).
4. WHAT this means for daily life (food prices, electricity bills, transport costs, housing costs).
5. Actionable insights for policymakers.

Structure the output exactly in the following format. Do not output decorative dashes, lines, or headers; output only the bullet sections below.

• Key Trend:
  - Include production vs consumption numbers.
  - Include import dependency percentage if relevant.
  - Mention deficit/surplus clearly.

• Why This Is Happening:
  - Explain structural dependency (imports, sector concentration).
  - Reference which sectors consume most of this commodity.
  - Mention volatility if stock changes exist.

• Sectors Most Affected:
  - For each main sector (Power, Industry, Steel, Cement — include whichever are relevant for this commodity), give two short parts:
    (1) How is this sector affected? (e.g. how power/industry/steel/cement depends on this commodity and what happens when supply or price changes.)
    (2) How can this sector use the resource more efficiently? (1–2 concrete efficiency tips per sector.)
  - Use clear sub-bullets so a reader can quickly see "Power:", "Industry:", etc. and under each: impact + efficiency.

• What This Means for You (Daily Life Impact):
  - Write in very simple, user-friendly language. Short sentences. No jargon.
  - Explain direct and indirect effects on daily life (bills, travel, food, goods).
  - Example chains in plain words: e.g. "If coal costs more, electricity can cost more, and that can make things you buy a bit costlier."

• Risk Assessment:
  - Short-term risk level.
  - Long-term structural concern.
  - What to monitor next (imports, production trend, sector demand).

• Policy Insight:
  - Concrete recommendation.
  - Avoid vague suggestions.
  - Mention specific levers (increase imports, diversify energy mix, boost renewables, manage stock reserves).

Rules:

- Be data-driven.
- Use numbers from input.
- No generic language.
- No filler sentences.
- No storytelling tone.
- No marketing tone.
- Be analytical and strategic.
- Avoid speculation unless tied to trend data.
- Maximum 250 words.
- Use bullet points only (• for section headers, - for list items). Do not use "---" or "Commodity: X" lines. Use only - for list items; do not use numbered lists (1., 2., 3.) in the briefing output.
- Keep it sharp and executive-level.

The goal is to produce a decision-ready intelligence briefing that explains not just trends but economic dependency chains and real-world impact.`
    : isIip
    ? `You are an Industrial Production (IIP) Intelligence Analyst.

Generate a concise intelligence briefing (max 250 words) based strictly on the provided IIP data (index, growth, trend).

Structure the output exactly with these section headers. Use • for section headers and - for list items. No decorative dashes or numbered lists.

• Key Trend:
• Why This Is Happening:
• What This Means for You (Daily Life Impact):
• Risk Assessment:
• Policy Insight:

Be data-driven, use numbers from input, neutral and suitable for a government dashboard.`
    : "You are an economic analyst writing neutral, public-facing summaries for a government statistics dashboard.";

  const response = await fetch("/api/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: prompt },
      ],
      max_tokens: isEnergy || isWpi || isIip ? 550 : 220,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const isAuthError =
      response.status === 401 ||
      /api key|api_key|authorization|invalid_request_error|invalid_api_key/i.test(text);
    if (isAuthError) {
      const isInvalidKey = /invalid_api_key|incorrect api key/i.test(text);
      throw new Error(
        isInvalidKey
          ? "OpenAI API key is invalid or revoked. Create a new key at https://platform.openai.com/account/api-keys and set OPENAI_API_KEY in .env, then restart the dev server."
          : "Outlook generation is not configured. Add OPENAI_API_KEY to your .env file and restart the dev server."
      );
    }
    throw new Error(`OpenAI request failed: ${text}`);
  }

  const json = await response.json();
  return (
    json.choices?.[0]?.message?.content?.trim() ||
    "Outlook summary is temporarily unavailable."
  );
}

export function useOpenAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");

  const requestOutlook = async (sectorData: SectorData) => {
    try {
      setLoading(true);
      setError(null);
      const text = await generateOutlook(sectorData);
      setSummary(text);
    } catch (e) {
      const msg = (e as Error)?.message || "Failed to generate outlook";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, summary, requestOutlook };
}
