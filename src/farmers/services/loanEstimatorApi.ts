/**
 * Loan estimator config from Supabase (real-time data). Uses VITE_SUPABASE_* API key.
 * Fallback constants used when fetch fails or table not yet migrated.
 */
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_PER_ACRE_LIMIT_LAKHS = 1.6;

export interface BankRateRow {
  bank: string;
  scheme: string;
  ratePct: number;
  notes?: string;
  processingFee?: string;
  applicationLink?: string;
}

export const DEFAULT_BANKS_AND_RATES: BankRateRow[] = [
  { bank: "SBI", scheme: "KCC (crop loan)", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.onlinesbi.sbi/sbicollect/icollecthome.htm", notes: "With interest subvention" },
  { bank: "SBI", scheme: "KCC (beyond subvention)", ratePct: 9.5, processingFee: "—", applicationLink: "https://www.onlinesbi.sbi/sbicollect/icollecthome.htm" },
  { bank: "HDFC Bank", scheme: "Kisan Credit Card", ratePct: 8.5, processingFee: "0.5%", applicationLink: "https://www.hdfcbank.com/personal/borrow/personal-loan/agriculture-loan" },
  { bank: "ICICI Bank", scheme: "KCC / Agri term", ratePct: 9, processingFee: "—", applicationLink: "https://www.icicibank.com/agriculture" },
  { bank: "Bank of Baroda", scheme: "KCC", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.bankofbaroda.in/agriculture-banking.htm" },
  { bank: "PNB", scheme: "KCC", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.pnbbank.in/agriculture.html" },
  { bank: "Canara Bank", scheme: "KCC", ratePct: 7, processingFee: "—", applicationLink: "https://canarabank.com/agriculture" },
  { bank: "Union Bank", scheme: "KCC", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.unionbankofindia.co.in/english/agriculture.aspx" },
  { bank: "NABARD (via banks)", scheme: "Refinance-backed crop loans", ratePct: 7, processingFee: "—", applicationLink: "https://www.nabard.org/" },
  { bank: "Regional Rural Banks", scheme: "KCC / short-term crop", ratePct: 7, processingFee: "—", applicationLink: "#" },
];

export interface LoanEstimatorConfig {
  perAcreLimitLakhs: number;
  banksAndRates: BankRateRow[];
}

function parseBankRow(row: unknown): BankRateRow | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const bank = typeof o.bank === "string" ? o.bank : "";
  const scheme = typeof o.scheme === "string" ? o.scheme : "";
  const ratePct = typeof o.ratePct === "number" ? o.ratePct : Number(o.ratePct);
  if (!bank || Number.isNaN(ratePct)) return null;
  return {
    bank,
    scheme,
    ratePct,
    notes: typeof o.notes === "string" ? o.notes : undefined,
    processingFee: typeof o.processingFee === "string" ? o.processingFee : undefined,
    applicationLink: typeof o.applicationLink === "string" ? o.applicationLink : undefined,
  };
}

/**
 * Fetches loan estimator config from Supabase. Uses existing Supabase publishable key.
 * Returns fallback config on error or empty table.
 */
export async function fetchLoanEstimatorConfig(): Promise<LoanEstimatorConfig> {
  try {
    const { data, error } = await supabase
      .from("loan_estimator_config")
      .select("per_acre_limit_lakhs, banks_and_rates")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return getFallbackConfig();

    const rawLimit = data.per_acre_limit_lakhs;
    const perAcreLimitLakhs = typeof rawLimit === "number" ? rawLimit : Number(rawLimit);
    const rawBanks = data.banks_and_rates;
    const banksAndRates: BankRateRow[] = Array.isArray(rawBanks)
      ? rawBanks.map(parseBankRow).filter((r): r is BankRateRow => r !== null)
      : [];

    return {
      perAcreLimitLakhs: Number.isFinite(perAcreLimitLakhs) && perAcreLimitLakhs > 0 ? perAcreLimitLakhs : DEFAULT_PER_ACRE_LIMIT_LAKHS,
      banksAndRates: banksAndRates.length > 0 ? banksAndRates : DEFAULT_BANKS_AND_RATES,
    };
  } catch {
    return getFallbackConfig();
  }
}

function getFallbackConfig(): LoanEstimatorConfig {
  return {
    perAcreLimitLakhs: DEFAULT_PER_ACRE_LIMIT_LAKHS,
    banksAndRates: DEFAULT_BANKS_AND_RATES,
  };
}
