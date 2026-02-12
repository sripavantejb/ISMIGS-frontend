import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { commodityNameToSlug, resolveCommodityFromSlug } from "@/utils/energySlug";
import { EnergyCommodityHero } from "@/components/EnergyCommodityHero";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useSupplyKToE, useConsumptionKToE, useSupplyPetaJoules } from "@/hooks/useMacroData";
import { buildEnergyAnalysis } from "@/utils/energyLogic";
import { buildEnergyForecastForRows } from "@/utils/forecastEnergy";
import {
  getEnergyCommodityAdminWarnings,
  type EnergyCommodityAnalysis,
  type EnergyCommodityForecast,
} from "@/utils/riskRules";
import { FilterBar } from "@/components/FilterBar";
import { AlertBanner } from "@/components/AlertBanner";
import { PredictionCard } from "@/components/PredictionCard";
import { ForecastChart } from "@/components/ForecastChart";
import { EnergyIntelligenceBriefing } from "@/components/EnergyIntelligenceBriefing";
import { Badge } from "@/components/ui/badge";

const tooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 22%)",
  borderRadius: "8px",
  fontFamily: "JetBrains Mono",
  fontSize: "12px",
};

interface EnergyRecord {
  year?: string;
  energy_commodities?: string;
  end_use_sector?: string;
  value?: number;
  [key: string]: unknown;
}

const EnergyAnalytics = () => {
  const [searchParams] = useSearchParams();
  const { commoditySlug } = useParams<{ commoditySlug?: string }>();
  const navigate = useNavigate();
  const isAdminView = searchParams.get("view") === "admin";

  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [pendingYear, setPendingYear] = useState("ALL");
  const [pendingSector, setPendingSector] = useState("ALL");

  const { data: supplyKToe, isLoading: loadingSupply } = useSupplyKToE();
  const { data: consumptionKToe, isLoading: loadingCons } = useConsumptionKToE();
  const { data: supplyPj, isLoading: loadingPj } = useSupplyPetaJoules();

  const isLoading = loadingSupply || loadingCons || loadingPj;

  const supplyRows = (supplyKToe || []) as EnergyRecord[];
  const consRows = (consumptionKToe || []) as EnergyRecord[];
  const pjRows = (supplyPj || []) as EnergyRecord[];

  const commodityList = useMemo(() => {
    const set = new Set<string>();
    supplyRows.forEach((r) => r.energy_commodities && set.add(r.energy_commodities));
    consRows.forEach((r) => r.energy_commodities && set.add(r.energy_commodities));
    return Array.from(set).sort();
  }, [supplyRows, consRows]);

  const selectedCommodity = useMemo(() => {
    if (!commoditySlug) return null;
    return resolveCommodityFromSlug(commoditySlug, commodityList);
  }, [commoditySlug, commodityList]);

  useEffect(() => {
    if (commoditySlug && commodityList.length > 0 && !resolveCommodityFromSlug(commoditySlug, commodityList)) {
      navigate("/energy", { replace: true });
    }
  }, [commoditySlug, commodityList, navigate]);

  const filteredSupply = useMemo(() => {
    if (!selectedCommodity) return [];
    return supplyRows.filter((r) => {
      if (r.energy_commodities !== selectedCommodity) return false;
      if (selectedYear !== "ALL" && r.year !== selectedYear) return false;
      if (selectedSector !== "ALL" && r.end_use_sector !== selectedSector) return false;
      return true;
    });
  }, [supplyRows, selectedCommodity, selectedYear, selectedSector]);

  const filteredConsumption = useMemo(() => {
    if (!selectedCommodity) return [];
    return consRows.filter((r) => {
      if (r.energy_commodities !== selectedCommodity) return false;
      if (selectedYear !== "ALL" && r.year !== selectedYear) return false;
      if (selectedSector !== "ALL" && r.end_use_sector !== selectedSector) return false;
      return true;
    });
  }, [consRows, selectedCommodity, selectedYear, selectedSector]);

  const filteredSupplyPj = useMemo(() => {
    if (!selectedCommodity) return [];
    return pjRows.filter((r) => {
      if (r.energy_commodities !== selectedCommodity) return false;
      if (selectedYear !== "ALL" && r.year !== selectedYear) return false;
      if (selectedSector !== "ALL" && r.end_use_sector !== selectedSector) return false;
      return true;
    });
  }, [pjRows, selectedCommodity, selectedYear, selectedSector]);

  const analysis = useMemo(
    () => buildEnergyAnalysis(filteredSupply, filteredConsumption),
    [filteredSupply, filteredConsumption]
  );

  const commodityForecast = useMemo(
    () => buildEnergyForecastForRows(filteredSupply, filteredConsumption),
    [filteredSupply, filteredConsumption]
  );

  const adminWarnings = useMemo(() => {
    if (!selectedCommodity || !isAdminView) return [];
    const analysisShape: EnergyCommodityAnalysis = {
      byYear: analysis.byYear,
      latest: analysis.latest,
    };
    const forecastShape: EnergyCommodityForecast | null = commodityForecast
      ? {
          nextYear: commodityForecast.nextYear,
          projectedSupply: commodityForecast.projectedSupply,
          projectedConsumption: commodityForecast.projectedConsumption,
          projectedRatio: commodityForecast.projectedRatio,
          status: commodityForecast.status,
          history: commodityForecast.history,
        }
      : null;
    return getEnergyCommodityAdminWarnings(selectedCommodity, analysisShape, forecastShape);
  }, [selectedCommodity, isAdminView, analysis, commodityForecast]);

  const supplyTrend = useMemo(() => {
    const byYear = analysis.byYear;
    if (!byYear || byYear.length < 2) return "stable";
    const last5 = byYear.slice(-5);
    const first = last5[0].supply;
    const last = last5[last5.length - 1].supply;
    if (first === 0) return "stable";
    const pct = ((last - first) / first) * 100;
    if (pct < -5) return "declining";
    if (pct > 5) return "growing";
    return "stable";
  }, [analysis.byYear]);

  const productionTotal = useMemo(() => {
    return filteredSupply.reduce((sum, r) => {
      const sector = (r.end_use_sector || "").toLowerCase();
      if (sector.includes("production")) return sum + (Number(r.value) || 0);
      return sum;
    }, 0);
  }, [filteredSupply]);

  const importsTotal = useMemo(() => {
    return filteredSupply.reduce((sum, r) => {
      const sector = (r.end_use_sector || "").toLowerCase();
      if (sector.includes("import")) return sum + (Number(r.value) || 0);
      return sum;
    }, 0);
  }, [filteredSupply]);

  const exportsTotal = useMemo(() => {
    return filteredSupply.reduce((sum, r) => {
      const sector = (r.end_use_sector || "").toLowerCase();
      if (sector.includes("export")) return sum + Math.abs(Number(r.value) || 0);
      return sum;
    }, 0);
  }, [filteredSupply]);

  const consumptionTotal = useMemo(
    () => filteredConsumption.reduce((sum, r) => sum + (Number(r.value) || 0), 0),
    [filteredConsumption]
  );

  const sectorTotals = useMemo(() => {
    const bySector = new Map<string, number>();
    filteredConsumption.forEach((r) => {
      const key = r.end_use_sector || "Other";
      bySector.set(key, (bySector.get(key) || 0) + (Number(r.value) || 0));
    });
    return Array.from(bySector.entries()).map(([name, total]) => ({ name, total }));
  }, [filteredConsumption]);

  const sectorsAffected = useMemo(() => {
    const set = new Set<string>();
    filteredConsumption.forEach((r) => r.end_use_sector && set.add(r.end_use_sector));
    return Array.from(set).sort();
  }, [filteredConsumption]);

  const outlookContext = useMemo(
    () =>
      commodityForecast && selectedCommodity
        ? {
            energyRatio:
              commodityForecast.projectedRatio != null &&
              Number.isFinite(commodityForecast.projectedRatio)
                ? commodityForecast.projectedRatio.toFixed(2)
                : undefined,
            supplyTrend,
            consumptionLevel:
              consumptionTotal != null && Number.isFinite(consumptionTotal)
                ? `${Math.round(consumptionTotal).toLocaleString("en-IN")} KToE (total consumption)`
                : undefined,
            commodityName: selectedCommodity,
            isEnergyCommodity: "true",
          }
        : null,
    [commodityForecast, selectedCommodity, supplyTrend, consumptionTotal]
  );

  const pjByYear = useMemo(() => {
    const byYear = new Map<string, number>();
    filteredSupplyPj.forEach((r) => {
      const key = r.year || "";
      byYear.set(key, (byYear.get(key) || 0) + (Number(r.value) || 0));
    });
    return Array.from(byYear.entries())
      .map(([fiscalYear, total]) => ({ fiscalYear, total }))
      .sort((a, b) => (a.fiscalYear > b.fiscalYear ? 1 : -1));
  }, [filteredSupplyPj]);

  const yearsOptions = useMemo(() => {
    const set = new Set<string>();
    supplyRows.forEach((r) => r.year && set.add(r.year));
    consRows.forEach((r) => r.year && set.add(r.year));
    return ["ALL", ...Array.from(set).sort()];
  }, [supplyRows, consRows]);

  const sectorOptions = useMemo(() => {
    const set = new Set<string>();
    supplyRows.forEach((r) => r.end_use_sector && set.add(r.end_use_sector));
    consRows.forEach((r) => r.end_use_sector && set.add(r.end_use_sector));
    return ["ALL", ...Array.from(set).sort()];
  }, [supplyRows, consRows]);

  const handleApply = () => {
    setSelectedYear(pendingYear);
    setSelectedSector(pendingSector);
  };
  const handleReset = () => {
    setPendingYear("ALL");
    setPendingSector("ALL");
    setSelectedYear("ALL");
    setSelectedSector("ALL");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Energy Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Choose a commodity from the left sidebar to see production, consumption, outlook, and impact.
          </p>
        </div>
        {isAdminView && (
          <Badge variant="secondary" className="text-xs">
            Administrator view
          </Badge>
        )}
      </div>

      {!selectedCommodity ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 space-y-4"
        >
          <p className="text-base text-foreground text-center">
            Choose a commodity from the left sidebar (Coal, Crude Oil, Electricity, etc.) to see production, consumption, outlook, and impact.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {commodityList.map((name) => (
              <Link
                key={name}
                to={`/energy/${commodityNameToSlug(name)}`}
                className="text-sm text-primary hover:underline font-medium"
              >
                {name}
              </Link>
            ))}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Hero: large bold commodity name + animations */}
          <EnergyCommodityHero commodityName={selectedCommodity} />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link to="/energy" className="text-muted-foreground hover:text-foreground transition-colors">
              Energy Analytics
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">{selectedCommodity}</span>
          </nav>

          {/* Energy Intelligence Briefing: auto-generated, no button; shown first */}
          {selectedCommodity && outlookContext && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-border/60 bg-card/30 p-5"
            >
              <EnergyIntelligenceBriefing sectorName={selectedCommodity} context={outlookContext} />
            </motion.div>
          )}

          {/* Year and Sector filters (no commodity dropdown) */}
          <FilterBar
            filters={[
              {
                label: "Year",
                value: pendingYear,
                onChange: setPendingYear,
                options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })),
              },
              {
                label: "Sector",
                value: pendingSector,
                onChange: setPendingSector,
                options: sectorOptions.map((s) => ({
                  value: s,
                  label: s === "ALL" ? "All sectors" : s,
                })),
              },
            ]}
            onApply={handleApply}
            onReset={handleReset}
          />

          {/* Back to list */}
          <div className="flex items-center gap-2">
            <Link
              to="/energy"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              View all commodities
            </Link>
          </div>

          {/* Administrator warnings */}
          {isAdminView && adminWarnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Administrator warnings
              </h3>
              {adminWarnings.map((alert) => (
                <AlertBanner
                  key={alert.id}
                  level={alert.type}
                  title={alert.title}
                  message={alert.message}
                />
              ))}
            </div>
          )}

          {/* Production & Consumption KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Production</div>
              <div className="font-mono font-bold text-foreground mt-1">
                {productionTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} KToE
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-4"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Imports</div>
              <div className="font-mono font-bold text-foreground mt-1">
                {importsTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} KToE
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Exports</div>
              <div className="font-mono font-bold text-foreground mt-1">
                {exportsTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} KToE
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-4"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Consumption</div>
              <div className="font-mono font-bold text-foreground mt-1">
                {consumptionTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} KToE
              </div>
            </motion.div>
          </div>

          {/* Analytics: Supply vs Consumption by year */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
              Supply vs Consumption (KToE) — {selectedCommodity}
            </h3>
            <div className="flex gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground">Latest year</div>
                <div className="font-mono font-bold">{analysis.latest?.fiscalYear || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ratio (Supply / Consumption)</div>
                <div className="font-mono font-bold">
                  {analysis.latest?.ratio != null ? analysis.latest.ratio.toFixed(2) : "—"}
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.byYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis
                    dataKey="fiscalYear"
                    stroke="hsl(215 20% 55%)"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="supply"
                    stroke="hsl(187 92% 50%)"
                    strokeWidth={2}
                    name="Supply (KToE)"
                  />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    stroke="hsl(38 92% 55%)"
                    strokeWidth={2}
                    name="Consumption (KToE)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Consumption by sector */}
          {sectorTotals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-5"
            >
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
                Consumption by End-use Sector (KToE) — {selectedCommodity}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorTotals}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(215 20% 55%)"
                      fontSize={9}
                      fontFamily="JetBrains Mono"
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="total"
                      fill="hsl(160 84% 45%)"
                      name="Consumption"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Sectors affected */}
          {sectorsAffected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5"
            >
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Sectors affected by {selectedCommodity}
              </h3>
              <div className="flex flex-wrap gap-2">
                {sectorsAffected.map((s) => (
                  <Badge key={s} variant="outline" className="text-sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Prediction */}
          {commodityForecast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <PredictionCard
                title={`What's happening with ${selectedCommodity}`}
                status={
                  commodityForecast.status === "pressure"
                    ? "pressure"
                    : commodityForecast.status === "surplus"
                      ? "stable"
                      : "stable"
                }
                metrics={[
                  {
                    label: `Projected supply (${commodityForecast.nextYear})`,
                    value:
                      commodityForecast.projectedSupply != null &&
                      Number.isFinite(commodityForecast.projectedSupply)
                        ? Math.round(commodityForecast.projectedSupply).toLocaleString("en-IN")
                        : "—",
                  },
                  {
                    label: `Projected consumption (${commodityForecast.nextYear})`,
                    value:
                      commodityForecast.projectedConsumption != null &&
                      Number.isFinite(commodityForecast.projectedConsumption)
                        ? Math.round(commodityForecast.projectedConsumption).toLocaleString("en-IN")
                        : "—",
                  },
                  {
                    label: "Projected balance ratio",
                    value:
                      commodityForecast.projectedRatio != null
                        ? commodityForecast.projectedRatio.toFixed(2)
                        : "—",
                  },
                ]}
              >
                <ForecastChart
                  data={commodityForecast.forecastLine as Record<string, unknown>[]}
                  xKey="x"
                  actualKey="supply"
                  forecastKey="consumption"
                  actualName="Supply (KToE)"
                  forecastName="Consumption (KToE)"
                  historyLength={commodityForecast.history?.length ?? 0}
                  height={224}
                  historyColor="hsl(217 91% 60%)"
                  forecastColor="hsl(38 92% 50%)"
                />
              </PredictionCard>
            </motion.div>
          )}

          {/* Supply in PetaJoules (if data exists) */}
          {pjByYear.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-5"
            >
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
                Supply in PetaJoules — {selectedCommodity}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pjByYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                    <XAxis
                      dataKey="fiscalYear"
                      stroke="hsl(215 20% 55%)"
                      fontSize={10}
                      fontFamily="JetBrains Mono"
                    />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(160 84% 45%)"
                      strokeWidth={2}
                      name="Supply (PJ)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default EnergyAnalytics;
