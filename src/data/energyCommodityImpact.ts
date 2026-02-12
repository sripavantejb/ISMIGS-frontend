/**
 * User-facing correlation-style messages for energy commodities.
 * Explains downstream impact in plain language (e.g. price rises → cost of living).
 */

export interface CommodityImpact {
  sectorsAffected: string[];
  userMessage: string;
}

const IMPACT_MAP: Record<string, CommodityImpact> = {
  Coal: {
    sectorsAffected: ["Power", "Industry", "Steel", "Cement"],
    userMessage:
      "If coal gets costlier or scarce, power and factory costs can go up. That can make everyday things more expensive.",
  },
  "Natural gas": {
    sectorsAffected: ["Power", "Fertilizer", "Industry", "Residential"],
    userMessage:
      "If gas prices go up, your power and fertilizer costs can rise. That can make food cost more over time.",
  },
  "Natural Gas": {
    sectorsAffected: ["Power", "Fertilizer", "Industry", "Residential"],
    userMessage:
      "If gas prices go up, your power and fertilizer costs can rise. That can make food cost more over time.",
  },
  "Crude oil": {
    sectorsAffected: ["Transport", "Petrochemicals", "Agriculture"],
    userMessage:
      "If oil prices go up, fuel and travel cost more. Things you buy can get more expensive.",
  },
  "Crude Oil": {
    sectorsAffected: ["Transport", "Petrochemicals", "Agriculture"],
    userMessage:
      "If oil prices go up, fuel and travel cost more. Things you buy can get more expensive.",
  },
  Electricity: {
    sectorsAffected: ["Industry", "Residential", "Commercial", "Agriculture"],
    userMessage:
      "If power supply is tight or bills go up, your home and business costs can rise. You may pay more for things.",
  },
  "Petroleum products": {
    sectorsAffected: ["Transport", "Industry", "Agriculture", "Residential"],
    userMessage:
      "If diesel or cooking gas gets costlier, travel and cooking cost more. Prices of goods can go up.",
  },
  "Petroleum Products": {
    sectorsAffected: ["Transport", "Industry", "Agriculture", "Residential"],
    userMessage:
      "If diesel or cooking gas gets costlier, travel and cooking cost more. Prices of goods can go up.",
  },
  "Nuclear energy": {
    sectorsAffected: ["Power"],
    userMessage:
      "Nuclear power helps keep the lights on. If it changes, power prices can go up or down.",
  },
  "Nuclear Energy": {
    sectorsAffected: ["Power"],
    userMessage:
      "Nuclear power helps keep the lights on. If it changes, power prices can go up or down.",
  },
  "Hydro power": {
    sectorsAffected: ["Power"],
    userMessage:
      "Water power depends on rain. Less rain can mean less power and higher bills.",
  },
  "Hydro Power": {
    sectorsAffected: ["Power"],
    userMessage:
      "Water power depends on rain. Less rain can mean less power and higher bills.",
  },
  "Renewable energy": {
    sectorsAffected: ["Power", "Industry"],
    userMessage:
      "More solar and wind can help keep power costs stable. Sometimes supply can still change and affect prices.",
  },
  "Renewable Energy": {
    sectorsAffected: ["Power", "Industry"],
    userMessage:
      "More solar and wind can help keep power costs stable. Sometimes supply can still change and affect prices.",
  },
};

const DEFAULT_IMPACT: CommodityImpact = {
  sectorsAffected: ["Power", "Industry", "Transport", "Residential"],
  userMessage:
    "When this energy type changes in supply or price, it can affect power, transport, and the cost of things you buy.",
};

/**
 * Returns user-facing impact message and sectors for a given commodity name.
 * Uses case-sensitive match first, then case-insensitive; otherwise returns default.
 */
export function getCommodityImpact(commodityName: string | null | undefined): CommodityImpact {
  if (!commodityName || !commodityName.trim()) return DEFAULT_IMPACT;
  const exact = IMPACT_MAP[commodityName];
  if (exact) return exact;
  const key = Object.keys(IMPACT_MAP).find((k) => k.toLowerCase() === commodityName.trim().toLowerCase());
  return key ? IMPACT_MAP[key] : DEFAULT_IMPACT;
}
