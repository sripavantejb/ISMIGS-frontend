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

interface IipRawRow {
  base_year?: string;
  year?: string | number;
  month?: string;
  type?: string;
  category?: string;
  sub_category?: string;
  index?: unknown;
  growth_rate?: unknown;
  [key: string]: unknown;
}

export interface IipNormalizedRow {
  baseYear?: string;
  year: number;
  month: string;
  monthOrder: number;
  periodLabel: string;
  type?: string;
  category?: string;
  subCategory?: string;
  index: number;
  growthRate: number;
}

export function normalizeIipMonthly(rows: IipRawRow[]): IipNormalizedRow[] {
  return rows
    .map((r) => ({
      baseYear: r.base_year,
      year: Number(r.year),
      month: r.month || "",
      monthOrder: monthOrder(r.month || ""),
      periodLabel: `${r.month} ${r.year}`,
      type: r.type,
      category: r.category,
      subCategory: r.sub_category,
      index: toNumber(r.index ?? r.index_value),
      growthRate: toNumber(r.growth_rate),
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

export function detectThreeNegativeGrowth(
  monthlySeries: { growthRate: number }[]
): boolean {
  let streak = 0;
  for (let i = 0; i < monthlySeries.length; i += 1) {
    if (monthlySeries[i].growthRate < 0) {
      streak += 1;
      if (streak >= 3) return true;
    } else {
      streak = 0;
    }
  }
  return false;
}
