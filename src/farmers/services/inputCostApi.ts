/**
 * Input cost / price API. Mock data for MVP; replace with backend GET /api/farmers/prices when available.
 */
import { API_BASE } from "@/config/api";
import type { PricePoint } from "../types";

const MOCK_PRICES: PricePoint[] = [
  { type: "fertilizer", value: 24.5, unit: "₹/kg (urea indicative)", trend: "up", updatedAt: new Date().toISOString() },
  { type: "diesel", value: 87.5, unit: "₹/litre", trend: "stable", updatedAt: new Date().toISOString() },
  { type: "electricity", value: 6.2, unit: "₹/kWh (agri tariff indicative)", trend: "up", updatedAt: new Date().toISOString() },
];

export async function fetchInputPrices(): Promise<PricePoint[]> {
  try {
    const res = await fetch(`${API_BASE}/api/farmers/prices`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.prices) ? data.prices : data;
    }
  } catch {
    // ignore
  }
  return MOCK_PRICES;
}

export function estimateIrrigationCostPerAcre(
  irrigationType: "diesel" | "electric" | "solar",
  dieselPerLitre: number,
  electricityPerKwh: number,
  hoursPerAcrePerSeason: number = 80
): number {
  switch (irrigationType) {
    case "diesel":
      return (hoursPerAcrePerSeason / 4) * 5 * dieselPerLitre; // ~5 L/hr, 4 hr/day
    case "electric":
      return (hoursPerAcrePerSeason / 4) * 4 * electricityPerKwh; // ~4 kWh per 4 hr
    case "solar":
      return (hoursPerAcrePerSeason / 4) * 2 * electricityPerKwh; // lower grid use
    default:
      return 0;
  }
}
