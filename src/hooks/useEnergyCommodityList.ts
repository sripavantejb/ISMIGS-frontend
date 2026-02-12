import { useMemo } from "react";
import { useSupplyKToE, useConsumptionKToE } from "./useMacroData";

interface EnergyRecord {
  energy_commodities?: string;
  [key: string]: unknown;
}

/**
 * Returns sorted list of energy commodity names from supply and consumption data.
 * Used by the sidebar to render Energy Analytics sub-items.
 */
export function useEnergyCommodityList(): string[] {
  const { data: supplyKToe } = useSupplyKToE();
  const { data: consumptionKToe } = useConsumptionKToE();

  return useMemo(() => {
    const supplyRows = (supplyKToe || []) as EnergyRecord[];
    const consRows = (consumptionKToe || []) as EnergyRecord[];
    const set = new Set<string>();
    supplyRows.forEach((r) => r.energy_commodities && set.add(r.energy_commodities));
    consRows.forEach((r) => r.energy_commodities && set.add(r.energy_commodities));
    return Array.from(set).sort();
  }, [supplyKToe, consumptionKToe]);
}
