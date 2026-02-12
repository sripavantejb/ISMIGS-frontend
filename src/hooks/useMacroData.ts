import { useQuery } from "@tanstack/react-query";
import {
  fetchSupplyKToE,
  fetchConsumptionKToE,
  fetchSupplyPetaJoules,
  fetchWPIData,
  fetchNASData,
  fetchGvaDetailed,
  fetchIIPAnnual,
  fetchIIPMonthly,
} from "@/services/macroApi";

export function useSupplyKToE() {
  return useQuery({
    queryKey: ["energy-supply-ktoe"],
    queryFn: fetchSupplyKToE,
    staleTime: 1000 * 60 * 30,
  });
}

export function useConsumptionKToE() {
  return useQuery({
    queryKey: ["energy-consumption-ktoe"],
    queryFn: fetchConsumptionKToE,
    staleTime: 1000 * 60 * 30,
  });
}

export function useSupplyPetaJoules() {
  return useQuery({
    queryKey: ["energy-supply-pj"],
    queryFn: fetchSupplyPetaJoules,
    staleTime: 1000 * 60 * 30,
  });
}

export function useGVADetailed() {
  return useQuery({
    queryKey: ["gva-detailed"],
    queryFn: fetchGvaDetailed,
    staleTime: 1000 * 60 * 30,
  });
}

export function useWPIData() {
  return useQuery({
    queryKey: ["wpi-data"],
    queryFn: fetchWPIData,
    staleTime: 1000 * 60 * 30,
  });
}

export function useNASData(indicatorCode: number = 1) {
  return useQuery({
    queryKey: ["nas-data", indicatorCode],
    queryFn: () => fetchNASData(indicatorCode),
    staleTime: 1000 * 60 * 30,
  });
}

export function useIIPAnnual() {
  return useQuery({
    queryKey: ["iip-annual"],
    queryFn: fetchIIPAnnual,
    staleTime: 1000 * 60 * 30,
  });
}

export function useIIPMonthly() {
  return useQuery({
    queryKey: ["iip-monthly"],
    queryFn: fetchIIPMonthly,
    staleTime: 1000 * 60 * 30,
  });
}
