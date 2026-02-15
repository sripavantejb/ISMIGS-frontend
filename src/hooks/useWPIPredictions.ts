import { useState } from "react";
import { API_BASE } from "@/config/api";

export interface WPIPredictionData {
  narrative: string;
  forecasts: {
    inflation: number[]; // Projected inflation rates (%)
    index: number[]; // Projected WPI index values
    years: number[]; // Corresponding years
  };
  kpis: {
    projectedInflation: number; // Projected inflation % for target year
    projectedIndex: number; // Projected WPI index for target year
    primaryArticles: number; // Projected primary articles index
    fuelPower: number; // Projected fuel & power index
  };
  riskFactors: string[];
  recommendations: string[];
}

export interface WPIHistoricalData {
  majorGroup: string;
  historicalData: Array<{
    year: number;
    index?: number;
    inflation?: number;
    primaryArticles?: number;
    fuelPower?: number;
  }>;
  latestIndex?: number;
  latestInflation?: number;
  latestPrimaryArticles?: number;
  latestFuelPower?: number;
  selectedYear?: string;
  trendDirection?: string;
}

export async function generateWPIPredictions(
  data: WPIHistoricalData
): Promise<WPIPredictionData> {
  const {
    majorGroup,
    historicalData,
    latestIndex,
    latestInflation,
    latestPrimaryArticles,
    latestFuelPower,
    selectedYear,
    trendDirection,
  } = data;

  // Build data summary for prompt
  const dataSummary = historicalData
    .slice(-10)
    .map((d) => {
      const parts: string[] = [];
      parts.push(`${d.year}:`);
      if (d.index != null) parts.push(`Index=${d.index.toFixed(1)}`);
      if (d.inflation != null) parts.push(`Inflation=${d.inflation.toFixed(2)}%`);
      return parts.join(" ");
    })
    .join(", ");

  const dataPoints: string[] = [];
  dataPoints.push(`Major Group: ${majorGroup}`);
  dataPoints.push(`Historical data (last 10 years): ${dataSummary}`);
  if (latestIndex != null) dataPoints.push(`Latest WPI index: ${latestIndex.toFixed(1)}`);
  if (latestInflation != null) dataPoints.push(`Latest inflation rate: ${latestInflation.toFixed(2)}%`);
  if (latestPrimaryArticles != null) dataPoints.push(`Latest Primary Articles index: ${latestPrimaryArticles.toFixed(1)}`);
  if (latestFuelPower != null) dataPoints.push(`Latest Fuel & Power index: ${latestFuelPower.toFixed(1)}`);
  if (trendDirection) dataPoints.push(`Trend direction: ${trendDirection}`);

  // Parse target year if provided
  let targetYear: number | null = null;
  const currentYear = new Date().getFullYear();
  const startYear = currentYear + 1; // Start from next year
  if (selectedYear && selectedYear !== "ALL") {
    const yearMatch = selectedYear.match(/^(\d{4})/);
    if (yearMatch) {
      targetYear = parseInt(yearMatch[1], 10);
    }
    dataPoints.push(`TARGET YEAR FOR PREDICTIONS: ${selectedYear} (${targetYear})`);
    dataPoints.push(`CRITICAL: Generate forecasts starting from ${startYear} and extending AT LEAST to ${targetYear}. The years array must include all years from ${startYear} through ${targetYear} (and preferably 2-3 years beyond ${targetYear} for context).`);
  }

  const systemContent = `You are a Wholesale Price Index (WPI) Forecasting Analyst specializing in predictive analytics for inflation and price indices.

Your task is to generate accurate, data-driven predictions for WPI inflation and index values based on historical trends.

${targetYear ? `IMPORTANT: The user has selected a specific target year (${targetYear}). You MUST generate predictions starting from ${startYear} and extending AT LEAST to ${targetYear}. The years array must include all years from ${startYear} through ${targetYear} (and preferably 2-3 years beyond for context). The KPIs should reflect values for ${targetYear}, not just "next year".` : ''}

CRITICAL: You MUST output ONLY a valid JSON object. No markdown, no code blocks, no explanatory text, no comments. The response must be parseable JSON.

You must output a valid JSON object with this exact structure:
{
  "narrative": "A concise explanation (150-200 words) of future inflation trends, key drivers, and what to expect${targetYear ? `, with specific focus on ${targetYear}` : ''}",
  "forecasts": {
    "inflation": [number, number, ...], // Projected inflation rates (%)${targetYear ? ` starting from ${startYear} and extending to at least ${targetYear} (include ${targetYear} in the array)` : ' for next 5-10 years'}
    "index": [number, number, ...], // Projected WPI index values${targetYear ? ` starting from ${startYear} and extending to at least ${targetYear} (include ${targetYear} in the array)` : ' for next 5-10 years'}
    "years": [number, number, ...] // Corresponding years${targetYear ? ` starting from ${startYear}, MUST include ${targetYear}, and extend 2-3 years beyond ${targetYear}` : ' (e.g., [2025, 2026, 2027, 2028, 2029])'}
  },
  "kpis": {
    "projectedInflation": number, // Projected inflation %${targetYear ? ` for ${targetYear}` : ' for next year'}
    "projectedIndex": number, // Projected WPI index${targetYear ? ` for ${targetYear}` : ' for next year'}
    "primaryArticles": number, // Projected Primary Articles index${targetYear ? ` for ${targetYear}` : ' for next year'}
    "fuelPower": number // Projected Fuel & Power index${targetYear ? ` for ${targetYear}` : ' for next year'}
  },
  "riskFactors": ["risk 1", "risk 2", ...], // 3-5 key risks to monitor
  "recommendations": ["recommendation 1", "recommendation 2", ...] // 3-5 actionable recommendations
}

Rules:
- Use linear regression and trend analysis on the historical data to project future values
- ${targetYear ? `CRITICAL: Generate forecasts starting from ${startYear} and extending AT LEAST to ${targetYear}. The years array must start with ${startYear} and MUST include ${targetYear}. Extend 2-3 years beyond ${targetYear} for context. For example, if ${targetYear} is selected, generate: [${startYear}, ${startYear + 1}, ..., ${targetYear}, ${targetYear + 1}, ${targetYear + 2}, ${targetYear + 3}].` : 'Generate 5-10 years of forecasts (use 5 years if data is limited, 10 years if sufficient historical data exists)'}
- Ensure forecasts are realistic and follow historical patterns
- Inflation, index, and years arrays must have the same length
- Index values should be consistent with historical ranges
- Inflation rates should be realistic (typically -5% to +15% range for WPI)
- Be conservative in projections - don't predict extreme changes unless strongly supported by trends
- ${targetYear ? `KPIs must reflect projected values for ${targetYear} specifically.` : 'KPIs should reflect projected values for the next year.'}
- Narrative should explain the reasoning behind the forecasts${targetYear ? `, especially for ${targetYear}` : ''}
- Risk factors should be specific and actionable
- Recommendations should be concrete and implementable
- CRITICAL: Output ONLY valid JSON. Do NOT include markdown code blocks, do NOT include explanatory text before or after the JSON, do NOT include comments in the JSON. The response must be a valid JSON object that can be parsed directly.
- Ensure all numbers are valid JSON numbers (no commas, no special formatting)
- Ensure all strings are properly quoted
- Ensure no trailing commas in arrays or objects`;

  const prompt = `Based on the following WPI data for ${majorGroup}, generate predictions:

${dataPoints.join("\n")}

Analyze the historical trends and provide:
1. A narrative explanation of future inflation trends${targetYear ? `, with specific focus on ${targetYear}` : ''}
2. Numerical forecasts for inflation rates and WPI index${targetYear ? ` starting from ${startYear} and extending AT LEAST to ${targetYear} (preferably 2-3 years beyond ${targetYear} for context). The years array MUST include EVERY year from ${startYear} through ${targetYear} (e.g., if ${targetYear} is selected, include: [${startYear}, ${startYear + 1}, ${startYear + 2}, ..., ${targetYear - 1}, ${targetYear}, ${targetYear + 1}, ${targetYear + 2}, ${targetYear + 3}]). DO NOT stop at an earlier year. DO NOT skip years.` : ' for the next 5-10 years'}
3. Projected KPIs (inflation, index, primary articles, fuel & power)${targetYear ? ` for ${targetYear}` : ' for the next year'}
4. Key risk factors to monitor
5. Actionable recommendations

${targetYear ? `CRITICAL: All KPIs must be projected specifically for ${targetYear} (${selectedYear}), not for a generic "next year". Use trend analysis to estimate what the values will be in ${targetYear} based on historical patterns. The forecasts arrays MUST include data for EVERY year from ${startYear} through ${targetYear} - do not stop at an earlier year.` : 'For KPIs, project values for the next year based on historical trends and patterns.'}

CRITICAL INSTRUCTIONS FOR JSON OUTPUT:
- Output ONLY the JSON object, nothing else
- Do NOT wrap in markdown code blocks (no \`\`\`json)
- Do NOT add any text before or after the JSON
- Do NOT include comments in the JSON
- Ensure all numbers are valid (no commas, e.g., use 100.5 not 100,5)
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
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
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
          : "WPI predictions are not configured. Add OPENAI_API_KEY_admin to your .env file and restart the dev server."
      );
    }
    throw new Error(`OpenAI request failed: ${text}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No response from AI.");
  }

  // Helper function to fix JSON string values with unescaped quotes and special characters
  function fixJsonStringValues(jsonStr: string): string {
    let result = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      const nextChar = jsonStr[i + 1];
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        result += char;
        continue;
      }
      
      if (char === '"') {
        if (!inString) {
          inString = true;
          result += char;
        } else {
          if (!nextChar || nextChar === ':' || nextChar === ',' || nextChar === '}' || nextChar === ']' || /\s/.test(nextChar)) {
            inString = false;
            result += char;
          } else {
            result += '\\"';
          }
        }
      } else {
        if (inString) {
          if (char === '\n') {
            result += '\\n';
          } else if (char === '\r') {
            result += '\\r';
          } else if (char === '\t') {
            result += '\\t';
          } else if (/[\x00-\x1F\x7F]/.test(char)) {
            continue;
          } else {
            result += char;
          }
        } else {
          result += char;
        }
      }
    }
    
    return result;
  }

  try {
    let jsonContent = content.trim();
    
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    } else {
      throw new Error("Could not find valid JSON boundaries");
    }

    jsonContent = jsonContent
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/(:\s*|\[\s*|,\s*)(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/g, (match, prefix, num) => {
        return prefix + num.replace(/,/g, '');
      })
      .trim();

    jsonContent = fixJsonStringValues(jsonContent);

    let parsed: WPIPredictionData;
    try {
      parsed = JSON.parse(jsonContent) as WPIPredictionData;
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting to fix:", parseError);
      
      const firstBrace = jsonContent.indexOf('{');
      const lastBrace = jsonContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
        
        let openBraces = (jsonContent.match(/\{/g) || []).length;
        let closeBraces = (jsonContent.match(/\}/g) || []).length;
        let openBrackets = (jsonContent.match(/\[/g) || []).length;
        let closeBrackets = (jsonContent.match(/\]/g) || []).length;
        
        while (openBraces > closeBraces) {
          jsonContent += '}';
          closeBraces++;
        }
        while (openBrackets > closeBrackets) {
          jsonContent += ']';
          closeBrackets++;
        }
        
        jsonContent = fixJsonStringValues(jsonContent);
        jsonContent = jsonContent
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .trim();
        
        parsed = JSON.parse(jsonContent) as WPIPredictionData;
      } else {
        throw new Error(`Failed to extract valid JSON from response. Content preview: ${content.substring(0, 200)}...`);
      }
    }
    
    // Validate structure
    if (!parsed.narrative || !parsed.forecasts || !parsed.forecasts.inflation || !parsed.forecasts.index || !parsed.forecasts.years) {
      throw new Error("Invalid response structure from AI - missing required fields");
    }

    // Ensure KPIs exist
    if (!parsed.kpis) {
      parsed.kpis = {
        projectedInflation: 0,
        projectedIndex: 0,
        primaryArticles: 0,
        fuelPower: 0,
      };
    }

    // Ensure arrays have same length
    const minLength = Math.min(
      parsed.forecasts.inflation.length,
      parsed.forecasts.index.length,
      parsed.forecasts.years.length
    );
    if (minLength === 0) {
      throw new Error("AI response contains empty forecast arrays");
    }
    parsed.forecasts.inflation = parsed.forecasts.inflation.slice(0, minLength);
    parsed.forecasts.index = parsed.forecasts.index.slice(0, minLength);
    parsed.forecasts.years = parsed.forecasts.years.slice(0, minLength);

    // Ensure riskFactors and recommendations are arrays
    if (!Array.isArray(parsed.riskFactors)) parsed.riskFactors = [];
    if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [];

    return parsed;
  } catch (parseError) {
    console.error("JSON parsing error:", parseError);
    console.error("Content that failed to parse:", content.substring(0, 500));
    
    try {
      let cleanedContent = content.trim();
      const firstBrace = cleanedContent.indexOf('{');
      if (firstBrace > 0) {
        cleanedContent = cleanedContent.substring(firstBrace);
      }
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (lastBrace > 0 && lastBrace < cleanedContent.length - 1) {
        cleanedContent = cleanedContent.substring(0, lastBrace + 1);
      }
      
      cleanedContent = cleanedContent
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/(\d),(\d)/g, '$1$2')
        .replace(/:\s*"([^"]*)"([^,}\]]*)/g, (match, value, rest) => {
          if (value.includes('\n') && !value.includes('\\n')) {
            value = value.replace(/\n/g, '\\n');
          }
          return `: "${value}"${rest}`;
        })
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim();
      
      const retryParsed = JSON.parse(cleanedContent) as WPIPredictionData;
      
      if (retryParsed && retryParsed.forecasts && retryParsed.forecasts.years) {
        return retryParsed;
      }
    } catch (retryError) {
      throw new Error(
        `Failed to parse AI response after multiple attempts. ` +
        `The AI may have returned invalid JSON. Error: ${parseError instanceof Error ? parseError.message : "Unknown error"}. ` +
        `Please try again. If the issue persists, the AI model may need adjustment.`
      );
    }
    
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }
}

export function useWPIPredictions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<WPIPredictionData | null>(null);

  const generatePredictions = async (data: WPIHistoricalData) => {
    // Create a cache key based on the data (include year in key)
    const cacheKey = `wpi-predictions-${data.majorGroup}-${data.selectedYear || 'all'}`;
    
    // Check cache first - show cached data immediately if available
    const cached = sessionStorage.getItem(cacheKey);
    if (cached && data.selectedYear) {
      try {
        const cachedData = JSON.parse(cached) as WPIPredictionData;
        // Validate cached data structure and verify it extends to selected year
        if (cachedData && cachedData.forecasts && cachedData.forecasts.years && cachedData.forecasts.years.length > 0) {
          // Verify cached data extends to selected year
          const yearMatch = data.selectedYear.match(/^(\d{4})/);
          if (yearMatch) {
            const targetYear = parseInt(yearMatch[1], 10);
            const maxYear = Math.max(...cachedData.forecasts.years);
            if (maxYear >= targetYear) {
              setPredictions(cachedData);
              // Still generate in background for fresh data, but show cached immediately
            } else {
              // Cache doesn't extend far enough - clear it and regenerate
              sessionStorage.removeItem(cacheKey);
            }
          } else {
            setPredictions(cachedData);
          }
        }
      } catch (e) {
        console.warn("Failed to parse cached predictions", e);
      }
    } else if (cached && !data.selectedYear) {
      // If no year selected, use cached data
      try {
        const cachedData = JSON.parse(cached) as WPIPredictionData;
        if (cachedData && cachedData.forecasts && cachedData.forecasts.years && cachedData.forecasts.years.length > 0) {
          setPredictions(cachedData);
        }
      } catch (e) {
        console.warn("Failed to parse cached predictions", e);
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await generateWPIPredictions(data);
      setPredictions(result);
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
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

