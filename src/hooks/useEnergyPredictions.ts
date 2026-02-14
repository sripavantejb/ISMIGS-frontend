import { useState } from "react";
import { API_BASE } from "@/config/api";

export interface EnergyPredictionData {
  narrative: string;
  forecasts: {
    supply: number[];
    consumption: number[];
    years: number[];
  };
  kpis: {
    production: number;
    imports: number;
    exports: number;
    consumption: number;
  };
  sectorConsumption: Array<{
    sector: string;
    consumption: number;
  }>;
  riskFactors: string[];
  recommendations: string[];
}

export interface EnergyHistoricalData {
  commodityName: string;
  historicalSupply: Array<{ year: number; value: number }>;
  historicalConsumption: Array<{ year: number; value: number }>;
  currentRatio?: number;
  supplyTrend?: string;
  consumptionLevel?: string;
  selectedYear?: string;
  selectedSector?: string;
  productionTotal?: number;
  importsTotal?: number;
  exportsTotal?: number;
  consumptionTotal?: number;
  sectorTotals?: Array<{ name: string; total: number }>;
}

export async function generateEnergyPredictions(
  data: EnergyHistoricalData
): Promise<EnergyPredictionData> {
  const {
    commodityName,
    historicalSupply,
    historicalConsumption,
    currentRatio,
    supplyTrend,
    consumptionLevel,
    selectedYear,
    selectedSector,
    productionTotal,
    importsTotal,
    exportsTotal,
    consumptionTotal,
    sectorTotals,
  } = data;

  // Build data summary for prompt
  const supplySummary = historicalSupply
    .slice(-10)
    .map((d) => `${d.year}: ${d.value.toLocaleString()}`)
    .join(", ");
  const consumptionSummary = historicalConsumption
    .slice(-10)
    .map((d) => `${d.year}: ${d.value.toLocaleString()}`)
    .join(", ");

  const dataPoints: string[] = [];
  dataPoints.push(`Commodity: ${commodityName}`);
  dataPoints.push(`Historical supply (last 10 years): ${supplySummary}`);
  dataPoints.push(`Historical consumption (last 10 years): ${consumptionSummary}`);
  if (currentRatio != null) dataPoints.push(`Current supply/consumption ratio: ${currentRatio.toFixed(2)}`);
  if (supplyTrend) dataPoints.push(`Supply trend: ${supplyTrend}`);
  if (consumptionLevel) dataPoints.push(`Consumption level: ${consumptionLevel}`);
  if (productionTotal != null) dataPoints.push(`Current production: ${productionTotal.toLocaleString()} KToE`);
  if (importsTotal != null) dataPoints.push(`Current imports: ${importsTotal.toLocaleString()} KToE`);
  if (exportsTotal != null) dataPoints.push(`Current exports: ${exportsTotal.toLocaleString()} KToE`);
  if (consumptionTotal != null) dataPoints.push(`Current consumption: ${consumptionTotal.toLocaleString()} KToE`);
  if (sectorTotals && sectorTotals.length > 0) {
    const sectorSummary = sectorTotals.map(s => `${s.name}: ${s.total.toLocaleString()}`).join(", ");
    dataPoints.push(`Consumption by sector: ${sectorSummary}`);
  }
  // Parse target year if provided
  let targetYear: number | null = null;
  if (selectedYear && selectedYear !== "ALL") {
    // Extract year from format like "2027-28" -> 2027
    const yearMatch = selectedYear.match(/^(\d{4})/);
    if (yearMatch) {
      targetYear = parseInt(yearMatch[1], 10);
    }
    dataPoints.push(`TARGET YEAR FOR PREDICTIONS: ${selectedYear} (${targetYear})`);
  }
  if (selectedSector && selectedSector !== "ALL") dataPoints.push(`Filtered by sector: ${selectedSector}`);

  const systemContent = `You are an Energy Forecasting Analyst specializing in predictive analytics for energy commodities.

Your task is to generate accurate, data-driven predictions for energy supply and consumption based on historical trends.

${targetYear ? `IMPORTANT: The user has selected a specific target year (${targetYear}). You MUST generate predictions specifically for this year and surrounding years. The KPIs should reflect values for ${targetYear}, not just "next year".` : ''}

CRITICAL: You MUST output ONLY a valid JSON object. No markdown, no code blocks, no explanatory text, no comments. The response must be parseable JSON.

You must output a valid JSON object with this exact structure:
{
  "narrative": "A concise explanation (150-200 words) of future trends, key drivers, and what to expect${targetYear ? `, with focus on ${targetYear}` : ''}",
  "forecasts": {
    "supply": [number, number, ...], // Projected supply values${targetYear ? ` starting from ${targetYear}` : ' for next 5-10 years'} (same units as historical data)
    "consumption": [number, number, ...], // Projected consumption values${targetYear ? ` starting from ${targetYear}` : ' for next 5-10 years'}
    "years": [number, number, ...] // Corresponding years${targetYear ? ` starting with ${targetYear}` : ' (e.g., [2025, 2026, 2027, 2028, 2029])'}
  },
  "kpis": {
    "production": number, // Projected production${targetYear ? ` for ${targetYear}` : ' for next year'} (same units as current)
    "imports": number, // Projected imports${targetYear ? ` for ${targetYear}` : ' for next year'}
    "exports": number, // Projected exports${targetYear ? ` for ${targetYear}` : ' for next year'}
    "consumption": number // Projected consumption${targetYear ? ` for ${targetYear}` : ' for next year'}
  },
  "sectorConsumption": [
    {"sector": "sector name", "consumption": number},
    ...
  ], // Projected consumption by sector${targetYear ? ` for ${targetYear}` : ' for next year'} (same sectors as historical data)
  "riskFactors": ["risk 1", "risk 2", ...], // 3-5 key risks to monitor
  "recommendations": ["recommendation 1", "recommendation 2", ...] // 3-5 actionable recommendations
}

Rules:
- Use linear regression and trend analysis on the historical data to project future values
- ${targetYear ? `CRITICAL: Generate forecasts starting from ${targetYear}. The first year in the years array must be ${targetYear}.` : 'Generate 5-10 years of forecasts (use 5 years if data is limited, 10 years if sufficient historical data exists)'}
- Ensure forecasts are realistic and follow historical patterns
- Supply and consumption arrays must have the same length as years array
- Numbers should be in the same units as the historical data (KToE or PJ)
- Be conservative in projections - don't predict extreme changes unless strongly supported by trends
- ${targetYear ? `KPIs must reflect projected values for ${targetYear} specifically.` : 'KPIs should reflect projected values for the next year.'}
- Narrative should explain the reasoning behind the forecasts${targetYear ? `, especially for ${targetYear}` : ''}
- Risk factors should be specific and actionable
- Recommendations should be concrete and implementable
- CRITICAL: Output ONLY valid JSON. Do NOT include markdown code blocks, do NOT include explanatory text before or after the JSON, do NOT include comments in the JSON. The response must be a valid JSON object that can be parsed directly.
- Ensure all numbers are valid JSON numbers (no commas, no special formatting)
- Ensure all strings are properly quoted
- Ensure no trailing commas in arrays or objects`;

  const prompt = `Based on the following energy data for ${commodityName}, generate predictions:

${dataPoints.join("\n")}

Analyze the historical trends and provide:
1. A narrative explanation of future trends${targetYear ? `, with specific focus on ${targetYear}` : ''}
2. Numerical forecasts for supply and consumption${targetYear ? ` starting from ${targetYear} and extending 5-10 years forward` : ' for the next 5-10 years'}
3. Projected KPIs (production, imports, exports, consumption)${targetYear ? ` for ${targetYear}` : ' for the next year'}
4. Projected consumption breakdown by sector${targetYear ? ` for ${targetYear}` : ' for the next year'}
5. Key risk factors to monitor
6. Actionable recommendations

${targetYear ? `CRITICAL: All KPIs and sector consumption values must be projected specifically for ${targetYear} (${selectedYear}), not for a generic "next year". Use trend analysis to estimate what the values will be in ${targetYear} based on historical patterns.` : 'For KPIs and sector consumption, project values for the next year based on historical trends and patterns.'}
Ensure all numerical values are in the same units as the historical data (KToE).

CRITICAL INSTRUCTIONS FOR JSON OUTPUT:
- Output ONLY the JSON object, nothing else
- Do NOT wrap in markdown code blocks (no \`\`\`json)
- Do NOT add any text before or after the JSON
- Do NOT include comments in the JSON
- Ensure all numbers are valid (no commas, e.g., use 1000000 not 1,000,000)
- Ensure all strings are properly quoted with double quotes
- Ensure no trailing commas in arrays or objects
- The response must be valid JSON that can be parsed directly with JSON.parse()

Output the result as a JSON object matching the specified structure.`;

  const response = await fetch(`${API_BASE}/api/openai/v1/chat/completions`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-Use-Admin-Key": "true", // Use OPENAI_API_KEY_admin for predictions
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Changed from gpt-4.1-mini to gpt-4o-mini for better rate limits
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000, // Increased to ensure complete JSON response
      temperature: 0.3, // Lower temperature for more consistent JSON output
      response_format: { type: "json_object" }, // Force JSON output format
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
          ? "OpenAI API key is invalid or revoked. Create a new key at https://platform.openai.com/account/api-keys and set OPENAI_API_KEY_admin in .env, then restart the dev server."
          : "Energy predictions are not configured. Add OPENAI_API_KEY_admin to your .env file and restart the dev server."
      );
    }
    throw new Error(`OpenAI request failed: ${text}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No response from AI.");
  }

  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    const jsonMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/s);
    if (jsonMatch && jsonMatch[1]) {
      jsonContent = jsonMatch[1];
    } else {
      // Try to find JSON object in the content (non-greedy match)
      const jsonObjectMatch = jsonContent.match(/\{[\s\S]*?\}/s);
      if (jsonObjectMatch) {
        jsonContent = jsonObjectMatch[0];
      } else {
        // Last resort: find first { and last }
        const firstBrace = jsonContent.indexOf('{');
        const lastBrace = jsonContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
        }
      }
    }

    // Clean up common JSON issues
    jsonContent = jsonContent
      .replace(/,\s*}/g, '}') // Remove trailing commas before }
      .replace(/,\s*]/g, ']') // Remove trailing commas before ]
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      // Fix numbers with commas (e.g., 1,000,000 -> 1000000) in JSON values
      // Match numbers with commas in various contexts
      .replace(/(:\s*|\[\s*|,\s*)(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/g, (match, prefix, num) => {
        return prefix + num.replace(/,/g, '');
      })
      // Fix unescaped quotes in string values (common AI mistake)
      .replace(/:\s*"([^"]*(?:\\.[^"]*)*)"([^,}\]]*)/g, (match, value, rest) => {
        // If value contains unescaped newlines or quotes, escape them
        if (value.includes('\n') && !value.includes('\\n')) {
          value = value.replace(/\n/g, '\\n');
        }
        return `: "${value}"${rest}`;
      })
      // Remove any control characters that might break JSON
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();

    // Try to parse JSON
    let parsed: EnergyPredictionData;
    try {
      parsed = JSON.parse(jsonContent) as EnergyPredictionData;
    } catch (parseError) {
      // If parsing fails, try to fix common issues and retry
      console.warn("Initial JSON parse failed, attempting to fix:", parseError);
      
      // Try to extract just the JSON object more aggressively
      const firstBrace = jsonContent.indexOf('{');
      const lastBrace = jsonContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      // Clean again with more aggressive fixes
      jsonContent = jsonContent
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        // Fix unescaped newlines in string values
        .replace(/:\s*"([^"]*)"([^,}\]]*)/g, (match, value, rest) => {
          if (value.includes('\n') && !value.includes('\\n')) {
            value = value.replace(/\n/g, '\\n');
          }
          return `: "${value}"${rest}`;
        })
        // Remove control characters (but keep escaped ones)
        .replace(/(?<!\\)[\x00-\x1F\x7F]/g, '')
        .trim();
        parsed = JSON.parse(jsonContent) as EnergyPredictionData;
      } else {
        throw new Error(`Failed to extract valid JSON from response. Content preview: ${content.substring(0, 200)}...`);
      }
    }
    
    // Validate structure
    if (!parsed.narrative || !parsed.forecasts || !parsed.forecasts.supply || !parsed.forecasts.consumption || !parsed.forecasts.years) {
      throw new Error("Invalid response structure from AI - missing required fields");
    }

    // Ensure KPIs exist (provide defaults if missing)
    if (!parsed.kpis) {
      parsed.kpis = {
        production: 0,
        imports: 0,
        exports: 0,
        consumption: 0,
      };
    }

    // Ensure sectorConsumption exists
    if (!Array.isArray(parsed.sectorConsumption)) {
      parsed.sectorConsumption = [];
    }

    // Ensure arrays have same length
    const minLength = Math.min(
      parsed.forecasts.supply.length,
      parsed.forecasts.consumption.length,
      parsed.forecasts.years.length
    );
    if (minLength === 0) {
      throw new Error("AI response contains empty forecast arrays");
    }
    parsed.forecasts.supply = parsed.forecasts.supply.slice(0, minLength);
    parsed.forecasts.consumption = parsed.forecasts.consumption.slice(0, minLength);
    parsed.forecasts.years = parsed.forecasts.years.slice(0, minLength);

    // Ensure riskFactors and recommendations are arrays
    if (!Array.isArray(parsed.riskFactors)) parsed.riskFactors = [];
    if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [];

    return parsed;
  } catch (parseError) {
    // Log the error and content for debugging
    console.error("JSON parsing error:", parseError);
    console.error("Content that failed to parse:", content.substring(0, 500));
    
    // Try one more time with aggressive cleaning
    try {
      let cleanedContent = content.trim();
      // Remove everything before first {
      const firstBrace = cleanedContent.indexOf('{');
      if (firstBrace > 0) {
        cleanedContent = cleanedContent.substring(firstBrace);
      }
      // Remove everything after last }
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (lastBrace > 0 && lastBrace < cleanedContent.length - 1) {
        cleanedContent = cleanedContent.substring(0, lastBrace + 1);
      }
      
      // Remove common JSON issues
      cleanedContent = cleanedContent
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/(\d),(\d)/g, '$1$2') // Remove commas in numbers
        // Fix unescaped newlines in string values
        .replace(/:\s*"([^"]*)"([^,}\]]*)/g, (match, value, rest) => {
          if (value.includes('\n') && !value.includes('\\n')) {
            value = value.replace(/\n/g, '\\n');
          }
          return `: "${value}"${rest}`;
        })
        // Remove control characters
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim();
      
      const retryParsed = JSON.parse(cleanedContent) as EnergyPredictionData;
      
      // Validate the retry parsed result
      if (retryParsed && retryParsed.forecasts && retryParsed.forecasts.years) {
        return retryParsed;
      }
    } catch (retryError) {
      // If retry also fails, throw with helpful message
      throw new Error(
        `Failed to parse AI response after multiple attempts. ` +
        `The AI may have returned invalid JSON. Error: ${parseError instanceof Error ? parseError.message : "Unknown error"}. ` +
        `Please try again. If the issue persists, the AI model may need adjustment.`
      );
    }
    
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }
}

export function useEnergyPredictions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<EnergyPredictionData | null>(null);

  const generatePredictions = async (data: EnergyHistoricalData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await generateEnergyPredictions(data);
      setPredictions(result);
    } catch (e) {
      const msg = (e as Error)?.message || "Failed to generate predictions";
      setError(msg);
      setPredictions(null);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, predictions, generatePredictions };
}

