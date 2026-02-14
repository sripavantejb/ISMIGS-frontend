/**
 * Water requirement and irrigation guidance by crop.
 */

export interface WaterRequirementRow {
  cropId: string;
  cropName: string;
  dailyWaterMm: number;
  irrigationFrequency: string;
  dripRecommended: boolean;
  dripNote?: string;
}

export const WATER_REQUIREMENT_BY_CROP: WaterRequirementRow[] = [
  { cropId: "rice", cropName: "Rice", dailyWaterMm: 6.5, irrigationFrequency: "Continuous/flooded; 2–3 cm standing", dripRecommended: false },
  { cropId: "wheat", cropName: "Wheat", dailyWaterMm: 4, irrigationFrequency: "5–6 critical irrigations (crown root, tillering, jointing, flowering, milk, dough)", dripRecommended: true, dripNote: "Drip or sprinkler for water saving." },
  { cropId: "cotton", cropName: "Cotton", dailyWaterMm: 5, irrigationFrequency: "Every 10–15 days in vegetative; weekly at flowering/boll", dripRecommended: true, dripNote: "Drip highly recommended." },
  { cropId: "sugarcane", cropName: "Sugarcane", dailyWaterMm: 7, irrigationFrequency: "Weekly in summer; 10–12 days in winter", dripRecommended: true },
  { cropId: "maize", cropName: "Maize", dailyWaterMm: 4.5, irrigationFrequency: "4–5 irrigations at critical stages", dripRecommended: true },
  { cropId: "bajra", cropName: "Bajra", dailyWaterMm: 2.5, irrigationFrequency: "2–3 times (rainfed or light supplemental)", dripRecommended: false },
  { cropId: "jowar", cropName: "Jowar", dailyWaterMm: 3, irrigationFrequency: "3–4 irrigations (critical growth stages); rainfed possible", dripRecommended: true },
  { cropId: "ragi", cropName: "Ragi", dailyWaterMm: 2.5, irrigationFrequency: "2–3 irrigations; drought tolerant", dripRecommended: false },
  { cropId: "chickpea", cropName: "Chickpea", dailyWaterMm: 2.5, irrigationFrequency: "1–2 irrigations at flowering and pod formation", dripRecommended: true },
  { cropId: "soybean", cropName: "Soybean", dailyWaterMm: 4.5, irrigationFrequency: "4–5 irrigations at flowering and pod fill", dripRecommended: true },
  { cropId: "groundnut", cropName: "Groundnut", dailyWaterMm: 4, irrigationFrequency: "4–6 irrigations at flowering and pod development", dripRecommended: true, dripNote: "Drip recommended for water saving." },
  { cropId: "mustard", cropName: "Mustard", dailyWaterMm: 3, irrigationFrequency: "3–4 irrigations at branching, flowering, pod formation", dripRecommended: true },
  { cropId: "pigeon-pea", cropName: "Pigeon pea", dailyWaterMm: 2.5, irrigationFrequency: "1–2 irrigations; mostly rainfed", dripRecommended: false },
  { cropId: "potato", cropName: "Potato", dailyWaterMm: 5.5, irrigationFrequency: "Weekly or as needed; critical at tuber initiation", dripRecommended: true, dripNote: "Drip or sprinkler recommended." },
  { cropId: "onion", cropName: "Onion", dailyWaterMm: 4, irrigationFrequency: "4–6 irrigations; frequent early growth", dripRecommended: true },
  { cropId: "tomato", cropName: "Tomato", dailyWaterMm: 4.5, irrigationFrequency: "Regular irrigation; critical at flowering and fruit set", dripRecommended: true, dripNote: "Drip highly recommended." },
];

export function getWaterRequirement(cropId: string): WaterRequirementRow | null {
  return WATER_REQUIREMENT_BY_CROP.find((r) => r.cropId === cropId) ?? null;
}

/** Approx daily water in L/acre (1 mm = 10 m³/ha ≈ 4.05 m³/acre ≈ 4050 L/acre per 1 mm). So dailyWaterLPerAcre = dailyWaterMm * 4050. */
export function dailyWaterLitersPerAcre(dailyWaterMm: number): number {
  return Math.round(dailyWaterMm * 4050);
}
