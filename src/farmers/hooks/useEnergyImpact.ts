import { useState, useMemo } from "react";
import type { EnergyRiskLevel } from "../types";

export function useEnergyImpact(irrigationType: "diesel" | "electric" | "solar", dieselTrend: "up" | "stable" | "down", electricityTrend: "up" | "stable" | "down") {
  const [dieselPct, setDieselPct] = useState(0);
  const [electricityPct, setElectricityPct] = useState(0);

  const { score, level } = useMemo(() => {
    let base = 5;
    if (irrigationType === "diesel") base += dieselTrend === "up" ? 2 : dieselTrend === "stable" ? 0 : -1;
    if (irrigationType === "electric") base += electricityTrend === "up" ? 2 : electricityTrend === "stable" ? 0 : -1;
    if (irrigationType === "solar") base -= 2;
    const score = Math.max(1, Math.min(10, Math.round(base)));
    const level: EnergyRiskLevel = score >= 7 ? "high" : score >= 4 ? "medium" : "low";
    return { score, level };
  }, [irrigationType, dieselTrend, electricityTrend]);

  const impactText = useMemo(() => {
    if (dieselPct === 0 && electricityPct === 0) return null;
    return `If diesel ${dieselPct >= 0 ? "+" : ""}${dieselPct}% and electricity ${electricityPct >= 0 ? "+" : ""}${electricityPct}%, irrigation and input costs will shift accordingly. Check Input Costs and Profitability pages.`;
  }, [dieselPct, electricityPct]);

  return { score, level, dieselPct, setDieselPct, electricityPct, setElectricityPct, impactText };
}
