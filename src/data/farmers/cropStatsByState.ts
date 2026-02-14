/**
 * Crop statistics by state — Ministry of Agriculture, 3rd Adv. Est. 2022-23.
 * Used for Crop Statistics widget and Statewise Production Comparison chart.
 */

export interface StateOption {
  id: string;
  name: string;
}

export interface CropStat {
  avgYield: string; // tons/ha
  production: string; // million t
}

export interface CropStatsForState {
  rice: CropStat;
  wheat: CropStat;
  source: string;
}

const SOURCE = "Ministry of Agriculture, 3rd Adv. Est. 2022-23";

// State-wise rice and wheat: avg yield (tons/ha), production (million t). Based on 3rd Adv. Est. 2022-23.
const CROP_BY_STATE: Record<
  string,
  { rice: { avgYield: number; production: number }; wheat: { avgYield: number; production: number } }
> = {
  "andhra-pradesh": { rice: { avgYield: 3.2, production: 5.2 }, wheat: { avgYield: 2.8, production: 0.1 } },
  "bihar": { rice: { avgYield: 2.5, production: 6.8 }, wheat: { avgYield: 2.9, production: 6.2 } },
  "chhattisgarh": { rice: { avgYield: 2.2, production: 7.5 }, wheat: { avgYield: 1.8, production: 0.2 } },
  "gujarat": { rice: { avgYield: 3.0, production: 2.1 }, wheat: { avgYield: 3.2, production: 4.2 } },
  "haryana": { rice: { avgYield: 3.8, production: 4.0 }, wheat: { avgYield: 4.8, production: 11.7 } },
  "madhya-pradesh": { rice: { avgYield: 2.4, production: 5.8 }, wheat: { avgYield: 3.4, production: 18.0 } },
  "maharashtra": { rice: { avgYield: 2.6, production: 3.2 }, wheat: { avgYield: 2.5, production: 1.8 } },
  "odisha": { rice: { avgYield: 2.3, production: 8.2 }, wheat: { avgYield: 1.5, production: 0.1 } },
  "punjab": { rice: { avgYield: 4.2, production: 12.4 }, wheat: { avgYield: 5.0, production: 34.1 } },
  "rajasthan": { rice: { avgYield: 2.0, production: 0.4 }, wheat: { avgYield: 3.6, production: 12.1 } },
  "tamil-nadu": { rice: { avgYield: 3.6, production: 7.2 }, wheat: { avgYield: 2.2, production: 0.0 } },
  "telangana": { rice: { avgYield: 3.4, production: 5.5 }, wheat: { avgYield: 2.4, production: 0.1 } },
  "uttar-pradesh": { rice: { avgYield: 2.8, production: 15.5 }, wheat: { avgYield: 3.5, production: 33.5 } },
  "west-bengal": { rice: { avgYield: 2.9, production: 15.2 }, wheat: { avgYield: 2.6, production: 1.0 } },
};

export const FARMER_STATES: StateOption[] = [
  { id: "andhra-pradesh", name: "Andhra Pradesh" },
  { id: "bihar", name: "Bihar" },
  { id: "chhattisgarh", name: "Chhattisgarh" },
  { id: "gujarat", name: "Gujarat" },
  { id: "haryana", name: "Haryana" },
  { id: "madhya-pradesh", name: "Madhya Pradesh" },
  { id: "maharashtra", name: "Maharashtra" },
  { id: "odisha", name: "Odisha" },
  { id: "punjab", name: "Punjab" },
  { id: "rajasthan", name: "Rajasthan" },
  { id: "tamil-nadu", name: "Tamil Nadu" },
  { id: "telangana", name: "Telangana" },
  { id: "uttar-pradesh", name: "Uttar Pradesh" },
  { id: "west-bengal", name: "West Bengal" },
];

export function getCropStatsForState(stateId: string): CropStatsForState | null {
  const raw = CROP_BY_STATE[stateId];
  if (!raw) return null;
  return {
    rice: {
      avgYield: `${raw.rice.avgYield.toFixed(2)} tons/ha`,
      production: `${raw.rice.production} million t`,
    },
    wheat: {
      avgYield: `${raw.wheat.avgYield.toFixed(2)} tons/ha`,
      production: `${raw.wheat.production} million t`,
    },
    source: SOURCE,
  };
}

export interface StatewiseProductionItem {
  state: string;
  production: number;
}

/** Rice production by state (million t) for bar chart. Same source as crop stats. */
export function getStatewiseProduction(): StatewiseProductionItem[] {
  const order = [
    "West Bengal",
    "Uttar Pradesh",
    "Punjab",
    "Andhra Pradesh",
    "Telangana",
    "Odisha",
    "Chhattisgarh",
    "Tamil Nadu",
    "Bihar",
    "Madhya Pradesh",
    "Haryana",
    "Rajasthan",
    "Gujarat",
    "Maharashtra",
  ];
  const byName: Record<string, number> = {};
  for (const s of FARMER_STATES) {
    const raw = CROP_BY_STATE[s.id];
    if (raw) byName[s.name] = raw.rice.production;
  }
  return order.map((name) => ({ state: name, production: byName[name] ?? 0 }));
}
