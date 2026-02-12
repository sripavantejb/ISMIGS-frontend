export interface StateData {
  id: string;
  name: string;
  code: string;
  energyScore: number;
  compositeScore: number;
  riskLevel: "Strong" | "Stable" | "Moderate" | "Stress" | "Critical";
  ebr: number;
  eps: number;
  importDependency: number;
  industrialIntensity: number;
  forecastStress: number;
  production: number;
  imports: number;
  exports: number;
  stockChanges: number;
  totalSupply: number;
  finalConsumption: number;
  renewableShare: number;
  transmissionLoss: number;
  perCapita: number;
  yearlyData: YearlyEnergyData[];
  riskAlerts: RiskAlert[];
  sectorBreakdown: SectorData[];
}

export interface YearlyEnergyData {
  year: number;
  supply: number;
  consumption: number;
  production: number;
  imports: number;
  exports: number;
  stockChanges: number;
}

export interface RiskAlert {
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  message: string;
  confidence: number;
  action: string;
}

export interface SectorData {
  sector: string;
  consumption: number;
  share: number;
}

function getRiskLevel(eps: number): StateData["riskLevel"] {
  if (eps >= 120) return "Strong";
  if (eps >= 100) return "Stable";
  if (eps >= 80) return "Moderate";
  if (eps >= 60) return "Stress";
  return "Critical";
}

function generateYearlyData(base: number): YearlyEnergyData[] {
  return Array.from({ length: 8 }, (_, i) => {
    const year = 2017 + i;
    const growth = 1 + (Math.random() * 0.08 - 0.02);
    const prod = Math.round(base * growth * (1 + i * 0.03));
    const imp = Math.round(prod * (0.1 + Math.random() * 0.3));
    const exp = Math.round(prod * (Math.random() * 0.1));
    const stock = Math.round((Math.random() - 0.5) * prod * 0.05);
    return {
      year,
      production: prod,
      imports: imp,
      exports: exp,
      stockChanges: stock,
      supply: prod + imp - exp + stock,
      consumption: Math.round((prod + imp - exp + stock) * (0.85 + Math.random() * 0.1)),
    };
  });
}

function generateAlerts(eps: number, importDep: number): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  if (eps < 75) alerts.push({ type: "Energy Stress", severity: "Critical", message: `EPS at ${eps} — below critical threshold`, confidence: 92, action: "Increase renewable capacity, reduce industrial load" });
  if (importDep > 40) alerts.push({ type: "Import Vulnerability", severity: "High", message: `Import dependency at ${importDep}%`, confidence: 88, action: "Diversify energy sources, boost domestic production" });
  if (eps < 90) alerts.push({ type: "Supply Risk", severity: "Medium", message: "Supply-demand gap widening", confidence: 75, action: "Review procurement contracts, activate reserves" });
  if (alerts.length === 0) alerts.push({ type: "Stable", severity: "Low", message: "All metrics within normal range", confidence: 95, action: "Continue monitoring" });
  return alerts;
}

const stateSeeds: { name: string; code: string; baseProd: number; impDep: number }[] = [
  { name: "Andhra Pradesh", code: "AP", baseProd: 4200, impDep: 28 },
  { name: "Arunachal Pradesh", code: "AR", baseProd: 800, impDep: 12 },
  { name: "Assam", code: "AS", baseProd: 2100, impDep: 35 },
  { name: "Bihar", code: "BR", baseProd: 1800, impDep: 52 },
  { name: "Chhattisgarh", code: "CG", baseProd: 3800, impDep: 15 },
  { name: "Goa", code: "GA", baseProd: 600, impDep: 45 },
  { name: "Gujarat", code: "GJ", baseProd: 7500, impDep: 32 },
  { name: "Haryana", code: "HR", baseProd: 3200, impDep: 38 },
  { name: "Himachal Pradesh", code: "HP", baseProd: 2800, impDep: 8 },
  { name: "Jharkhand", code: "JH", baseProd: 3500, impDep: 22 },
  { name: "Karnataka", code: "KA", baseProd: 5200, impDep: 25 },
  { name: "Kerala", code: "KL", baseProd: 2400, impDep: 48 },
  { name: "Madhya Pradesh", code: "MP", baseProd: 4800, impDep: 30 },
  { name: "Maharashtra", code: "MH", baseProd: 9200, impDep: 34 },
  { name: "Manipur", code: "MN", baseProd: 400, impDep: 55 },
  { name: "Meghalaya", code: "ML", baseProd: 700, impDep: 40 },
  { name: "Mizoram", code: "MZ", baseProd: 300, impDep: 60 },
  { name: "Nagaland", code: "NL", baseProd: 350, impDep: 58 },
  { name: "Odisha", code: "OD", baseProd: 4500, impDep: 18 },
  { name: "Punjab", code: "PB", baseProd: 3800, impDep: 30 },
  { name: "Rajasthan", code: "RJ", baseProd: 5500, impDep: 28 },
  { name: "Sikkim", code: "SK", baseProd: 500, impDep: 10 },
  { name: "Tamil Nadu", code: "TN", baseProd: 6800, impDep: 30 },
  { name: "Telangana", code: "TS", baseProd: 4000, impDep: 33 },
  { name: "Tripura", code: "TR", baseProd: 600, impDep: 42 },
  { name: "Uttar Pradesh", code: "UP", baseProd: 7200, impDep: 40 },
  { name: "Uttarakhand", code: "UK", baseProd: 2600, impDep: 14 },
  { name: "West Bengal", code: "WB", baseProd: 5000, impDep: 36 },
  { name: "Delhi", code: "DL", baseProd: 2000, impDep: 65 },
  { name: "Jammu & Kashmir", code: "JK", baseProd: 2200, impDep: 20 },
];

export const statesData: StateData[] = stateSeeds.map((seed) => {
  const yearlyData = generateYearlyData(seed.baseProd);
  const latest = yearlyData[yearlyData.length - 1];
  const ebr = +(latest.supply / latest.consumption).toFixed(2);
  const eps = Math.round(ebr * 100);

  return {
    id: seed.code.toLowerCase(),
    name: seed.name,
    code: seed.code,
    energyScore: Math.min(100, Math.max(20, eps - 10 + Math.round(Math.random() * 20))),
    compositeScore: Math.round(40 + Math.random() * 55),
    riskLevel: getRiskLevel(eps),
    ebr,
    eps,
    importDependency: seed.impDep,
    industrialIntensity: +(0.3 + Math.random() * 0.5).toFixed(2),
    forecastStress: Math.round(Math.max(5, 100 - eps + Math.random() * 20)),
    production: latest.production,
    imports: latest.imports,
    exports: latest.exports,
    stockChanges: latest.stockChanges,
    totalSupply: latest.supply,
    finalConsumption: latest.consumption,
    renewableShare: Math.round(10 + Math.random() * 40),
    transmissionLoss: +(3 + Math.random() * 12).toFixed(1),
    perCapita: Math.round(500 + Math.random() * 2000),
    yearlyData,
    riskAlerts: generateAlerts(eps, seed.impDep),
    sectorBreakdown: [
      { sector: "Industry", consumption: Math.round(latest.consumption * 0.35), share: 35 },
      { sector: "Residential", consumption: Math.round(latest.consumption * 0.25), share: 25 },
      { sector: "Commercial", consumption: Math.round(latest.consumption * 0.15), share: 15 },
      { sector: "Agriculture", consumption: Math.round(latest.consumption * 0.12), share: 12 },
      { sector: "Transport", consumption: Math.round(latest.consumption * 0.08), share: 8 },
      { sector: "Other", consumption: Math.round(latest.consumption * 0.05), share: 5 },
    ],
  };
});

export function getScoreColor(score: number): string {
  if (score >= 120) return "text-strong";
  if (score >= 100) return "text-stable";
  if (score >= 80) return "text-moderate";
  if (score >= 60) return "text-stress";
  return "text-critical";
}

export function getRiskColor(level: StateData["riskLevel"]): string {
  const map = { Strong: "text-strong", Stable: "text-stable", Moderate: "text-moderate", Stress: "text-stress", Critical: "text-critical" };
  return map[level];
}

export function getMapColor(eps: number): string {
  if (eps >= 120) return "#22c55e";
  if (eps >= 100) return "#4ade80";
  if (eps >= 80) return "#facc15";
  if (eps >= 60) return "#f97316";
  return "#ef4444";
}
