import { useQuery } from "@tanstack/react-query";
import { parseCSV, CPIRecord, filterByBaseYear, getLatestPeriod, getUniqueYears, getUniqueStates } from "@/services/cpiDataService";

async function fetchCPIData(): Promise<CPIRecord[]> {
  const response = await fetch("/data/cpialrl_11.csv");
  const text = await response.text();
  return parseCSV(text);
}

export function useCPIData() {
  return useQuery({
    queryKey: ["cpi-alrl-data"],
    queryFn: fetchCPIData,
    staleTime: Infinity,
  });
}

export function useCPIBase2019() {
  const { data: allData, ...rest } = useCPIData();
  const base2019 = allData ? filterByBaseYear(allData, "2019") : undefined;
  return { data: base2019, allData, ...rest };
}
