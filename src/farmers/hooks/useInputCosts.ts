import { useState, useEffect, useCallback } from "react";
import { fetchInputPrices } from "../services/inputCostApi";
import type { PricePoint, CultivationCostInputs } from "../types";

export function useInputCosts() {
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchInputPrices();
      setPrices(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalCost = useCallback((inputs: CultivationCostInputs) => {
    const perAcre =
      inputs.seedCostPerAcre +
      inputs.fertilizerCostPerAcre +
      inputs.labourCostPerAcre +
      inputs.irrigationCostPerAcre +
      inputs.otherCostPerAcre;
    return { total: perAcre * inputs.areaAcres, perAcre };
  }, []);

  const riskScore = useCallback((): "low" | "medium" | "high" => {
    const upCount = prices.filter((p) => p.trend === "up").length;
    if (upCount >= 2) return "high";
    if (upCount >= 1) return "medium";
    return "low";
  }, [prices]);

  return { prices, loading, reload: load, totalCost, riskScore };
}
