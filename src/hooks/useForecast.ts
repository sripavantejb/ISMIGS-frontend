import { useEffect, useState } from "react";
import {
  fetchSupplyKToE,
  fetchConsumptionKToE,
  fetchNASData,
  fetchWPIData,
  fetchIIPMonthly,
} from "@/services/macroApi";
import { normalizeOfficialGdpGrowth, computeManualGdpGrowth, mergeGdpGrowth } from "@/utils/gdpLogic";
import { normalizeEnergyAnalysis } from "@/utils/forecastEnergy";
import { normalizeIipMonthly } from "@/utils/iipLogic";
import { normalizeWpiRows, computeAverageAnnualInflation } from "@/utils/wpiLogic";
import { linearRegression } from "@/utils/regression";
import { toNumber } from "@/utils/numbers";
import { parseFiscalYearToStartYear } from "@/utils/dates";

const YEARS_WINDOW = 10;

function tailByYear<T extends { year: number }>(series: T[], n = YEARS_WINDOW): T[] {
  const sorted = [...series].sort((a, b) => a.year - b.year);
  return sorted.slice(-n);
}

function buildEnergyForecast(supplyRows: any[], consRows: any[]) {
  const analysis = normalizeEnergyAnalysis(supplyRows, consRows);
  const years = tailByYear(analysis.byYear, 10);
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
    projectedSupply && projectedConsumption
      ? projectedSupply / projectedConsumption
      : null;
  const status =
    projectedRatio && projectedRatio < 0.95
      ? "pressure"
      : projectedRatio && projectedRatio > 1.05
      ? "surplus"
      : "stable";
  const history = years.map((r) => ({ x: r.year, supply: r.supply, consumption: r.consumption }));
  const future = [];
  for (let i = 1; i <= 5; i++) {
    const y = lastYear + i;
    future.push({
      x: y,
      supply: supModel ? supModel.predict(y) : null,
      consumption: conModel ? conModel.predict(y) : null,
    });
  }
  const forecastLine = [...history, ...future];
  return { nextYear, projectedSupply, projectedConsumption, projectedRatio, status, history, forecastLine };
}

function buildGdpForecast(gdpRaw: any[], gdpGrowthRaw: any[]) {
  if (!gdpRaw || !gdpRaw.length) return null;
  const gdpSeries = gdpRaw
    .map((r) => ({
      fiscalYear: r.year,
      year: parseFiscalYearToStartYear(r.year),
      revision: r.revision,
      currentPrice: toNumber(r.current_price),
      constantPrice: toNumber(r.constant_price),
    }))
    .filter((r) => Number.isFinite(r.year) && Number.isFinite(r.constantPrice));
  const latestPerYear = tailByYear(
    Object.values(
      gdpSeries.reduce((acc: Record<number, any>, row) => {
        const existing = acc[row.year];
        if (!existing || (row.revision || "") > (existing.revision || "")) {
          acc[row.year] = row;
        }
        return acc;
      }, {})
    ),
    10
  );
  if (!latestPerYear.length) return null;
  const points = latestPerYear.map((r) => ({ x: r.year, y: r.constantPrice }));
  const model = linearRegression(points);
  const lastYear = latestPerYear[latestPerYear.length - 1].year;
  const nextYear = lastYear + 1;
  const projectedConstant = model ? model.predict(nextYear) : null;
  const officialGrowth = normalizeOfficialGdpGrowth(gdpGrowthRaw || []);
  const manualGrowth = computeManualGdpGrowth(latestPerYear.map((r) => ({ ...r, currentPrice: r.currentPrice ?? r.constantPrice })));
  const mergedGrowth = mergeGdpGrowth(manualGrowth, officialGrowth);
  const latestGrowth = mergedGrowth.length > 0 ? mergedGrowth[mergedGrowth.length - 1].manualGrowthPct : null;
  const status = latestGrowth != null && latestGrowth < 4 ? "pressure" : "stable";
  const history = latestPerYear.map((r) => ({ x: r.fiscalYear, constantPrice: r.constantPrice }));
  const future = [];
  for (let i = 1; i <= 5; i++) {
    const y = lastYear + i;
    future.push({
      x: `${y}-${String((y + 1) % 100).padStart(2, "0")}`,
      constantPrice: model ? model.predict(y) : null,
    });
  }
  return { nextYear, projectedConstant, latestGrowth, status, history, forecastLine: [...history, ...future], growthSeries: mergedGrowth };
}

function buildGfcfForecast(gfcfRaw: any[]) {
  if (!gfcfRaw || !gfcfRaw.length) return null;
  const series = gfcfRaw
    .map((r) => ({
      fiscalYear: r.year,
      year: parseFiscalYearToStartYear(r.year),
      currentPrice: toNumber(r.current_price),
      constantPrice: toNumber(r.constant_price),
    }))
    .filter((r) => Number.isFinite(r.year) && Number.isFinite(r.constantPrice));
  const tail = tailByYear(series, 10);
  if (!tail.length) return null;
  const points = tail.map((r) => ({ x: r.year, y: r.constantPrice }));
  const model = linearRegression(points);
  const lastYear = tail[tail.length - 1].year;
  const nextYear = lastYear + 1;
  const projectedConstant = model ? model.predict(nextYear) : null;
  const history = tail.map((r) => ({ x: r.fiscalYear, constantPrice: r.constantPrice }));
  const future = [];
  for (let i = 1; i <= 5; i++) {
    const y = lastYear + i;
    future.push({
      x: `${y}-${String((y + 1) % 100).padStart(2, "0")}`,
      constantPrice: model ? model.predict(y) : null,
    });
  }
  return { nextYear, projectedConstant, history, forecastLine: [...history, ...future] };
}

function buildWpiForecast(wpiRaw: any[]) {
  if (!wpiRaw || !wpiRaw.length) return null;
  const normalized = normalizeWpiRows(wpiRaw);
  const monthlyInflation: any[] = [];
  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1];
    const cur = normalized[i];
    if (!prev.index || prev.index === 0) continue;
    const inflationPct = ((cur.index - prev.index) / prev.index) * 100;
    monthlyInflation.push({ ...cur, inflationPct });
  }
  const annual = computeAverageAnnualInflation(monthlyInflation);
  const tail = tailByYear(annual.map((r) => ({ ...r, year: r.year })), 10);
  if (!tail.length) return null;
  const points = tail.map((r) => ({ x: r.year, y: (r as any).avgInflationPct }));
  const model = linearRegression(points);
  const lastYear = tail[tail.length - 1].year;
  const nextYear = lastYear + 1;
  const lastAvg = (tail[tail.length - 1] as any).avgInflationPct;
  const projectedInflation = model ? model.predict(nextYear) : lastAvg;
  const status = projectedInflation != null && projectedInflation > 6 ? "pressure" : "stable";
  const history = tail.map((r) => ({ x: r.year, avgInflationPct: (r as any).avgInflationPct }));
  const future = [];
  for (let i = 1; i <= 5; i++) {
    const y = lastYear + i;
    future.push({ x: y, avgInflationPct: model ? model.predict(y) : lastAvg });
  }
  return { nextYear, projectedInflation, status, history, forecastLine: [...history, ...future] };
}

function buildIipForecast(iipMonthlyRaw: any[]) {
  if (!iipMonthlyRaw || !iipMonthlyRaw.length) {
    return {
      nextMonths: [],
      history: [],
      forecastLine: [],
      currentIndex: null,
      projectedIndex: null,
      projectedGrowth: null,
      avgMonthlyGrowth: null,
    };
  }
  const normalized = normalizeIipMonthly(iipMonthlyRaw).filter(
    (r) => r.type === "General" && r.category === "General"
  );
  if (!normalized.length) {
    return {
      nextMonths: [],
      history: [],
      forecastLine: [],
      currentIndex: null,
      projectedIndex: null,
      projectedGrowth: null,
      avgMonthlyGrowth: null,
    };
  }
  const tail = normalized.slice(-60);
  const buildFlatForecast = (series: typeof normalized) => {
    const history = series.map((r) => ({ periodLabel: r.periodLabel, index: r.index }));
    const currentIndex = history.length > 0 ? history[history.length - 1].index : null;
    const forecast = [];
    for (let i = 1; i <= 6; i++) {
      forecast.push({ t: history.length + i, index: currentIndex, periodLabel: `M+${i}` });
    }
    return {
      nextMonths: forecast,
      history,
      forecastLine: [
        ...history,
        ...forecast.map((f) => ({ periodLabel: f.periodLabel, index: f.index })),
      ],
      currentIndex,
      projectedIndex: currentIndex,
      projectedGrowth: 0,
      avgMonthlyGrowth: 0,
    };
  };
  if (tail.length < 2) return buildFlatForecast(tail);
  const points = tail.map((r, idx) => ({ x: idx + 1, y: r.index }));
  const model = linearRegression(points);
  if (!model) return buildFlatForecast(tail);
  const lastT = points[points.length - 1].x;
  const history = tail.map((r) => ({ periodLabel: r.periodLabel, index: r.index }));
  const forecast = [];
  for (let i = 1; i <= 6; i++) {
    const t = lastT + i;
    const predicted = model.predict(t);
    if (predicted != null && Number.isFinite(predicted)) {
      forecast.push({ t, index: predicted, periodLabel: `M+${i}` });
    }
  }
  const currentIndex = history.length > 0 ? history[history.length - 1].index : null;
  const projectedIndex = forecast.length > 0 ? forecast[forecast.length - 1].index : null;
  const projectedGrowth =
    currentIndex && projectedIndex && currentIndex > 0
      ? ((projectedIndex - currentIndex) / currentIndex) * 100
      : null;
  const monthlyGrowthRates: number[] = [];
  for (let i = 1; i < forecast.length; i++) {
    const prev = forecast[i - 1].index;
    const curr = forecast[i].index;
    if (prev && curr && prev > 0) monthlyGrowthRates.push(((curr - prev) / prev) * 100);
  }
  const avgMonthlyGrowth =
    monthlyGrowthRates.length > 0
      ? monthlyGrowthRates.reduce((sum, rate) => sum + rate, 0) / monthlyGrowthRates.length
      : null;
  return {
    nextMonths: forecast,
    history,
    forecastLine: [
      ...history.map((h) => ({ periodLabel: h.periodLabel, index: h.index })),
      ...forecast.map((f) => ({ periodLabel: f.periodLabel, index: f.index })),
    ],
    currentIndex,
    projectedIndex,
    projectedGrowth,
    avgMonthlyGrowth,
  };
}

export interface ForecastState {
  loading: boolean;
  error: string | null;
  energy: ReturnType<typeof buildEnergyForecast>;
  gdp: ReturnType<typeof buildGdpForecast>;
  wpi: ReturnType<typeof buildWpiForecast>;
  iip: ReturnType<typeof buildIipForecast>;
  gfcf: ReturnType<typeof buildGfcfForecast>;
}

export function useForecast(): ForecastState {
  const [state, setState] = useState<ForecastState>({
    loading: true,
    error: null,
    energy: null,
    gdp: null,
    wpi: null,
    iip: null,
    gfcf: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        const [supplyKToe, consKToe, gdpRaw, gdpGrowthRaw, gfcfRaw, wpiRaw, iipMonthlyRaw] =
          await Promise.all([
            fetchSupplyKToE(),
            fetchConsumptionKToE(),
            fetchNASData(5),
            fetchNASData(22),
            fetchNASData(9),
            fetchWPIData(),
            fetchIIPMonthly(),
          ]);
        if (cancelled) return;
        const energy = buildEnergyForecast(supplyKToe || [], consKToe || []);
        const gdp = buildGdpForecast(gdpRaw || [], gdpGrowthRaw || []);
        const gfcf = buildGfcfForecast(gfcfRaw || []);
        const wpi = buildWpiForecast(wpiRaw || []);
        const iip = buildIipForecast(iipMonthlyRaw || []);
        setState({
          loading: false,
          error: null,
          energy,
          gdp,
          gfcf,
          wpi,
          iip,
        });
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: (e as Error)?.message || "Failed to load forecast data",
        }));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
