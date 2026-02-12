import { CPIRecord, getStateTimeSeries, computeVolatility } from "./cpiDataService";
import { ForecastResult } from "./cpiForecastEngine";

export interface CPIAlert {
  state: string;
  type: string;
  severity: "Yellow" | "Red";
  message: string;
  value: number;
}

export function generateAlerts(
  records: CPIRecord[],
  states: string[],
  labourType: "AL" | "RL",
  forecasts?: ForecastResult[]
): CPIAlert[] {
  const alerts: CPIAlert[] = [];

  for (const state of states) {
    if (state === "All India") continue;
    const ts = getStateTimeSeries(records, state);
    if (ts.length < 3) continue;

    const latest = ts[ts.length - 1];
    const inflation = labourType === "AL" ? latest.inflationAL : latest.inflationRL;

    // CPI growth > 8% YoY
    if (inflation !== null && inflation > 8) {
      alerts.push({
        state,
        type: "High CPI Growth",
        severity: "Red",
        message: `CPI ${labourType} inflation at ${inflation.toFixed(1)}% YoY — exceeds 8% threshold`,
        value: inflation,
      });
    } else if (inflation !== null && inflation > 5) {
      alerts.push({
        state,
        type: "Elevated CPI Growth",
        severity: "Yellow",
        message: `CPI ${labourType} inflation at ${inflation.toFixed(1)}% YoY — elevated`,
        value: inflation,
      });
    }

    // CPI decline > 5%
    if (inflation !== null && inflation < -5) {
      alerts.push({
        state,
        type: "Sharp CPI Decline",
        severity: "Red",
        message: `CPI ${labourType} deflation at ${inflation.toFixed(1)}% — sharp decline detected`,
        value: inflation,
      });
    }

    // 3 consecutive months increase
    if (ts.length >= 3) {
      const last3 = ts.slice(-3);
      const vals = last3.map(r => labourType === "AL" ? r.indexAL : r.indexRL);
      if (vals[0] > 0 && vals[1] > vals[0] && vals[2] > vals[1]) {
        const totalIncrease = ((vals[2] - vals[0]) / vals[0] * 100);
        if (totalIncrease > 3) {
          alerts.push({
            state,
            type: "Sustained Increase",
            severity: totalIncrease > 5 ? "Red" : "Yellow",
            message: `3 consecutive monthly increases — total ${totalIncrease.toFixed(1)}% rise`,
            value: totalIncrease,
          });
        }
      }
    }

    // Forecast spike > 10%
    if (forecasts) {
      const fc = forecasts.find(f => f.state === state);
      if (fc && fc.projectedGrowthRate > 10) {
        alerts.push({
          state,
          type: "Forecast Spike",
          severity: "Red",
          message: `Forecast projects ${fc.projectedGrowthRate.toFixed(1)}% growth over next 12 months`,
          value: fc.projectedGrowthRate,
        });
      }
    }
  }

  // Sort by severity (Red first) then value
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "Red" ? -1 : 1;
    return Math.abs(b.value) - Math.abs(a.value);
  });
}
