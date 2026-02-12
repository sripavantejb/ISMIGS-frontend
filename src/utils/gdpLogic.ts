import { toNumber } from "./numbers";
import { parseFiscalYearToStartYear } from "./dates";

interface GdpRawRow {
  year?: string;
  revision?: string;
  current_price?: unknown;
  [key: string]: unknown;
}

export function normalizeOfficialGdpGrowth(rows: GdpRawRow[]) {
  return rows
    .map((r) => ({
      fiscalYear: r.year,
      year: parseFiscalYearToStartYear(r.year),
      officialGrowthPct: toNumber(r.current_price),
    }))
    .filter(
      (r) =>
        Number.isFinite(r.year) && Number.isFinite(r.officialGrowthPct)
    )
    .sort((a, b) => a.year - b.year);
}

interface GdpSeriesRow {
  fiscalYear: string;
  year: number;
  currentPrice: number;
}

export function computeManualGdpGrowth(gdpSeries: GdpSeriesRow[]) {
  const result: {
    fiscalYear: string;
    year: number;
    gdpLevel: number;
    manualGrowthPct: number;
  }[] = [];

  for (let i = 1; i < gdpSeries.length; i += 1) {
    const prev = gdpSeries[i - 1];
    const cur = gdpSeries[i];
    if (!prev.currentPrice || prev.currentPrice === 0) continue;
    const growthPct =
      ((cur.currentPrice - prev.currentPrice) / prev.currentPrice) * 100;
    result.push({
      fiscalYear: cur.fiscalYear,
      year: cur.year,
      gdpLevel: cur.currentPrice,
      manualGrowthPct: growthPct,
    });
  }

  return result;
}

interface ManualRow {
  year: number;
  fiscalYear: string;
  manualGrowthPct?: number;
}

interface OfficialRow {
  year: number;
  fiscalYear: string;
  officialGrowthPct: number;
}

export function mergeGdpGrowth(manual: ManualRow[], official: OfficialRow[]) {
  const byYear = new Map<number, ManualRow & { officialGrowthPct?: number }>();
  manual.forEach((m) => byYear.set(m.year, { ...m }));
  official.forEach((o) => {
    const entry =
      byYear.get(o.year) || ({
        year: o.year,
        fiscalYear: o.fiscalYear,
      } as ManualRow & { officialGrowthPct?: number });
    entry.officialGrowthPct = o.officialGrowthPct;
    byYear.set(o.year, entry);
  });
  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}
