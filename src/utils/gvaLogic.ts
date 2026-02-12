import { toNumber } from "./numbers";
import { parseFiscalYearToStartYear } from "./dates";

interface GvaRawRow {
  year?: string;
  revision?: string;
  industry?: string;
  subindustry?: string;
  institutional_sector?: string;
  current_price?: unknown;
  constant_price?: unknown;
  unit?: string;
  [key: string]: unknown;
}

export interface GvaNormalizedRow {
  fiscalYear: string;
  year: number;
  revision?: string;
  industry?: string;
  subindustry?: string;
  institutionalSector?: string;
  currentPrice: number;
  constantPrice: number;
  unit?: string;
}

export function normalizeGvaRows(rows: GvaRawRow[]): GvaNormalizedRow[] {
  return rows
    .map((r) => ({
      fiscalYear: r.year || "",
      year: parseFiscalYearToStartYear(r.year),
      revision: r.revision,
      industry: r.industry,
      subindustry: r.subindustry,
      institutionalSector: r.institutional_sector,
      currentPrice: toNumber(r.current_price),
      constantPrice: toNumber(r.constant_price),
      unit: r.unit,
    }))
    .filter(
      (r) =>
        Number.isFinite(r.year) && Number.isFinite(r.currentPrice)
    )
    .sort((a, b) => a.year - b.year);
}

export function aggregateGvaByYear(rows: GvaNormalizedRow[]) {
  const byYear = new Map<
    number,
    {
      year: number;
      fiscalYear: string;
      totalCurrent: number;
      totalConstant: number;
    }
  >();
  rows.forEach((r) => {
    const key = r.year;
    const existing = byYear.get(key) || {
      year: key,
      fiscalYear: r.fiscalYear,
      totalCurrent: 0,
      totalConstant: 0,
    };
    existing.totalCurrent += r.currentPrice;
    existing.totalConstant += r.constantPrice ?? 0;
    byYear.set(key, existing);
  });
  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}
