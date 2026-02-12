/**
 * Sectors affected and impact message per WPI major group.
 * Used for the "Sectors affected" cards and popup on the Inflation (WPI) page.
 */

export interface WPIMajorGroupImpact {
  sectorsAffected: string[];
  message: string;
}

/** Map by display name (Overall, Primary articles, Fuel & power, Manufactured products). */
const IMPACT_MAP: Record<string, WPIMajorGroupImpact> = {
  Overall: {
    sectorsAffected: ["Economy-wide", "Policy", "Interest rates", "Households", "Industry"],
    message:
      "Overall WPI reflects economy-wide wholesale price pressure. When it moves, it affects monetary policy, interest rates, household costs, and industrial margins.",
  },
  "Primary articles": {
    sectorsAffected: ["Agriculture", "Food processing", "Raw materials", "Rural incomes", "Exports"],
    message:
      "Primary articles inflation drives food and raw material costs. Changes here affect agriculture, food processing, rural incomes, and export competitiveness.",
  },
  "Fuel & power": {
    sectorsAffected: ["Transport", "Power", "Manufacturing", "Households", "Petrochemicals"],
    message:
      "Fuel and power prices affect transport, electricity costs, manufacturing input costs, and household energy bills. Shifts here ripple across the economy.",
  },
  "Manufactured products": {
    sectorsAffected: ["FMCG", "Textiles", "Chemicals", "Metals", "Consumer goods"],
    message:
      "Manufactured products WPI reflects factory-gate and wholesale prices. Changes here affect FMCG, textiles, chemicals, metals, and consumer goods margins and retail prices.",
  },
};

const DEFAULT_IMPACT: WPIMajorGroupImpact = {
  sectorsAffected: ["Industry", "Households", "Policy", "Investment"],
  message:
    "WPI changes in this category affect linked industries and households. Use the trends to anticipate cost and price pressure.",
};

/**
 * Returns sectors affected and impact message for a WPI major group display name.
 */
export function getWPIMajorGroupImpact(
  majorGroupDisplayName: string | null | undefined
): WPIMajorGroupImpact {
  if (!majorGroupDisplayName || !majorGroupDisplayName.trim()) return DEFAULT_IMPACT;
  const key = majorGroupDisplayName.trim();
  return IMPACT_MAP[key] ?? DEFAULT_IMPACT;
}
