import { useQuery } from "@tanstack/react-query";
import {
  fetchSupplyData,
  fetchConsumptionData,
  aggregateSupply,
  aggregateConsumption,
} from "@/services/energyApi";

export function useSupplyData() {
  return useQuery({
    queryKey: ["energy-supply"],
    queryFn: fetchSupplyData,
    staleTime: 1000 * 60 * 30, // 30 min cache
    select: aggregateSupply,
  });
}

export function useConsumptionData() {
  return useQuery({
    queryKey: ["energy-consumption"],
    queryFn: fetchConsumptionData,
    staleTime: 1000 * 60 * 30,
    select: aggregateConsumption,
  });
}
