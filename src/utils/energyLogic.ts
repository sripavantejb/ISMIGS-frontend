import { toNumber } from "./numbers";
import { parseFiscalYearToStartYear } from "./dates";

interface SupplyRow {
  year: string;
  value?: unknown;
  [key: string]: unknown;
}

export function buildEnergyAnalysis(supplyRows: SupplyRow[], consRows: SupplyRow[]) {
  const byYear = new Map<
    number,
    { year: number; fiscalYear: string; supply: number; consumption: number }
  >();

  supplyRows.forEach((r) => {
    const year = parseFiscalYearToStartYear(r.year);
    const value = toNumber(r.value);
    if (!Number.isFinite(year) || !Number.isFinite(value)) return;
    const entry =
      byYear.get(year) || {
        year,
        fiscalYear: r.year,
        supply: 0,
        consumption: 0,
      };
    entry.supply += value;
    byYear.set(year, entry);
  });

  consRows.forEach((r) => {
    const year = parseFiscalYearToStartYear(r.year);
    const value = toNumber(r.value);
    if (!Number.isFinite(year) || !Number.isFinite(value)) return;
    const entry =
      byYear.get(year) || {
        year,
        fiscalYear: r.year,
        supply: 0,
        consumption: 0,
      };
    entry.consumption += value;
    byYear.set(year, entry);
  });

  const years = Array.from(byYear.values())
    .map((row) => ({
      ...row,
      ratio: row.consumption === 0 ? null : row.supply / row.consumption,
    }))
    .sort((a, b) => a.year - b.year);

  const latest = years[years.length - 1] || null;
  const deficit = latest && latest.ratio !== null && latest.ratio < 1;
  const last5Years = years.slice(-5);

  return {
    byYear: years,
    latest,
    last5Years,
    hasEnergyDeficit: deficit,
  };
}
