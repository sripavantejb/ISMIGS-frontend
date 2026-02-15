import { useState } from "react";
import { API_BASE } from "@/config/api";

export interface CultivationCostInputs {
  crop: string;
  state: string;
  areaAcres: number;
  soilType: string;
  waterAvailability: string;
}

export interface CultivationCostResult {
  totalCost: number;
  cultivationProcess: string[];
  expectedSellingPrice: number;
  costBreakdown?: {
    seed?: number;
    fertilizer?: number;
    labour?: number;
    irrigation?: number;
    other?: number;
  };
}

async function fetchCultivationCost(inputs: CultivationCostInputs): Promise<CultivationCostResult> {
  const systemContent = `You are an agriculture cost analyst for Indian farmers.
Given crop, state, area (acres), soil type, and water availability, output a JSON object with:
- totalCost: number (total cultivation cost in Indian Rupee, INR)
- cultivationProcess: array of strings (5-8 cultivation steps for the crop)
- expectedSellingPrice: number (expected revenue in INR based on typical yield and MSP/market prices)
- costBreakdown: optional object with seed, fertilizer, labour, irrigation, other (numbers in INR)

Use realistic Indian agriculture figures. Prices should reflect 2024-25 trends.`;

  const userContent = `Crop: ${inputs.crop}, State: ${inputs.state}, Area: ${inputs.areaAcres} acres, Soil: ${inputs.soilType}, Water: ${inputs.waterAvailability}.
Return JSON only. No markdown or extra text.`;

  const response = await fetch(`${API_BASE}/api/openai/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    if (response.status === 401 || /api key|api_key|authorization|invalid_request_error|invalid_api_key/i.test(text)) {
      const isInvalidKey = /invalid_api_key|incorrect api key/i.test(text);
      throw new Error(
        isInvalidKey
          ? "OpenAI API key is invalid or revoked. Create a new key at https://platform.openai.com/account/api-keys and set OPENAI_API_KEY in .env, then restart the dev server."
          : "OpenAI API key not configured. Contact admin."
      );
    }
    if (response.status === 503) {
      throw new Error("OpenAI API key not configured. Contact admin.");
    }
    throw new Error(`Failed to get estimate: ${text.slice(0, 150)}`);
  }

  let json: { choices?: Array<{ message?: { content?: string } }> };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Invalid response from API.");
  }

  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("No result from API.");

  // Extract JSON from response (model might wrap in markdown code block)
  let parsed: CultivationCostResult;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const toParse = jsonMatch ? jsonMatch[0] : raw;
  try {
    parsed = JSON.parse(toParse);
  } catch {
    throw new Error("Could not parse cost result. Please try again.");
  }

  if (typeof parsed.totalCost !== "number" || typeof parsed.expectedSellingPrice !== "number") {
    throw new Error("Invalid cost result format.");
  }
  if (!Array.isArray(parsed.cultivationProcess)) {
    parsed.cultivationProcess = [];
  }

  return {
    totalCost: Math.round(parsed.totalCost),
    cultivationProcess: parsed.cultivationProcess.map(String),
    expectedSellingPrice: Math.round(parsed.expectedSellingPrice),
    costBreakdown: parsed.costBreakdown,
  };
}

export function useCultivationCostAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CultivationCostResult | null>(null);

  const calculate = async (inputs: CultivationCostInputs) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await fetchCultivationCost(inputs);
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, result, calculate };
}
