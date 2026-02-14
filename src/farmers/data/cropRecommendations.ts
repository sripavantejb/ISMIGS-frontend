/**
 * Rule-based crop recommendation by state, month, soil, water.
 * Yield from cropStatsByState where available; else static defaults.
 */

import { FARMER_STATES } from "./cropStatsByState";
import { getYieldForStateCrop } from "./cropStatsByState";

export interface RecommendedCrop {
  cropId: string;
  name: string;
  yieldPerAcre: number;
  waterReq: string;
  cultivationSteps: string[];
  estimatedRevenue: number;
  marketDemand: string;
}

const TONS_HA_TO_TONS_ACRE = 1 / 2.47;

/** Default price ₹/ton for revenue estimate */
const DEFAULT_PRICE: Record<string, number> = {
  rice: 22000,
  wheat: 24000,
  cotton: 6500,
  sugarcane: 3200,
  maize: 22000,
  bajra: 21000,
};

/** Crops we can recommend; rice/wheat use state yield, others use default yield (tons/acre). */
const CROP_META: {
  id: string;
  name: string;
  cropKey?: "rice" | "wheat";
  defaultYieldPerAcre: number;
  waterReq: string;
  cultivationSteps: string[];
  /** Preferred months (1-12) for sowing/season */
  preferredMonths: number[];
  /** Soil types that suit (subset); empty = all */
  preferredSoils: string[];
  /** Min water: "Low" | "Medium" | "High" */
  minWater: "Low" | "Medium" | "High";
}[] = [
  { id: "rice", name: "Rice", cropKey: "rice", defaultYieldPerAcre: 2.5, waterReq: "High (1200–1500 mm)", cultivationSteps: ["Puddle and level field", "Transplant 20–25 day seedlings", "Apply N in splits", "Weed and water regularly", "Harvest at 80% grain maturity"], preferredMonths: [6, 7, 8, 9, 10], preferredSoils: ["Alluvial", "Clayey", "Loamy"], minWater: "High" },
  { id: "wheat", name: "Wheat", cropKey: "wheat", defaultYieldPerAcre: 3.2, waterReq: "Medium (400–500 mm)", cultivationSteps: ["Prepare seedbed; sow in rows", "Apply basal and top-dress N", "Irrigate at crown root, tillering, flowering", "Control weeds; harvest at maturity"], preferredMonths: [10, 11, 12, 1, 2], preferredSoils: ["Alluvial", "Loamy", "Black (Regur)"], minWater: "Medium" },
  { id: "cotton", name: "Cotton", defaultYieldPerAcre: 0.35, waterReq: "Medium (500–600 mm)", cultivationSteps: ["Sow in well-drained soil", "Thin to recommended spacing", "Fertilize and irrigate as per schedule", "Pick in 2–3 flushes"], preferredMonths: [5, 6, 7], preferredSoils: ["Black (Regur)", "Alluvial", "Loamy"], minWater: "Medium" },
  { id: "sugarcane", name: "Sugarcane", defaultYieldPerAcre: 35, waterReq: "High (1500–2000 mm)", cultivationSteps: ["Plant setts in furrows", "Earthing up and weeding", "Fertilize and irrigate regularly", "Harvest when maturity indices indicate"], preferredMonths: [2, 3, 9, 10], preferredSoils: ["Alluvial", "Loamy", "Black (Regur)"], minWater: "High" },
  { id: "maize", name: "Maize", defaultYieldPerAcre: 2.2, waterReq: "Medium (500–600 mm)", cultivationSteps: ["Sow in rows", "Apply fertilizer in splits", "Irrigate at critical stages", "Harvest when moisture ~20%"], preferredMonths: [6, 7, 10, 11], preferredSoils: ["Alluvial", "Loamy", "Red"], minWater: "Medium" },
  { id: "bajra", name: "Bajra (Pearl millet)", defaultYieldPerAcre: 1.2, waterReq: "Low (250–350 mm)", cultivationSteps: ["Sow with onset of monsoon", "Thin and weed", "Light irrigation if needed", "Harvest when grain hard"], preferredMonths: [6, 7, 8], preferredSoils: ["Sandy", "Arid / Desert", "Loamy"], minWater: "Low" },
];

const WATER_ORDER = { Low: 0, Medium: 1, High: 2 };

function waterOk(cropMin: "Low" | "Medium" | "High", userWater: string): boolean {
  const u = userWater as "Low" | "Medium" | "High";
  return WATER_ORDER[u] >= WATER_ORDER[cropMin];
}

export function getRecommendedCrops(
  stateId: string,
  month: number,
  soilType: string,
  waterAvailability: string,
  landAcres: number
): RecommendedCrop[] {
  const results: RecommendedCrop[] = [];
  for (const c of CROP_META) {
    const suitableMonth = c.preferredMonths.includes(month);
    const suitableSoil = c.preferredSoils.length === 0 || c.preferredSoils.includes(soilType);
    const suitableWater = waterOk(c.minWater, waterAvailability);
    if (!suitableMonth || !suitableWater) continue;
    if (c.preferredSoils.length > 0 && !suitableSoil) continue;

    let yieldPerAcre = c.defaultYieldPerAcre;
    if (c.cropKey) {
      const stateYieldHa = getYieldForStateCrop(stateId, c.cropKey);
      if (stateYieldHa > 0) yieldPerAcre = stateYieldHa * TONS_HA_TO_TONS_ACRE;
    }
    const price = DEFAULT_PRICE[c.id] ?? 20000;
    const totalYield = yieldPerAcre * landAcres;
    const estimatedRevenue = totalYield * price;

    results.push({
      cropId: c.id,
      name: c.name,
      yieldPerAcre,
      waterReq: c.waterReq,
      cultivationSteps: c.cultivationSteps,
      estimatedRevenue,
      marketDemand: "Stable demand; check local mandi for current prices.",
    });
  }
  return results.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
}

export const MONTH_OPTIONS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
];

export const WATER_OPTIONS = ["Low", "Medium", "High"];
