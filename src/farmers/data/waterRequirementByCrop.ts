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
];

export function getWaterRequirement(cropId: string): WaterRequirementRow | null {
  return WATER_REQUIREMENT_BY_CROP.find((r) => r.cropId === cropId) ?? null;
}

/** Approx daily water in L/acre (1 mm = 10 m³/ha ≈ 4.05 m³/acre ≈ 4050 L/acre per 1 mm). So dailyWaterLPerAcre = dailyWaterMm * 4050. */
export function dailyWaterLitersPerAcre(dailyWaterMm: number): number {
  return Math.round(dailyWaterMm * 4050);
}
