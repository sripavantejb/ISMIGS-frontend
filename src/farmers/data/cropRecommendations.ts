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
  jowar: 11000,
  ragi: 14000,
  chickpea: 53000,
  soybean: 45000,
  groundnut: 61000,
  mustard: 56500,
  "pigeon-pea": 70000,
  potato: 15000,
  onion: 22000,
  tomato: 12000,
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
  { id: "jowar", name: "Jowar (Sorghum)", defaultYieldPerAcre: 0.8, waterReq: "Low (300–400 mm)", cultivationSteps: ["Sow at onset of monsoon", "Thin to spacing", "Light irrigation at critical stages", "Harvest when grain hard"], preferredMonths: [6, 7, 8], preferredSoils: ["Loamy", "Black (Regur)", "Red"], minWater: "Low" },
  { id: "ragi", name: "Ragi (Finger millet)", defaultYieldPerAcre: 1.0, waterReq: "Low (400–500 mm)", cultivationSteps: ["Sow or transplant", "Weed and fertilize", "Light irrigation if needed", "Harvest at maturity"], preferredMonths: [5, 6, 7], preferredSoils: ["Red", "Loamy", "Laterite"], minWater: "Low" },
  { id: "chickpea", name: "Chickpea (Gram)", defaultYieldPerAcre: 0.7, waterReq: "Low (350–400 mm)", cultivationSteps: ["Sow in rabi", "One irrigation at flowering", "Harvest when pods mature"], preferredMonths: [10, 11], preferredSoils: ["Alluvial", "Loamy", "Black (Regur)"], minWater: "Low" },
  { id: "soybean", name: "Soybean", defaultYieldPerAcre: 0.9, waterReq: "Medium (500–600 mm)", cultivationSteps: ["Sow in kharif", "Inoculate seed", "Irrigate at flowering and pod fill", "Harvest when pods turn brown"], preferredMonths: [6, 7], preferredSoils: ["Alluvial", "Loamy", "Black (Regur)"], minWater: "Medium" },
  { id: "groundnut", name: "Groundnut", defaultYieldPerAcre: 1.0, waterReq: "Medium (500–600 mm)", cultivationSteps: ["Sow in kharif", "Earthing up", "Irrigate at flowering and peg penetration", "Harvest when leaves yellow"], preferredMonths: [6, 7], preferredSoils: ["Sandy", "Loamy", "Red"], minWater: "Medium" },
  { id: "mustard", name: "Mustard", defaultYieldPerAcre: 0.6, waterReq: "Low (350–400 mm)", cultivationSteps: ["Sow in rabi", "Thin and weed", "2–3 irrigations at critical stages", "Harvest when pods turn yellow"], preferredMonths: [10, 11], preferredSoils: ["Alluvial", "Loamy", "Black (Regur)"], minWater: "Low" },
  { id: "pigeon-pea", name: "Pigeon pea", defaultYieldPerAcre: 0.4, waterReq: "Low (400–500 mm)", cultivationSteps: ["Sow in kharif", "Intercrop optional", "1–2 irrigations if rain deficit", "Harvest when pods mature"], preferredMonths: [6, 7], preferredSoils: ["Loamy", "Red", "Alluvial"], minWater: "Low" },
  { id: "potato", name: "Potato", defaultYieldPerAcre: 12, waterReq: "High (500–700 mm)", cultivationSteps: ["Plant tubers in ridges", "Earthing up", "Regular irrigation", "Harvest when tops die"], preferredMonths: [10, 11, 12], preferredSoils: ["Alluvial", "Loamy", "Sandy"], minWater: "High" },
  { id: "onion", name: "Onion", defaultYieldPerAcre: 8, waterReq: "Medium (350–500 mm)", cultivationSteps: ["Transplant seedlings", "Frequent irrigation early", "Reduce water at bulb formation", "Harvest when tops fall"], preferredMonths: [11, 12, 1], preferredSoils: ["Alluvial", "Loamy", "Sandy"], minWater: "Medium" },
  { id: "tomato", name: "Tomato", defaultYieldPerAcre: 15, waterReq: "Medium (500–600 mm)", cultivationSteps: ["Transplant seedlings", "Stake if needed", "Regular irrigation", "Harvest at maturity"], preferredMonths: [7, 8, 9, 10], preferredSoils: ["Alluvial", "Loamy", "Red"], minWater: "Medium" },
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

/** Default yield (tons/acre) for crops without state-specific data. */
export function getDefaultYieldPerAcre(cropId: string): number {
  const meta = CROP_META.find((c) => c.id === cropId);
  return meta?.defaultYieldPerAcre ?? 1;
}

/** Default price ₹/ton for profitability. */
export function getDefaultPricePerTon(cropId: string): number {
  return DEFAULT_PRICE[cropId] ?? 20000;
}
