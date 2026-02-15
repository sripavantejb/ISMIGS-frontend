/**
 * Mock MSP and mandi prices for farmers. Replace with GET /api/farmers/mandi-prices when available.
 */

import { CROP_IDS, CROP_OPTIONS } from "./crops";

export interface MandiPriceRow {
  cropId: string;
  cropName: string;
  stateId: string;
  msp: number;
  today: number;
  yesterday: number;
  trend: "up" | "down" | "flat";
  trendPct: number;
}

/** Mock MSP (₹/quintal). 1 quintal = 100 kg. Vegetables use indicative market price. */
const MSP_QUINTAL: Record<string, number> = {
  rice: 2180,
  wheat: 2275,
  cotton: 6620,
  sugarcane: 340,
  maize: 2090,
  bajra: 2500,
  jowar: 2800,
  ragi: 3500,
  chickpea: 5300,
  soybean: 4500,
  groundnut: 6100,
  mustard: 5650,
  "pigeon-pea": 7000,
  potato: 1800,
  onion: 2200,
  tomato: 1200,
};

/** Mock "today" and "yesterday" mandi (₹/quintal) by crop+state; trend derived. */
const MOCK_MANDI: Record<string, { today: number; yesterday: number }> = {};
const CROPS = CROP_IDS;
const STATES = ["haryana", "punjab", "uttar-pradesh", "madhya-pradesh", "maharashtra", "andhra-pradesh", "bihar", "chhattisgarh", "gujarat", "odisha", "rajasthan", "tamil-nadu", "telangana", "west-bengal"];
for (const crop of CROPS) {
  for (const state of STATES) {
    const key = `${crop}-${state}`;
    const msp = MSP_QUINTAL[crop] ?? 2000;
    const today = msp * (0.92 + Math.random() * 0.2);
    const yesterday = today * (0.97 + Math.random() * 0.06);
    MOCK_MANDI[key] = { today: Math.round(today), yesterday: Math.round(yesterday) };
  }
}

function getTrend(today: number, yesterday: number): { trend: "up" | "down" | "flat"; trendPct: number } {
  if (yesterday === 0) return { trend: "flat", trendPct: 0 };
  const pct = ((today - yesterday) / yesterday) * 100;
  if (pct > 0.5) return { trend: "up", trendPct: pct };
  if (pct < -0.5) return { trend: "down", trendPct: pct };
  return { trend: "flat", trendPct: pct };
}

function getCropDisplayName(cropId: string): string {
  const opt = CROP_OPTIONS.find((c) => c.id === cropId);
  return opt?.name ?? cropId.charAt(0).toUpperCase() + cropId.slice(1).replace(/-/g, " ");
}

export function getMspMandiMock(cropId: string, stateId: string): MandiPriceRow {
  const key = `${cropId}-${stateId}`;
  const mandi = MOCK_MANDI[key];
  const msp = MSP_QUINTAL[cropId] ?? 2000;
  const fallback = mandi ?? MOCK_MANDI[`${cropId}-haryana`] ?? MOCK_MANDI[`rice-${stateId}`] ?? { today: msp * 1.02, yesterday: msp };
  const { trend, trendPct } = getTrend(fallback.today, fallback.yesterday);
  return {
    cropId,
    cropName: getCropDisplayName(cropId),
    stateId,
    msp,
    today: fallback.today,
    yesterday: fallback.yesterday,
    trend,
    trendPct,
  };
}

/** Mock monthly series for chart: MSP vs mandi over months */
export function getMspMandiChartMock(cropId: string, stateId: string): { month: string; msp: number; mandi: number }[] {
  const msp = MSP_QUINTAL[cropId] ?? 2000;
  const key = `${cropId}-${stateId}`;
  const base = MOCK_MANDI[key]?.today ?? msp * 1.02;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month, i) => ({
    month,
    msp,
    mandi: Math.round(base * (0.95 + (i * 0.01) + (Math.random() * 0.05))),
  }));
}
