import { CPIRecord, computeMovingAverage, computeVolatility } from "./cpiDataService";

export interface ForecastResult {
  state: string;
  forecastValues: { month: number; value: number; lower: number; upper: number }[];
  projectedGrowthRate: number;
  trendSlope: number;
  momentum: number;
  accelerationScore: number;
  confidenceLevel: number;
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function computeMomentum(values: number[], window = 6): number {
  if (values.length < window + 1) return 0;
  const recent = values.slice(-window);
  const older = values.slice(-(window * 2), -window);
  if (older.length === 0) return 0;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  if (olderAvg === 0) return 0;
  return +((recentAvg - olderAvg) / olderAvg * 100).toFixed(2);
}

function computeAcceleration(values: number[]): number {
  if (values.length < 6) return 0;
  const recent3 = values.slice(-3);
  const prev3 = values.slice(-6, -3);
  const recentGrowth = recent3.length >= 2
    ? (recent3[recent3.length - 1] - recent3[0]) / recent3[0] * 100
    : 0;
  const prevGrowth = prev3.length >= 2
    ? (prev3[prev3.length - 1] - prev3[0]) / prev3[0] * 100
    : 0;
  return +(recentGrowth - prevGrowth).toFixed(2);
}

export function forecastState(
  timeSeries: CPIRecord[],
  labourType: "AL" | "RL",
  horizonMonths = 12
): ForecastResult {
  const state = timeSeries[0]?.state || "Unknown";
  const values = timeSeries.map(r => labourType === "AL" ? r.indexAL : r.indexRL).filter(v => v > 0);
  
  if (values.length < 6) {
    return {
      state,
      forecastValues: [],
      projectedGrowthRate: 0,
      trendSlope: 0,
      momentum: 0,
      accelerationScore: 0,
      confidenceLevel: 0,
    };
  }

  // Use last 24 months for regression
  const window = Math.min(24, values.length);
  const recentValues = values.slice(-window);
  const { slope, intercept } = linearRegression(recentValues);
  
  // Moving average for smoothing
  const ma = computeMovingAverage(recentValues, 3);
  const lastMA = ma[ma.length - 1];
  
  // Seasonality: compute average monthly deviation
  const seasonal: number[] = new Array(12).fill(0);
  const seasonalCount: number[] = new Array(12).fill(0);
  for (let i = 0; i < timeSeries.length; i++) {
    const r = timeSeries[i];
    const val = labourType === "AL" ? r.indexAL : r.indexRL;
    if (val <= 0) continue;
    const mIdx = ["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(r.month);
    if (mIdx >= 0) {
      // Compute ratio to trend
      const trendVal = intercept + slope * (values.length - timeSeries.length + i);
      if (trendVal > 0) {
        seasonal[mIdx] += val / trendVal;
        seasonalCount[mIdx]++;
      }
    }
  }
  for (let i = 0; i < 12; i++) {
    seasonal[i] = seasonalCount[i] > 0 ? seasonal[i] / seasonalCount[i] : 1;
  }

  const volatility = computeVolatility(recentValues);
  const confidence = Math.max(30, Math.min(95, 90 - volatility * 5));
  const confidenceBand = Math.max(0.5, volatility * 0.3);

  const forecasts: ForecastResult["forecastValues"] = [];
  const n = recentValues.length;
  
  // Determine the last month index from data
  const lastRecord = timeSeries[timeSeries.length - 1];
  const lastMonthIdx = ["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(lastRecord.month);

  for (let i = 1; i <= horizonMonths; i++) {
    const trendValue = intercept + slope * (n + i);
    const futureMonthIdx = (lastMonthIdx + i) % 12;
    const seasonalFactor = seasonal[futureMonthIdx];
    const predicted = +(trendValue * seasonalFactor).toFixed(2);
    
    forecasts.push({
      month: i,
      value: predicted,
      lower: +(predicted * (1 - confidenceBand / 100)).toFixed(2),
      upper: +(predicted * (1 + confidenceBand / 100)).toFixed(2),
    });
  }

  const lastValue = values[values.length - 1];
  const projectedGrowth = forecasts.length > 0 && lastValue > 0
    ? +((forecasts[forecasts.length - 1].value - lastValue) / lastValue * 100).toFixed(2)
    : 0;

  return {
    state,
    forecastValues: forecasts,
    projectedGrowthRate: projectedGrowth,
    trendSlope: +slope.toFixed(4),
    momentum: computeMomentum(values),
    accelerationScore: computeAcceleration(values),
    confidenceLevel: +confidence.toFixed(0),
  };
}

export function forecastAllStates(
  records: CPIRecord[],
  states: string[],
  labourType: "AL" | "RL",
  horizonMonths = 12
): ForecastResult[] {
  return states.map(state => {
    const ts = records
      .filter(r => r.state === state)
      .sort((a, b) => {
        const ya = parseInt(a.year), yb = parseInt(b.year);
        if (ya !== yb) return ya - yb;
        const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
    return forecastState(ts, labourType, horizonMonths);
  });
}
