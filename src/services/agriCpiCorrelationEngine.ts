import { CPIRecord, getStateTimeSeries, computeVolatility } from "./cpiDataService";

export interface CorrelationResult {
  state: string;
  alRlCorrelation: number;
  alRlLagMonths: number;
  stressIndex: number;
  inflationAcceleration: number;
  rollingVariance: number;
  stabilityScore: number;
  cagr: number;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);
  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : +(num / den).toFixed(4);
}

function findOptimalLag(x: number[], y: number[], maxLag = 6): { lag: number; correlation: number } {
  let bestLag = 0;
  let bestCorr = Math.abs(pearsonCorrelation(x, y));
  for (let lag = 1; lag <= maxLag; lag++) {
    const corr = Math.abs(pearsonCorrelation(x.slice(lag), y.slice(0, -lag)));
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  return { lag: bestLag, correlation: bestCorr };
}

function computeCAGR(values: number[], periodsPerYear = 12): number {
  if (values.length < periodsPerYear) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  if (first <= 0 || last <= 0) return 0;
  const years = values.length / periodsPerYear;
  return +((Math.pow(last / first, 1 / years) - 1) * 100).toFixed(2);
}

function computeRollingVariance(values: number[], window = 12): number {
  if (values.length < window) return 0;
  const recent = values.slice(-window);
  const changes: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    if (recent[i - 1] > 0) {
      changes.push((recent[i] - recent[i - 1]) / recent[i - 1] * 100);
    }
  }
  if (changes.length === 0) return 0;
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  return +(changes.reduce((a, b) => a + (b - mean) ** 2, 0) / changes.length).toFixed(2);
}

function computeInflationAcceleration(values: number[]): number {
  if (values.length < 12) return 0;
  const recent6 = values.slice(-6);
  const prev6 = values.slice(-12, -6);
  const recentAvgChange = recent6.length > 1
    ? (recent6[recent6.length - 1] - recent6[0]) / recent6[0] * 100
    : 0;
  const prevAvgChange = prev6.length > 1
    ? (prev6[prev6.length - 1] - prev6[0]) / prev6[0] * 100
    : 0;
  return +(recentAvgChange - prevAvgChange).toFixed(2);
}

export function computeStateCorrelation(
  records: CPIRecord[],
  state: string
): CorrelationResult {
  const ts = getStateTimeSeries(records, state);
  const alValues = ts.map(r => r.indexAL).filter(v => v > 0);
  const rlValues = ts.map(r => r.indexRL).filter(v => v > 0);

  const { lag, correlation } = findOptimalLag(alValues, rlValues);
  const volatilityAL = computeVolatility(alValues.slice(-24));
  const cagr = computeCAGR(alValues);
  const rollingVar = computeRollingVariance(alValues);
  const inflAccel = computeInflationAcceleration(alValues);

  // Stress index: combines inflation acceleration with volatility
  const stressIndex = +(Math.abs(inflAccel) * 0.4 + volatilityAL * 0.3 + rollingVar * 0.3).toFixed(2);
  
  // Stability score: inverse of volatility, 0-100
  const stabilityScore = +Math.max(0, Math.min(100, 100 - volatilityAL * 10)).toFixed(0);

  return {
    state,
    alRlCorrelation: correlation,
    alRlLagMonths: lag,
    stressIndex,
    inflationAcceleration: inflAccel,
    rollingVariance: rollingVar,
    stabilityScore,
    cagr,
  };
}

export function computeAllCorrelations(
  records: CPIRecord[],
  states: string[]
): CorrelationResult[] {
  return states
    .filter(s => s !== "All India")
    .map(s => computeStateCorrelation(records, s))
    .sort((a, b) => b.stressIndex - a.stressIndex);
}
