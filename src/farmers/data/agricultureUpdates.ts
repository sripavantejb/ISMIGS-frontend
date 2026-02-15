/**
 * Aggregates agriculture-related updates from schemes, prices, and input costs.
 */

import { GOVERNMENT_SCHEMES } from "./governmentSchemes";
import type { AgricultureUpdate } from "../types";
import type { PricePoint } from "../types";

const MAX_UPDATES = 30;

const PRICE_ALERTS: { id: string; title: string; summary: string; date: string; severity?: AgricultureUpdate["severity"] }[] = [
  { id: "price-wheat", title: "Wheat price up 5% in your region", summary: "Mandi prices trending higher. Consider timing of sale.", date: new Date().toISOString(), severity: "success" },
  { id: "price-rice", title: "Rice MSP unchanged for 2024-25", summary: "Minimum support price stable for kharif marketing season.", date: new Date(Date.now() - 86400000).toISOString() },
  { id: "price-cotton", title: "Cotton mandi price above MSP", summary: "Good selling opportunity; prices above minimum support.", date: new Date(Date.now() - 2 * 86400000).toISOString(), severity: "success" },
];

function schemeToUpdate(scheme: (typeof GOVERNMENT_SCHEMES)[0], date: string): AgricultureUpdate {
  const levelState = scheme.level === "State" && scheme.state ? ` (${scheme.state})` : "";
  return {
    id: `scheme-${scheme.id}`,
    type: "scheme",
    title: `Active scheme: ${scheme.name}`,
    summary: `${scheme.level}${levelState}. Eligibility: ${scheme.eligibility}. Benefit: ${scheme.benefitAmount}`,
    date,
    link: "/agriculture/schemes",
    severity: "info",
  };
}

function pricePointToUpdate(p: PricePoint): AgricultureUpdate {
  const trendLabel = p.trend === "up" ? "up" : p.trend === "down" ? "down" : "stable";
  const title = `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} price ${trendLabel}`;
  const summary = `Current: ${p.value} ${p.unit}`;
  return {
    id: `input-${p.type}`,
    type: "input_cost",
    title,
    summary,
    date: p.updatedAt || new Date().toISOString(),
    link: "/agriculture/costs",
    severity: p.trend === "up" ? "warning" : p.trend === "down" ? "success" : "info",
  };
}

/**
 * Combines schemes, static price alerts, and input cost data into a single feed.
 * Sorts by date descending and caps at MAX_UPDATES.
 */
export function getAgricultureUpdates(inputCosts?: PricePoint[]): AgricultureUpdate[] {
  const now = Date.now();
  const schemeUpdates = GOVERNMENT_SCHEMES.map((s, i) => {
    const date = new Date(now - i * 86400000).toISOString();
    return schemeToUpdate(s, date);
  });

  const priceUpdates: AgricultureUpdate[] = PRICE_ALERTS.map((p) => ({
    id: p.id,
    type: "price" as const,
    title: p.title,
    summary: p.summary,
    date: p.date,
    link: "/agriculture/market-prices",
    severity: p.severity,
  }));

  const inputUpdates: AgricultureUpdate[] = inputCosts?.map(pricePointToUpdate) ?? [];

  const all = [...schemeUpdates, ...priceUpdates, ...inputUpdates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return all.slice(0, MAX_UPDATES);
}
