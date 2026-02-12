import { buildEnergyAnalysis } from "./energyLogic";
import { linearRegression } from "./regression";

interface SupplyRow {
  year: string;
  value?: unknown;
  [key: string]: unknown;
}

export function normalizeEnergyAnalysis(
  supplyRows: SupplyRow[],
  consRows: SupplyRow[]
) {
  return buildEnergyAnalysis(supplyRows, consRows);
}

const YEARS_WINDOW = 10;

function tailByYear<T extends { year: number }>(series: T[], n = YEARS_WINDOW): T[] {
  const sorted = [...series].sort((a, b) => a.year - b.year);
  return sorted.slice(-n);
}

export interface EnergyForecastResult {
  nextYear: number;
  projectedSupply: number | null;
  projectedConsumption: number | null;
  projectedRatio: number | null;
  status: "pressure" | "stable" | "surplus";
  history: { x: number; supply: number; consumption: number }[];
  forecastLine: { x: number; supply: number | null; consumption: number | null }[];
}

/**
 * Builds energy forecast from supply and consumption rows (e.g. filtered by commodity).
 * Same logic as useForecast's buildEnergyForecast, for use in EnergyAnalytics per-commodity view.
 */
export function buildEnergyForecastForRows(
  supplyRows: SupplyRow[],
  consRows: SupplyRow[]
): EnergyForecastResult | null {
  const analysis = buildEnergyAnalysis(supplyRows, consRows);
  const years = tailByYear(analysis.byYear, YEARS_WINDOW);
  if (!years.length) return null;

  const supPoints = years.map((r) => ({ x: r.year, y: r.supply }));
  const conPoints = years.map((r) => ({ x: r.year, y: r.consumption }));
  const supModel = linearRegression(supPoints);
  const conModel = linearRegression(conPoints);
  const lastYear = years[years.length - 1].year;
  const nextYear = lastYear + 1;
  const projectedSupply = supModel ? supModel.predict(nextYear) : null;
  const projectedConsumption = conModel ? conModel.predict(nextYear) : null;
  const projectedRatio =
    projectedSupply != null && projectedConsumption != null && projectedConsumption !== 0
      ? projectedSupply / projectedConsumption
      : null;
  const status: "pressure" | "stable" | "surplus" =
    projectedRatio != null && projectedRatio < 0.95
      ? "pressure"
      : projectedRatio != null && projectedRatio > 1.05
        ? "surplus"
        : "stable";

  const history = years.map((r) => ({ x: r.year, supply: r.supply, consumption: r.consumption }));
  const future: { x: number; supply: number | null; consumption: number | null }[] = [];
  for (let i = 1; i <= 10; i++) {
    const y = lastYear + i;
    future.push({
      x: y,
      supply: supModel ? supModel.predict(y) : null,
      consumption: conModel ? conModel.predict(y) : null,
    });
  }
  const forecastLine = [...history, ...future];

  return {
    nextYear,
    projectedSupply,
    projectedConsumption,
    projectedRatio,
    status,
    history,
    forecastLine,
  };
}
