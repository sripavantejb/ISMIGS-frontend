/**
 * Sectors affected and impact message per IIP category.
 * Used for the "Sectors affected" cards and popup on the Industrial (IIP) page.
 */

export interface IIPCategoryImpact {
  sectorsAffected: string[];
  message: string;
}

const IMPACT_MAP: Record<string, IIPCategoryImpact> = {
  general: {
    sectorsAffected: ["Economy-wide", "Policy", "Investment", "Employment"],
    message:
      "Overall IIP trends reflect broad industrial activity. When the general index moves, it signals economy-wide momentum and can affect policy, investment decisions, and employment expectations.",
  },
  mining: {
    sectorsAffected: ["Steel", "Cement", "Power", "Manufacturing", "Exports"],
    message:
      "Mining output feeds into steel, cement, and power. Changes here affect raw material costs, manufacturing input availability, and export competitiveness.",
  },
  manufacturing: {
    sectorsAffected: ["Automotive", "Textiles", "Chemicals", "Metals", "Consumer goods"],
    message:
      "Manufacturing IIP drives jobs and supply chains. When it slows or grows, automotive, textiles, chemicals, and consumer goods sectors feel it first—through costs, inventory, and demand.",
  },
  electricity: {
    sectorsAffected: ["Industry", "Residential", "Commercial", "Agriculture"],
    message:
      "Electricity production affects all sectors that depend on power. Supply or cost changes impact industry, households, commercial users, and agriculture.",
  },
  "primary-goods": {
    sectorsAffected: ["Agriculture", "Mining", "Food processing", "Exports"],
    message:
      "Primary goods output links to agriculture and mining. Shifts here affect food processing, raw material supply, and export earnings.",
  },
  "capital-goods": {
    sectorsAffected: ["Investment", "Infrastructure", "Machinery", "Construction"],
    message:
      "Capital goods indicate investment and infrastructure momentum. Changes affect machinery demand, construction activity, and long-term growth expectations.",
  },
  "intermediate-goods": {
    sectorsAffected: ["Manufacturing", "Chemicals", "Metals", "Downstream industry"],
    message:
      "Intermediate goods feed into further production. When this segment moves, manufacturing, chemicals, and metals sectors adjust inputs and capacity.",
  },
  infrastructure: {
    sectorsAffected: ["Construction", "Cement", "Steel", "Real estate", "Government spend"],
    message:
      "Infrastructure and construction goods tie to building activity and government capital spend. Changes affect cement, steel, real estate, and project pipelines.",
  },
  "consumer-durables": {
    sectorsAffected: ["Automotive", "Appliances", "Retail", "Household spending"],
    message:
      "Consumer durables reflect household and retail demand for vehicles and appliances. Shifts here signal consumer confidence and discretionary spending.",
  },
  "consumer-non-durables": {
    sectorsAffected: ["FMCG", "Food", "Pharma", "Retail", "Household spending"],
    message:
      "Consumer non-durables cover FMCG, food, and pharma. Changes here reflect day-to-day consumption and essential spending patterns.",
  },
};

const DEFAULT_IMPACT: IIPCategoryImpact = {
  sectorsAffected: ["Industry", "Employment", "Investment", "Policy"],
  message:
    "IIP changes in this category affect linked industries, employment, and investment. Use the index trends to anticipate supply and demand shifts.",
};

/**
 * Returns sectors affected and impact message for an IIP category slug.
 */
export function getIIPCategoryImpact(categorySlug: string | null | undefined): IIPCategoryImpact {
  if (!categorySlug || !categorySlug.trim()) return DEFAULT_IMPACT;
  const key = categorySlug.trim().toLowerCase();
  return IMPACT_MAP[key] ?? DEFAULT_IMPACT;
}
