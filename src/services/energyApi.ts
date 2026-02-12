const MOSPI_BASE = import.meta.env.DEV ? "/mospi/api" : "https://api.mospi.gov.in/api";
const BASE_URL = `${MOSPI_BASE}/energy/getEnergyRecords`;

export interface EnergyRecord {
  year: string;
  indicator: string;
  use_of_energy_balance: string;
  energy_commodities: string;
  energy_sub_commodities?: string | null;
  end_use_sector: string;
  end_use_sub_sector?: string | null;
  value: number;
}

interface ApiResponse {
  data: EnergyRecord[];
  meta_data: {
    page: number;
    totalRecords: number;
    totalPages: number;
    recordPerPage: number;
  };
  msg: string;
  statusCode: boolean;
}

export async function fetchSupplyData(): Promise<EnergyRecord[]> {
  const url = `${BASE_URL}?indicator_code=${encodeURIComponent("Energy Balance ( in PetaJoules )")}&use_of_energy_balance_code=Supply&Format=JSON&limit=555`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Supply API error: ${res.status}`);
  const json: ApiResponse = await res.json();
  return json.data;
}

export async function fetchConsumptionData(): Promise<EnergyRecord[]> {
  const url = `${BASE_URL}?indicator_code=${encodeURIComponent("Energy Balance ( in KToE )")}&use_of_energy_balance_code=Consumption&Format=JSON&limit=7000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Consumption API error: ${res.status}`);
  const json: ApiResponse = await res.json();
  return json.data;
}

export interface NationalEnergySummary {
  // Supply side (PetaJoules)
  totalProduction: number;
  totalImports: number;
  totalExports: number;
  totalStockChanges: number;
  totalPrimarySupply: number;
  // Consumption side (KToE)
  totalFinalConsumption: number;
  totalIndustryConsumption: number;
  totalTransportConsumption: number;
  totalResidentialConsumption: number;
  // By commodity
  supplyByCommodity: Record<string, { production: number; imports: number; exports: number; supply: number }>;
  consumptionBySector: Record<string, number>;
  // By year
  supplyByYear: Record<string, { production: number; imports: number; exports: number; supply: number }>;
  consumptionByYear: Record<string, number>;
  // Latest year
  latestYear: string;
}

export function aggregateSupply(records: EnergyRecord[]): {
  totalProduction: number;
  totalImports: number;
  totalExports: number;
  totalStockChanges: number;
  totalPrimarySupply: number;
  byCommodity: Record<string, { production: number; imports: number; exports: number; supply: number }>;
  byYear: Record<string, { production: number; imports: number; exports: number; supply: number }>;
  latestYear: string;
} {
  let totalProduction = 0, totalImports = 0, totalExports = 0, totalStockChanges = 0, totalPrimarySupply = 0;
  const byCommodity: Record<string, { production: number; imports: number; exports: number; supply: number }> = {};
  const byYear: Record<string, { production: number; imports: number; exports: number; supply: number }> = {};
  const years = new Set<string>();

  for (const r of records) {
    years.add(r.year);
    const sector = r.end_use_sector?.toLowerCase() || "";
    const commodity = r.energy_commodities || "Other";

    if (!byCommodity[commodity]) byCommodity[commodity] = { production: 0, imports: 0, exports: 0, supply: 0 };
    if (!byYear[r.year]) byYear[r.year] = { production: 0, imports: 0, exports: 0, supply: 0 };

    if (sector.includes("production")) {
      totalProduction += r.value;
      byCommodity[commodity].production += r.value;
      byYear[r.year].production += r.value;
    } else if (sector.includes("imports")) {
      totalImports += r.value;
      byCommodity[commodity].imports += r.value;
      byYear[r.year].imports += r.value;
    } else if (sector.includes("exports")) {
      totalExports += Math.abs(r.value);
      byCommodity[commodity].exports += Math.abs(r.value);
      byYear[r.year].exports += Math.abs(r.value);
    } else if (sector.includes("stock")) {
      totalStockChanges += r.value;
    } else if (sector.includes("total primary")) {
      totalPrimarySupply += r.value;
      byCommodity[commodity].supply += r.value;
      byYear[r.year].supply += r.value;
    }
  }

  const sortedYears = [...years].sort();
  return { totalProduction, totalImports, totalExports, totalStockChanges, totalPrimarySupply, byCommodity, byYear, latestYear: sortedYears[sortedYears.length - 1] || "" };
}

export function aggregateConsumption(records: EnergyRecord[]): {
  totalFinalConsumption: number;
  totalIndustry: number;
  totalTransport: number;
  totalResidential: number;
  bySector: Record<string, number>;
  byYear: Record<string, number>;
  byCommodity: Record<string, number>;
} {
  let totalFinalConsumption = 0, totalIndustry = 0, totalTransport = 0, totalResidential = 0;
  const bySector: Record<string, number> = {};
  const byYear: Record<string, number> = {};
  const byCommodity: Record<string, number> = {};

  for (const r of records) {
    const sector = r.end_use_sector?.toLowerCase() || "";
    const commodity = r.energy_commodities || "Other";

    if (sector === "final consumption") {
      totalFinalConsumption += r.value;
      byYear[r.year] = (byYear[r.year] || 0) + r.value;
      byCommodity[commodity] = (byCommodity[commodity] || 0) + r.value;
    } else if (sector === "industry" && !r.end_use_sub_sector) {
      totalIndustry += r.value;
      bySector["Industry"] = (bySector["Industry"] || 0) + r.value;
    } else if (sector === "transport") {
      totalTransport += r.value;
      bySector["Transport"] = (bySector["Transport"] || 0) + r.value;
    } else if (sector.includes("residential")) {
      totalResidential += r.value;
      bySector["Residential"] = (bySector["Residential"] || 0) + r.value;
    } else if (r.end_use_sub_sector) {
      bySector[r.end_use_sub_sector] = (bySector[r.end_use_sub_sector] || 0) + r.value;
    }
  }

  return { totalFinalConsumption, totalIndustry, totalTransport, totalResidential, bySector, byYear, byCommodity };
}
