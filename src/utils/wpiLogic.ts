import { toNumber } from "./numbers";

const FISCAL_MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

function monthOrder(name: string): number {
  const idx = FISCAL_MONTHS.indexOf(name);
  return idx === -1 ? 99 : idx;
}

interface WpiRawRow {
  year?: string | number;
  month?: string;
  majorgroup?: string;
  group?: string;
  subgroup?: string;
  sub_subgroup?: string;
  item?: string;
  index_value?: unknown;
  [key: string]: unknown;
}

export interface WpiNormalizedRow {
  year: number;
  month: string;
  monthOrder: number;
  periodLabel: string;
  majorgroup?: string;
  group?: string;
  subgroup?: string;
  subSubgroup?: string;
  item?: string;
  index: number;
}

export function normalizeWpiRows(rows: WpiRawRow[]): WpiNormalizedRow[] {
  return rows
    .map((r) => ({
      year: Number(r.year),
      month: r.month || "",
      monthOrder: monthOrder(r.month || ""),
      periodLabel: `${r.month} ${r.year}`,
      majorgroup: r.majorgroup,
      group: r.group,
      subgroup: r.subgroup,
      subSubgroup: r.sub_subgroup,
      item: r.item,
      index: toNumber(r.index_value),
    }))
    .filter(
      (r) =>
        Number.isFinite(r.year) &&
        Number.isFinite(r.index) &&
        r.monthOrder !== 99
    )
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthOrder - b.monthOrder;
    });
}

export function computeMonthlyInflation(
  series: WpiNormalizedRow[]
): (WpiNormalizedRow & { inflationPct: number })[] {
  const result: (WpiNormalizedRow & { inflationPct: number })[] = [];
  for (let i = 1; i < series.length; i += 1) {
    const prev = series[i - 1];
    const cur = series[i];
    if (!prev.index || prev.index === 0) continue;
    const growthPct = ((cur.index - prev.index) / prev.index) * 100;
    result.push({ ...cur, inflationPct: growthPct });
  }
  return result;
}

export function computeAverageAnnualInflation(
  series: { year: number; inflationPct: number }[]
): { year: number; avgInflationPct: number }[] {
  const byYear = new Map<number, { sum: number; count: number }>();
  series.forEach((row) => {
    if (!Number.isFinite(row.inflationPct)) return;
    const current = byYear.get(row.year) || { sum: 0, count: 0 };
    current.sum += row.inflationPct;
    current.count += 1;
    byYear.set(row.year, current);
  });

  return Array.from(byYear.entries())
    .map(([year, v]) => ({
      year,
      avgInflationPct: v.count ? v.sum / v.count : 0,
    }))
    .sort((a, b) => a.year - b.year);
}
