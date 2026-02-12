export function parseFiscalYearToStartYear(yearStr: string | undefined | null): number {
  if (!yearStr) return NaN;
  const match = /^(\d{4})/.exec(String(yearStr));
  return match ? Number(match[1]) : NaN;
}
