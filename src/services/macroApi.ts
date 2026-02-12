// WPI, NAS, IIP API services

const MOSPI_BASE = import.meta.env.DEV ? "/mospi/api" : "https://api.mospi.gov.in/api";
const ENERGY_BASE = `${MOSPI_BASE}/energy/getEnergyRecords`;
const WPI_BASE = `${MOSPI_BASE}/wpi/getWpiRecords`;
const NAS_BASE = `${MOSPI_BASE}/nas/getNASData`;
const IIP_ANNUAL_BASE = `${MOSPI_BASE}/iip/getIIPAnnual`;
const IIP_MONTHLY_BASE = `${MOSPI_BASE}/iip/getIIPMonthly`;

// ─── Energy Supply (KToE) ───
export async function fetchSupplyKToE() {
  const url = `${ENERGY_BASE}?indicator_code=${encodeURIComponent("Energy Balance ( in KToE )")}&use_of_energy_balance_code=Supply&Format=JSON&limit=555`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Supply KToE API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// ─── Energy Supply (PetaJoules) ───
export async function fetchSupplyPetaJoules() {
  const url = `${ENERGY_BASE}?indicator_code=${encodeURIComponent("Energy Balance ( in PetaJoules )")}&use_of_energy_balance_code=Supply&Format=JSON&limit=555`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Supply PetaJoules API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// ─── Energy Consumption (KToE) ───
export async function fetchConsumptionKToE() {
  const url = `${ENERGY_BASE}?indicator_code=${encodeURIComponent("Energy Balance ( in KToE )")}&use_of_energy_balance_code=Consumption&Format=JSON&limit=7000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Consumption KToE API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// ─── WPI ───
export interface WPIRecord {
  year?: string;
  month?: string;
  commodity_group?: string;
  commodity_name?: string;
  index_value?: number;
  inflation_rate?: number;
  [key: string]: any;
}

export async function fetchWPIData(): Promise<WPIRecord[]> {
  const url = `${WPI_BASE}?Format=JSON&limit=5000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WPI API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// ─── NAS (GDP etc.) ───
export interface NASRecord {
  indicator?: string;
  indicator_code?: number;
  year?: string;
  value?: number;
  series?: string;
  frequency?: string;
  [key: string]: any;
}

export async function fetchNASData(indicatorCode: number = 1): Promise<NASRecord[]> {
  const url = `${NAS_BASE}?series=Current&frequency_code=Annually&indicator_code=${indicatorCode}&Format=JSON&limit=2000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NAS API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// ─── GVA Detailed (industry/subindustry/institution) ───
export async function fetchGvaDetailed(): Promise<NASRecord[]> {
  const url = `${NAS_BASE}?series=Current&frequency_code=1&indicator_code=1&page=1&limit=20&year=2025-26,2024-25,2023-24,2022-23,2021-22,2020-21,2019-20,2018-19,2017-18,2016-17,2015-16,2014-15,2013-14,2012-13,2011-12&approach_code=1&revision_code=1,2,3,4,5,6,7,8&industry_code=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15&subindustry_code=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18&institutional_sector_code=1,2,3,4,5,6,7&Format=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GVA Detailed API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// Fetch multiple NAS indicators
export async function fetchMultipleNAS(codes: number[]): Promise<Record<number, NASRecord[]>> {
  const results: Record<number, NASRecord[]> = {};
  const promises = codes.map(async (code) => {
    try {
      const data = await fetchNASData(code);
      results[code] = data;
    } catch {
      results[code] = [];
    }
  });
  await Promise.all(promises);
  return results;
}

// ─── IIP ───
export interface IIPRecord {
  year?: string;
  month?: string;
  base_year?: string;
  sector?: string;
  index_value?: number;
  growth_rate?: number;
  [key: string]: any;
}

export async function fetchIIPAnnual(): Promise<IIPRecord[]> {
  const url = `${IIP_ANNUAL_BASE}?base_year=${encodeURIComponent("2011-12")}&type=All&Format=JSON&limit=500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IIP Annual API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchIIPMonthly(): Promise<IIPRecord[]> {
  const url = `${IIP_MONTHLY_BASE}?base_year=${encodeURIComponent("2011-12")}&type=All&Format=JSON&limit=5500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IIP Monthly API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}
