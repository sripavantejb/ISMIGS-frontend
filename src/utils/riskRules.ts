export interface RiskAlert {
  id: string;
  type: "danger" | "warning";
  title: string;
  message: string;
}

export function detectGdpRisk(latestGrowthPct: number | null | undefined): RiskAlert | null {
  if (latestGrowthPct === undefined || latestGrowthPct === null) return null;
  if (latestGrowthPct < 4) {
    return {
      id: "gdp-slowdown",
      type: "warning",
      title: "Economic Slowdown Alert",
      message: `Latest GDP growth is ${latestGrowthPct.toFixed(1)}%, below the 4% threshold.`,
    };
  }
  return null;
}

export function detectEnergyRisk(latestRatio: number | null | undefined): RiskAlert | null {
  if (latestRatio === null || latestRatio === undefined) return null;
  if (latestRatio < 1) {
    return {
      id: "energy-deficit",
      type: "danger",
      title: "Energy Deficit Alert",
      message: "Energy balance ratio (Supply / Consumption) is below 1.",
    };
  }
  return null;
}

export function detectWpiRisk(latestInflationPct: number | null | undefined): RiskAlert | null {
  if (latestInflationPct === null || latestInflationPct === undefined) return null;
  if (latestInflationPct > 6) {
    return {
      id: "wpi-inflation",
      type: "danger",
      title: "Inflation Alert",
      message: `Wholesale Price Index growth is ${latestInflationPct.toFixed(1)}%, above 6%.`,
    };
  }
  return null;
}

export function detectIipRisk(
  monthlyGrowthSeries: { growthRate?: number }[] | null | undefined
): RiskAlert | null {
  if (!monthlyGrowthSeries || monthlyGrowthSeries.length === 0) return null;

  let streak = 0;
  for (let i = 0; i < monthlyGrowthSeries.length; i += 1) {
    const m = monthlyGrowthSeries[i];
    const rate = m.growthRate ?? 0;
    if (rate < 0) {
      streak += 1;
      if (streak >= 3) {
        return {
          id: "iip-stress",
          type: "warning",
          title: "Industrial Stress Alert",
          message: "Detected 3 consecutive months of negative IIP growth.",
        };
      }
    } else {
      streak = 0;
    }
  }
  return null;
}

// ─── Per-commodity energy (admin-only) warnings ───

export interface EnergyCommodityAnalysis {
  byYear: { year: number; fiscalYear: string; supply: number; consumption: number; ratio: number | null }[];
  latest: { year: number; fiscalYear: string; supply: number; consumption: number; ratio: number | null } | null;
}

export interface EnergyCommodityForecast {
  nextYear: number;
  projectedSupply: number | null;
  projectedConsumption: number | null;
  projectedRatio: number | null;
  status: string;
  history: { x: number; supply: number; consumption: number }[];
}

const VOLATILITY_YOY_THRESHOLD_PCT = 15;

/**
 * Returns admin-only alerts for a given commodity: deficit, declining trend, high volatility.
 * Shown only when view=admin (or admin toggle).
 */
export function getEnergyCommodityAdminWarnings(
  commodityName: string,
  analysis: EnergyCommodityAnalysis | null,
  forecast: EnergyCommodityForecast | null
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const byYear = analysis?.byYear ?? [];
  const latest = analysis?.latest;

  // 1. Deficit: current or projected ratio < 1
  const ratio = latest?.ratio ?? forecast?.projectedRatio ?? null;
  if (ratio !== null && ratio < 1) {
    alerts.push({
      id: `energy-${commodityName.replace(/\s+/g, "-").toLowerCase()}-deficit`,
      type: "danger",
      title: "Supply Deficit",
      message: `${commodityName}: Energy balance ratio (Supply / Consumption) is ${ratio.toFixed(2)}, below 1. Supply is insufficient relative to consumption.`,
    });
  }

  // 2. Declining trend: supply decreased over last 5 years
  const last5 = byYear.slice(-5);
  if (last5.length >= 2) {
    const firstSupply = last5[0].supply;
    const lastSupply = last5[last5.length - 1].supply;
    if (firstSupply > 0 && lastSupply < firstSupply) {
      const pctChange = ((lastSupply - firstSupply) / firstSupply) * 100;
      alerts.push({
        id: `energy-${commodityName.replace(/\s+/g, "-").toLowerCase()}-decline`,
        type: "warning",
        title: "Declining Supply Trend",
        message: `${commodityName}: Supply has declined by ${Math.abs(pctChange).toFixed(1)}% over the last ${last5.length} years. Monitor for continued pressure.`,
      });
    }
  }

  // 3. High volatility: YoY change in supply or ratio above threshold
  for (let i = 1; i < byYear.length; i++) {
    const prev = byYear[i - 1];
    const curr = byYear[i];
    if (prev.supply > 0) {
      const supplyChangePct = Math.abs((curr.supply - prev.supply) / prev.supply) * 100;
      if (supplyChangePct >= VOLATILITY_YOY_THRESHOLD_PCT) {
        alerts.push({
          id: `energy-${commodityName.replace(/\s+/g, "-").toLowerCase()}-volatility`,
          type: "warning",
          title: "High Volatility",
          message: `${commodityName}: Year-on-year supply change of ${supplyChangePct.toFixed(1)}% in ${curr.fiscalYear}. Consider reviewing reliability of supply.`,
        });
        break; // one volatility alert per commodity
      }
    }
  }

  return alerts;
}
