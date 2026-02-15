import { useQuery } from "@tanstack/react-query";
import {
  fetchLoanEstimatorConfig,
  DEFAULT_PER_ACRE_LIMIT_LAKHS,
  DEFAULT_BANKS_AND_RATES,
  type LoanEstimatorConfig,
} from "../services/loanEstimatorApi";

const STALE_TIME_MS = 1000 * 60 * 10; // 10 min

export function useLoanEstimatorConfig(): {
  perAcreLimitLakhs: number;
  banksAndRates: LoanEstimatorConfig["banksAndRates"];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["loan-estimator-config"],
    queryFn: fetchLoanEstimatorConfig,
    staleTime: STALE_TIME_MS,
    placeholderData: (prev) => prev,
  });

  const perAcreLimitLakhs = data?.perAcreLimitLakhs ?? DEFAULT_PER_ACRE_LIMIT_LAKHS;
  const banksAndRates =
    data?.banksAndRates && data.banksAndRates.length > 0 ? data.banksAndRates : DEFAULT_BANKS_AND_RATES;

  return {
    perAcreLimitLakhs,
    banksAndRates,
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch,
  };
}
