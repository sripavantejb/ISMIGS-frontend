/**
 * Data-driven sector/component impact for GDP and other pages.
 * Returns affected (yes/no), direction (positive/negative/neutral), and metric for display.
 */

export type ImpactDirection = "positive" | "negative" | "neutral";

export interface ComponentImpactResult {
  affected: boolean;
  direction: ImpactDirection;
  metricLabel: string;
  metricValue: string;
  growthPct: number | null;
}

const GROWTH_NEUTRAL_THRESHOLD = 0.5;
const GDP_SLOWDOWN_THRESHOLD = 4;

function directionFromGrowth(growthPct: number | null): ImpactDirection {
  if (growthPct === null || !Number.isFinite(growthPct)) return "neutral";
  if (growthPct > GROWTH_NEUTRAL_THRESHOLD) return "positive";
  if (growthPct < -GROWTH_NEUTRAL_THRESHOLD) return "negative";
  return "neutral";
}

function affectedFromGrowth(growthPct: number | null): boolean {
  if (growthPct === null || !Number.isFinite(growthPct)) return false;
  return Math.abs(growthPct) > GROWTH_NEUTRAL_THRESHOLD || growthPct < GDP_SLOWDOWN_THRESHOLD;
}

export interface GDPComponentInput {
  seriesKey: "gva" | "tax" | "gdp" | "proxy";
  name: string;
}

export interface GDPImpactInputs {
  gvaGrowthPct: number | null;
  taxGrowthPct: number | null;
  gdpGrowthPct: number | null;
}

/**
 * Returns impact result for a single GDP component given series key and page inputs.
 */
export function getGDPComponentImpact(
  component: GDPComponentInput,
  inputs: GDPImpactInputs
): ComponentImpactResult {
  let growthPct: number | null = null;
  let metricLabel = "YoY growth";

  switch (component.seriesKey) {
    case "gva":
      growthPct = inputs.gvaGrowthPct ?? inputs.gdpGrowthPct;
      metricLabel = "GVA YoY growth";
      break;
    case "tax":
      growthPct = inputs.taxGrowthPct ?? inputs.gdpGrowthPct;
      metricLabel = "Net taxes YoY growth";
      break;
    case "gdp":
    case "proxy":
    default:
      growthPct = inputs.gdpGrowthPct;
      metricLabel = component.seriesKey === "gdp" ? "GDP YoY growth" : "GDP YoY growth (proxy)";
      break;
  }

  const direction = directionFromGrowth(growthPct);
  const affected = affectedFromGrowth(growthPct);
  const metricValue =
    growthPct != null && Number.isFinite(growthPct)
      ? `${growthPct.toFixed(2)}%`
      : "—";

  return {
    affected,
    direction,
    metricLabel,
    metricValue,
    growthPct,
  };
}

/**
 * Compute YoY growth from a trend series (array of { year, currentPrice }).
 */
export function computeYoYGrowthFromTrend(
  trend: { year: string; currentPrice: number }[]
): number | null {
  if (!trend || trend.length < 2) return null;
  const sorted = [...trend].sort((a, b) => a.year.localeCompare(b.year));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  if (!prev.currentPrice || prev.currentPrice === 0) return null;
  return ((last.currentPrice - prev.currentPrice) / prev.currentPrice) * 100;
}
