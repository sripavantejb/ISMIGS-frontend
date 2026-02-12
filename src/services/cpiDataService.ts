export interface CPIRecord {
  indicator: string;
  baseYear: string;
  year: string;
  month: string;
  state: string;
  indexAL: number;
  indexRL: number;
  inflationAL: number | null;
  inflationRL: number | null;
}

export interface StateAggregated {
  state: string;
  latestIndexAL: number;
  latestIndexRL: number;
  latestInflationAL: number | null;
  latestInflationRL: number | null;
  yoyChangeAL: number | null;
  yoyChangeRL: number | null;
  trendDirection: "up" | "down" | "stable";
  historicalData: CPIRecord[];
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
}

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function monthIndex(m: string): number {
  return MONTH_ORDER.indexOf(m);
}

export function parseCSV(csvText: string): CPIRecord[] {
  const lines = csvText.trim().split("\n");
  const records: CPIRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 9) continue;
    const indexAL = parseFloat(parts[5]) || 0;
    const indexRL = parseFloat(parts[6]) || 0;
    const inflAL = parts[7] ? parseFloat(parts[7]) : null;
    const inflRL = parts[8] ? parseFloat(parts[8]) : null;
    records.push({
      indicator: parts[0].trim(),
      baseYear: parts[1].trim(),
      year: parts[2].trim(),
      month: parts[3].trim(),
      state: parts[4].trim(),
      indexAL,
      indexRL,
      inflationAL: isNaN(inflAL as number) ? null : inflAL,
      inflationRL: isNaN(inflRL as number) ? null : inflRL,
    });
  }
  return records;
}

export function getUniqueYears(records: CPIRecord[]): string[] {
  const years = [...new Set(records.map(r => r.year))];
  return years.sort((a, b) => {
    const ya = parseInt(a);
    const yb = parseInt(b);
    return yb - ya;
  });
}

export function getUniqueMonths(records: CPIRecord[], year: string): string[] {
  const months = [...new Set(records.filter(r => r.year === year).map(r => r.month))];
  return months.sort((a, b) => monthIndex(a) - monthIndex(b));
}

export function getUniqueStates(records: CPIRecord[]): string[] {
  return [...new Set(records.map(r => r.state))].filter(s => s !== "All India").sort();
}

export function getLatestPeriod(records: CPIRecord[]): { year: string; month: string } {
  if (records.length === 0) return { year: "", month: "" };
  
  // Prefer base 2019 data if available, otherwise use all records
  const base2019 = records.filter(r => r.baseYear === "2019");
  const source = base2019.length > 0 ? base2019 : records;
  
  let latestYear = "";
  let latestMonthIdx = -1;
  let latestMonth = "";
  
  for (const r of source) {
    const yr = parseInt(r.year);
    const mi = monthIndex(r.month);
    const currentYr = parseInt(latestYear || "0");
    if (yr > currentYr || (yr === currentYr && mi > latestMonthIdx)) {
      latestYear = r.year;
      latestMonth = r.month;
      latestMonthIdx = mi;
    }
  }
  return { year: latestYear, month: latestMonth };
}

export function filterByBaseYear(records: CPIRecord[], baseYear: string): CPIRecord[] {
  return records.filter(r => r.baseYear === baseYear);
}

export function getStateDataForPeriod(
  records: CPIRecord[],
  year: string,
  month: string,
  labourType: "AL" | "RL" = "AL"
): Map<string, { index: number; inflation: number | null }> {
  const map = new Map<string, { index: number; inflation: number | null }>();
  for (const r of records) {
    if (r.year === year && r.month === month) {
      map.set(r.state, {
        index: labourType === "AL" ? r.indexAL : r.indexRL,
        inflation: labourType === "AL" ? r.inflationAL : r.inflationRL,
      });
    }
  }
  return map;
}

export function getStateTimeSeries(records: CPIRecord[], state: string): CPIRecord[] {
  return records
    .filter(r => r.state === state)
    .sort((a, b) => {
      const ya = parseInt(a.year);
      const yb = parseInt(b.year);
      if (ya !== yb) return ya - yb;
      return monthIndex(a.month) - monthIndex(b.month);
    });
}

export function computeYoY(timeSeries: CPIRecord[], labourType: "AL" | "RL"): number | null {
  if (timeSeries.length < 13) return null;
  const latest = timeSeries[timeSeries.length - 1];
  const latestMonth = latest.month;
  const latestYear = parseInt(latest.year);
  
  const prev = timeSeries.find(r => parseInt(r.year) === latestYear - 1 && r.month === latestMonth);
  if (!prev) return null;
  
  const currentVal = labourType === "AL" ? latest.indexAL : latest.indexRL;
  const prevVal = labourType === "AL" ? prev.indexAL : prev.indexRL;
  if (prevVal === 0) return null;
  return +((currentVal - prevVal) / prevVal * 100).toFixed(2);
}

export function computeMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(values[i]);
    } else {
      const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(+(sum / window).toFixed(2));
    }
  }
  return result;
}

export function computeVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      changes.push((values[i] - values[i - 1]) / values[i - 1] * 100);
    }
  }
  if (changes.length === 0) return 0;
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((a, b) => a + (b - mean) ** 2, 0) / changes.length;
  return +Math.sqrt(variance).toFixed(2);
}

export function getCPIMapColor(index: number, baseYear: string): string {
  if (baseYear === "2019") {
    if (index >= 145) return "#ef4444";
    if (index >= 140) return "#f97316";
    if (index >= 135) return "#facc15";
    if (index >= 130) return "#4ade80";
    return "#22c55e";
  }
  // For 1986-87 base (much higher values)
  if (index >= 1400) return "#ef4444";
  if (index >= 1300) return "#f97316";
  if (index >= 1200) return "#facc15";
  if (index >= 1100) return "#4ade80";
  return "#22c55e";
}

export function getRiskLevelFromInflation(inflation: number | null): "Low" | "Moderate" | "High" | "Critical" {
  if (inflation === null) return "Moderate";
  const abs = Math.abs(inflation);
  if (abs >= 8) return "Critical";
  if (abs >= 5) return "High";
  if (abs >= 3) return "Moderate";
  return "Low";
}

// Alias map for GeoJSON state names → CSV state names
export const GEO_TO_CSV_STATE: Record<string, string> = {
  "nct of delhi": "Delhi",
  "delhi": "Delhi",
  "jammu & kashmir": "Jammu & Kashmir",
  "jammu and kashmir": "Jammu & Kashmir",
  "orissa": "Odisha",
  "odisha": "Odisha",
  "uttaranchal": "Uttarakhand",
  "uttarakhand": "Uttarakhand",
  "andaman and nicobar islands": "Andaman & N.Islands",
  "andaman and nicobar": "Andaman & N.Islands",
  "andaman & n.islands": "Andaman & N.Islands",
  "puducherry": "Puducherry",
  "pondicherry": "Puducherry",
  "dadra and nagar haveli and daman and diu": "Dadra & Nagar Haveli and Daman & Diu",
  "dadra and nagar haveli": "Dadra & Nagar Haveli and Daman & Diu",
  "daman and diu": "Dadra & Nagar Haveli and Daman & Diu",
  "lakshadweep": "Lakshadweep",
  "chandigarh": "Chandigarh",
  "ladakh": "Jammu & Kashmir",
  "telangana": "Telangana",
  "chhattisgarh": "Chhattisgarh",
  "jharkhand": "Jharkhand",
  "andhra pradesh": "Andhra Pradesh",
  "arunachal pradesh": "Arunachal Pradesh",
  "assam": "Assam",
  "bihar": "Bihar",
  "goa": "Goa",
  "gujarat": "Gujarat",
  "haryana": "Haryana",
  "himachal pradesh": "Himachal Pradesh",
  "karnataka": "Karnataka",
  "kerala": "Kerala",
  "madhya pradesh": "Madhya Pradesh",
  "maharashtra": "Maharashtra",
  "manipur": "Manipur",
  "meghalaya": "Meghalaya",
  "mizoram": "Mizoram",
  "nagaland": "Nagaland",
  "punjab": "Punjab",
  "rajasthan": "Rajasthan",
  "sikkim": "Sikkim",
  "tamil nadu": "Tamil Nadu",
  "tripura": "Tripura",
  "uttar pradesh": "Uttar Pradesh",
  "west bengal": "West Bengal",
};

export function resolveGeoStateName(geoName: string): string | undefined {
  const lower = geoName.toLowerCase().trim();
  return GEO_TO_CSV_STATE[lower];
}
