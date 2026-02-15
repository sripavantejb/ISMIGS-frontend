import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Loader2, AlertCircle, Info, TrendingUp, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { buildEnergyAnalysis, type SupplyRow } from "@/utils/energyLogic";
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
import { getCommodityImpact } from "@/data/energyCommodityImpact";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useEnergyPredictions } from "@/hooks/useEnergyPredictions";

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
  const [energySectorForModal, setEnergySectorForModal] = useState<string | null>(null);
  const [showAIDetailsModal, setShowAIDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<"history" | "predictions">("history");
  
  const { loading: predictionsLoading, error: predictionsError, predictions, generatePredictions } = useEnergyPredictions();

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

  useEffect(() => {
    if (!commoditySlug && !isLoading && commodityList.length > 0) {
      navigate(`/energy/${commodityNameToSlug(commodityList[0])}`, { replace: true });
    }
  }, [commoditySlug, isLoading, commodityList, navigate]);

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
    () => buildEnergyAnalysis(filteredSupply as SupplyRow[], filteredConsumption as SupplyRow[]),
    [filteredSupply, filteredConsumption]
  );

  const commodityForecast = useMemo(
    () => buildEnergyForecastForRows(filteredSupply as SupplyRow[], filteredConsumption as SupplyRow[]),
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

  const sectorsAffectedFromData = useMemo(() => {
    const set = new Set<string>();
    filteredConsumption.forEach((r) => r.end_use_sector && set.add(r.end_use_sector));
    return Array.from(set).sort();
  }, [filteredConsumption]);

  const commodityImpact = useMemo(
    () => getCommodityImpact(selectedCommodity),
    [selectedCommodity]
  );

  const sectorsAffected =
    sectorsAffectedFromData.length > 0 ? sectorsAffectedFromData : commodityImpact.sectorsAffected;

  const energyImpactStatus = useMemo(() => {
    if (!commodityForecast) return { label: "Neutral", variant: "neutral" as const };
    switch (commodityForecast.status) {
      case "pressure":
        return { label: "Negative", variant: "negative" as const };
      case "surplus":
        return { label: "Positive", variant: "positive" as const };
      default:
        return { label: "Neutral", variant: "neutral" as const };
    }
  }, [commodityForecast]);

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
    if (viewMode === "predictions") {
      // For predictions mode, show future years (next 10 years)
      const currentYear = new Date().getFullYear();
      const futureYears: string[] = [];
      for (let i = 1; i <= 10; i++) {
        futureYears.push(`${currentYear + i}-${String((currentYear + i + 1) % 100).padStart(2, "0")}`);
      }
      return ["ALL", ...futureYears];
    } else {
      // For history mode, show historical years
    const set = new Set<string>();
    supplyRows.forEach((r) => r.year && set.add(r.year));
    consRows.forEach((r) => r.year && set.add(r.year));
    return ["ALL", ...Array.from(set).sort()];
    }
  }, [supplyRows, consRows, viewMode]);

  const sectorOptions = useMemo(() => {
    const set = new Set<string>();
    supplyRows.forEach((r) => r.end_use_sector && set.add(r.end_use_sector));
    consRows.forEach((r) => r.end_use_sector && set.add(r.end_use_sector));
    return ["ALL", ...Array.from(set).sort()];
  }, [supplyRows, consRows]);

  const handleApply = () => {
    // Clear cache when filters change to force regeneration
    if (viewMode === "predictions" && selectedCommodity) {
      // Clear ALL cache entries for this commodity to force fresh generation
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(`energy-predictions-${selectedCommodity}-`)) {
          sessionStorage.removeItem(key);
        }
      }
      sessionStorage.removeItem('last-prediction-data-key');
    }
    setSelectedYear(pendingYear);
    setSelectedSector(pendingSector);
  };
  const handleReset = () => {
    setPendingYear("ALL");
    setPendingSector("ALL");
    setSelectedYear("ALL");
    setSelectedSector("ALL");
  };

  // Prepare historical data for AI predictions
  const historicalDataForAI = useMemo(() => {
    if (!selectedCommodity || !analysis.byYear || analysis.byYear.length === 0) return null;
    
    const supplyData = analysis.byYear.map((d) => ({
      year: parseInt(d.fiscalYear.split("-")[0]) || 0,
      value: d.supply,
    }));
    const consumptionData = analysis.byYear.map((d) => ({
      year: parseInt(d.fiscalYear.split("-")[0]) || 0,
      value: d.consumption,
    }));

    return {
      commodityName: selectedCommodity,
      historicalSupply: supplyData,
      historicalConsumption: consumptionData,
      currentRatio: analysis.latest?.ratio,
      supplyTrend,
      consumptionLevel: consumptionTotal > 0 ? `${Math.round(consumptionTotal).toLocaleString("en-IN")} KToE` : undefined,
      // Always pass selectedYear in predictions mode, even if "ALL" (AI will generate for next year)
      // In history mode, this won't be used anyway
      selectedYear: viewMode === "predictions" ? (selectedYear !== "ALL" ? selectedYear : undefined) : undefined,
      selectedSector: selectedSector !== "ALL" ? selectedSector : undefined,
      productionTotal,
      importsTotal,
      exportsTotal,
      consumptionTotal,
      sectorTotals,
    };
  }, [selectedCommodity, analysis, supplyTrend, consumptionTotal, selectedYear, selectedSector, productionTotal, importsTotal, exportsTotal, sectorTotals, viewMode]);

  // Generate predictions when switching to predictions mode or when filters change
  useEffect(() => {
    if (viewMode === "predictions" && historicalDataForAI) {
      // Generate predictions if we don't have any, or if historical data changed (filters changed)
      const dataKey = JSON.stringify({
        year: selectedYear,
        sector: selectedSector,
        commodity: selectedCommodity,
      });
      const lastDataKey = sessionStorage.getItem('last-prediction-data-key');
      
      // Force regeneration if filters changed
      if (lastDataKey !== dataKey) {
        // Clear ALL old cache entries for this commodity when filters change
        if (selectedCommodity) {
          // Clear cache for all years for this commodity to force fresh generation
          // Iterate backwards to avoid index issues when removing items
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(`energy-predictions-${selectedCommodity}-`)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        }
        
        sessionStorage.setItem('last-prediction-data-key', dataKey);
        // Always regenerate when filters change - force bypass cache
        generatePredictions(historicalDataForAI, true);
      }
    } else if (viewMode === "history") {
      // Clear prediction cache when switching back to history
      sessionStorage.removeItem('last-prediction-data-key');
    }
  }, [viewMode, selectedYear, selectedSector, selectedCommodity, historicalDataForAI, generatePredictions]);

  // Prepare AI forecast data for charts
  const aiForecastData = useMemo(() => {
    // In predictions mode, try to use predictions, but fallback to commodityForecast if needed
    if (viewMode === "predictions") {
      // If we have predictions, use them
      if (predictions && predictions.forecasts && predictions.forecasts.years && predictions.forecasts.years.length > 0) {
        const history = analysis.byYear && analysis.byYear.length > 0 ? analysis.byYear.map((d) => ({
          x: d.fiscalYear,
          supply: d.supply,
          consumption: d.consumption,
        })) : [];

        const future = predictions.forecasts.years.map((year, idx) => ({
          x: `${year}-${String((year + 1) % 100).padStart(2, "0")}`,
          supply: predictions.forecasts.supply[idx] != null ? predictions.forecasts.supply[idx] : 0,
          consumption: predictions.forecasts.consumption[idx] != null ? predictions.forecasts.consumption[idx] : 0,
        }));

        // Find data for selected year if a specific year is selected
        let targetYearIndex = 0;
        let targetYear: number | null = null;
        
        if (selectedYear && selectedYear !== "ALL") {
          const yearMatch = selectedYear.match(/^(\d{4})/);
          if (yearMatch) {
            targetYear = parseInt(yearMatch[1], 10);
            const foundIndex = predictions.forecasts.years.findIndex(y => y === targetYear);
            if (foundIndex >= 0) {
              targetYearIndex = foundIndex;
            } else {
              const closestIndex = predictions.forecasts.years.reduce((closest, year, idx) => {
                const currentDiff = Math.abs(year - targetYear!);
                const closestDiff = Math.abs(predictions.forecasts.years[closest] - targetYear!);
                return currentDiff < closestDiff ? idx : closest;
              }, 0);
              targetYearIndex = closestIndex;
              targetYear = predictions.forecasts.years[closestIndex];
            }
          }
        }

        // Use selected year if available, otherwise use first year in forecast
        const nextYear = selectedYear && selectedYear !== "ALL" 
          ? (() => {
              const yearMatch = selectedYear.match(/^(\d{4})/);
              return yearMatch ? parseInt(yearMatch[1], 10) : (targetYear || predictions.forecasts.years[0] || null);
            })()
          : (targetYear || predictions.forecasts.years[0] || null);
        const projectedSupply = predictions.forecasts.supply[targetYearIndex] != null ? predictions.forecasts.supply[targetYearIndex] : 0;
        const projectedConsumption = predictions.forecasts.consumption[targetYearIndex] != null ? predictions.forecasts.consumption[targetYearIndex] : 0;
        const projectedRatio = projectedConsumption > 0 ? projectedSupply / projectedConsumption : null;
        
        // Calculate imports/exports for the selected year based on supply/consumption gap
        // If consumption > supply, we need imports; if supply > consumption, we might have exports
        const supplyConsumptionGap = projectedConsumption - projectedSupply;
        const projectedImports = supplyConsumptionGap > 0 ? supplyConsumptionGap : 0;
        const projectedExports = supplyConsumptionGap < 0 ? Math.abs(supplyConsumptionGap) : 0;

        let status: "pressure" | "surplus" | "stable" = "stable";
        if (projectedRatio != null) {
          if (projectedRatio < 0.95) {
            status = "pressure";
          } else if (projectedRatio > 1.05) {
            status = "surplus";
          }
        }

        return {
          history,
          forecastLine: [...history, ...future],
          nextYear,
          projectedSupply,
          projectedConsumption,
          projectedRatio,
          projectedImports,
          projectedExports,
          status,
        };
      }
      
      // Fallback to commodityForecast if predictions not available
      if (commodityForecast && commodityForecast.forecastLine && commodityForecast.forecastLine.length > 0) {
        const fallbackGap = (commodityForecast.projectedConsumption || 0) - (commodityForecast.projectedSupply || 0);
        return {
          history: commodityForecast.history || [],
          forecastLine: commodityForecast.forecastLine,
          nextYear: commodityForecast.nextYear,
          projectedSupply: commodityForecast.projectedSupply,
          projectedConsumption: commodityForecast.projectedConsumption,
          projectedRatio: commodityForecast.projectedRatio,
          projectedImports: fallbackGap > 0 ? fallbackGap : 0,
          projectedExports: fallbackGap < 0 ? Math.abs(fallbackGap) : 0,
          status: commodityForecast.status,
        };
      }
    }
    
    return null;
  }, [predictions, analysis.byYear, viewMode, selectedYear, commodityForecast]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 space-y-6 ${viewMode === "predictions" ? "bg-gradient-to-br from-orange-950/20 via-background to-orange-900/10" : ""}`}>
      {/* Toggle in top-right header area (fixed position, aligned with header) */}
      {selectedCommodity && (
        <div className="fixed top-4 right-6 z-50 flex items-center justify-end">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/90 backdrop-blur-sm shadow-lg p-1"
          >
            <motion.button
              onClick={() => setViewMode("history")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded-md transition-all duration-200",
                viewMode === "history"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Past History
            </motion.button>
            <motion.button
              onClick={() => setViewMode("predictions")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded-md transition-all duration-200",
                viewMode === "predictions"
                  ? "bg-orange-500 text-white font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Predictions
            </motion.button>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Energy Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Production, consumption, and impact by commodity. Select from the sidebar.
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
            Select a commodity from the sidebar to see production, consumption, and impact.
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


          {/* Energy Intelligence Briefing: shown above filters in predictions mode */}
          {viewMode === "predictions" && selectedCommodity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-950/20 via-orange-900/10 to-orange-950/20 p-6 mb-6 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Energy Intelligence</h3>
                    <p className="text-xs text-muted-foreground">AI-powered insights and forecasts</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIDetailsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 transition-all duration-200 hover:scale-105 font-medium text-sm"
                >
                  Know More
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                {predictionsLoading ? (
                  <p>Generating AI insights...</p>
                ) : predictions ? (
                  <>
                    {predictions.narrative && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Forecast Summary:</p>
                        <p className="line-clamp-2">{predictions.narrative}</p>
                      </div>
                    )}
                    {predictions.riskFactors && predictions.riskFactors.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Key Risks ({predictions.riskFactors.length}):</p>
                        <p className="line-clamp-1">{predictions.riskFactors.slice(0, 2).join(" • ")}</p>
                      </div>
                    )}
                    {predictions.recommendations && predictions.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Recommendations ({predictions.recommendations.length}):</p>
                        <p className="line-clamp-1">{predictions.recommendations.slice(0, 2).join(" • ")}</p>
                      </div>
                    )}
                    {!predictions.narrative && !predictions.riskFactors && !predictions.recommendations && (
                      <p>AI-powered insights and forecasts for {selectedCommodity}. Click "Know More" for detailed analysis.</p>
                    )}
                  </>
                ) : (
                  <p>AI-powered insights and forecasts for {selectedCommodity}. Click "Know More" for detailed analysis.</p>
                )}
              </div>
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
            applyButtonClassName={viewMode === "predictions" ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500/30" : ""}
          />

          {/* Predictions Loading Indicator */}
          {viewMode === "predictions" && predictionsLoading && (
            <div className="glass-card p-4 space-y-3 border-orange-500/30 bg-orange-950/10">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          )}

          {/* Predictions Error Alert */}
          {viewMode === "predictions" && predictionsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {predictionsError.startsWith("OpenAI API key") || predictionsError.startsWith("Energy predictions are not configured")
                  ? predictionsError
                  : `Failed to generate predictions: ${predictionsError}`}
              </AlertDescription>
            </Alert>
          )}

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
          {viewMode === "history" ? (
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
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-4 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Production {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : commodityForecast?.nextYear ? `(${commodityForecast.nextYear})` : "(Projected)"}
                </div>
                <div className={`font-mono font-bold mt-1 ${viewMode === "predictions" ? "text-orange-400" : "text-foreground"}`}>
                  {aiForecastData?.projectedSupply != null && Number.isFinite(aiForecastData.projectedSupply)
                    ? Math.round(aiForecastData.projectedSupply).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                    : predictions?.kpis?.production != null && Number.isFinite(predictions.kpis.production)
                      ? Math.round(predictions.kpis.production).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                      : commodityForecast?.projectedSupply != null && Number.isFinite(commodityForecast.projectedSupply)
                        ? Math.round(commodityForecast.projectedSupply).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                        : productionTotal != null && Number.isFinite(productionTotal)
                          ? Math.round(productionTotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                          : "—"} KToE
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={`glass-card p-4 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Imports {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : commodityForecast?.nextYear ? `(${commodityForecast.nextYear})` : "(Projected)"}
                </div>
                <div className={`font-mono font-bold mt-1 ${viewMode === "predictions" ? "text-orange-400" : "text-foreground"}`}>
                  {aiForecastData?.projectedImports != null && Number.isFinite(aiForecastData.projectedImports)
                    ? Math.round(aiForecastData.projectedImports).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                    : predictions?.kpis?.imports != null && Number.isFinite(predictions.kpis.imports)
                      ? Math.round(predictions.kpis.imports).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                      : importsTotal != null && Number.isFinite(importsTotal)
                        ? Math.round(importsTotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                        : "—"} KToE
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`glass-card p-4 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Exports {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : commodityForecast?.nextYear ? `(${commodityForecast.nextYear})` : "(Projected)"}
                </div>
                <div className={`font-mono font-bold mt-1 ${viewMode === "predictions" ? "text-orange-400" : "text-foreground"}`}>
                  {aiForecastData?.projectedExports != null && Number.isFinite(aiForecastData.projectedExports)
                    ? Math.round(aiForecastData.projectedExports).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                    : predictions?.kpis?.exports != null && Number.isFinite(predictions.kpis.exports)
                      ? Math.round(predictions.kpis.exports).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                      : exportsTotal != null && Number.isFinite(exportsTotal)
                        ? Math.round(exportsTotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                        : "—"} KToE
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`glass-card p-4 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Consumption {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : commodityForecast?.nextYear ? `(${commodityForecast.nextYear})` : "(Projected)"}
                </div>
                <div className={`font-mono font-bold mt-1 ${viewMode === "predictions" ? "text-orange-400" : "text-foreground"}`}>
                  {aiForecastData?.projectedConsumption != null && Number.isFinite(aiForecastData.projectedConsumption)
                    ? Math.round(aiForecastData.projectedConsumption).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                    : predictions?.kpis?.consumption != null && Number.isFinite(predictions.kpis.consumption)
                      ? Math.round(predictions.kpis.consumption).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                      : commodityForecast?.projectedConsumption != null && Number.isFinite(commodityForecast.projectedConsumption)
                        ? Math.round(commodityForecast.projectedConsumption).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                        : consumptionTotal != null && Number.isFinite(consumptionTotal)
                          ? Math.round(consumptionTotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                          : "—"} KToE
                </div>
              </motion.div>
            </div>
          )}

          {/* Analytics: Supply vs Consumption by year */}
          {viewMode === "history" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`glass-card p-5 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
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
          ) : null}

          {/* Consumption by sector */}
          {viewMode === "history" && sectorTotals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`glass-card p-5 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
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

          {/* Sectors affected — cards + popup (data-driven sectors, status from forecast) */}
          {((viewMode === "history" && sectorsAffected.length > 0) || (viewMode === "predictions" && predictions?.sectorConsumption && predictions.sectorConsumption.length > 0)) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`space-y-4 ${viewMode === "predictions" ? "rounded-xl border border-orange-500/30 bg-orange-950/10 p-6" : ""}`}
            >
              <h3 className="text-lg font-semibold text-foreground">Sectors affected</h3>
              <p className="text-sm text-muted-foreground">
                Industries most impacted by {selectedCommodity}. Click a card for impact and solutions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(viewMode === "history" ? sectorsAffected : predictions?.sectorConsumption?.map(s => s.sector) || []).map((sectorName, index) => (
                  <motion.button
                    key={sectorName}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => setEnergySectorForModal(sectorName)}
                    className="w-full flex items-center gap-3 p-4 text-left rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 hover:border-border/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border/50 focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className="font-medium text-foreground truncate">{sectorName}</span>
                      <span
                        className={cn(
                          "text-xs font-medium w-fit rounded-full px-2 py-0.5",
                          (viewMode === "predictions" ? aiForecastData?.status : commodityForecast?.status) === "pressure" &&
                            "bg-destructive/15 text-destructive border border-destructive/30",
                          (viewMode === "predictions" ? aiForecastData?.status : commodityForecast?.status) === "surplus" &&
                            "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                          (viewMode === "predictions" ? aiForecastData?.status : commodityForecast?.status) === "stable" &&
                            "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {viewMode === "predictions" 
                          ? (aiForecastData?.status === "pressure" ? "Negative" : aiForecastData?.status === "surplus" ? "Positive" : "Neutral")
                          : energyImpactStatus.label}
                      </span>
                      {viewMode === "history" && commodityForecast && (
                        <span className="text-xs text-muted-foreground">
                          Supply/consumption: {commodityForecast.status}
                        </span>
                      )}
                      {viewMode === "predictions" && aiForecastData && (
                        <span className="text-xs text-muted-foreground">
                          Projected status: {aiForecastData.status}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          <Dialog open={!!energySectorForModal} onOpenChange={(open) => !open && setEnergySectorForModal(null)}>
            <DialogContent className={`sm:max-w-md rounded-xl border shadow-xl ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : "border-border/60 bg-card"}`} aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle className="text-left flex items-center gap-2">
                  {energySectorForModal && (
                    <>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      {energySectorForModal}
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              {energySectorForModal && selectedCommodity && (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-foreground">
                    <strong>Affected:</strong> Yes — this sector consumes {selectedCommodity}.
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Impact:</strong> {viewMode === "predictions" 
                      ? (aiForecastData?.status === "pressure" ? "Negative" : aiForecastData?.status === "surplus" ? "Positive" : "Neutral")
                      : energyImpactStatus.label}.
                  </p>
                  {viewMode === "history" && commodityForecast ? (
                    <>
                      <p className="text-sm text-foreground">
                        Current outlook: {commodityForecast.status === "pressure" ? "Pressure" : commodityForecast.status === "surplus" ? "Surplus" : "Stable"}.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supply/consumption ratio (latest): {analysis.latest?.ratio != null ? analysis.latest.ratio.toFixed(2) : "—"}
                        {commodityForecast.projectedRatio != null && (
                          <> · Projected ratio: {commodityForecast.projectedRatio.toFixed(2)}</>
                        )}
                      </p>
                    </>
                  ) : viewMode === "predictions" && aiForecastData ? (
                    <>
                      <p className="text-sm text-foreground">
                        Projected outlook: {aiForecastData.status === "pressure" ? "Pressure" : aiForecastData.status === "surplus" ? "Surplus" : "Stable"}.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Projected ratio: {aiForecastData.projectedRatio != null ? aiForecastData.projectedRatio.toFixed(2) : "—"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-foreground">
                        {viewMode === "predictions" 
                          ? "Projected outlook: Based on historical trends and AI analysis."
                          : "Current status: Historical data analysis."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {viewMode === "predictions" && aiForecastData?.projectedRatio != null
                          ? `Projected ratio: ${aiForecastData.projectedRatio.toFixed(2)}`
                          : viewMode === "predictions" && commodityForecast?.projectedRatio != null
                            ? `Projected ratio: ${commodityForecast.projectedRatio.toFixed(2)}`
                            : analysis.latest?.ratio != null
                              ? `Latest ratio: ${analysis.latest.ratio.toFixed(2)}`
                              : "Data analysis in progress."}
                      </p>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* AI Forecast Details Modal - Simple & Cool Design */}
          <Dialog open={showAIDetailsModal} onOpenChange={setShowAIDetailsModal}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-border/50 bg-background shadow-xl p-0">
              {/* Simple Header */}
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                      AI Forecast Intelligence
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground mt-0.5">{selectedCommodity}</div>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-5 space-y-4">
                {/* AI Forecast Analysis - Simple Card */}
                {predictions?.narrative && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <h3 className="text-base font-semibold text-foreground">Forecast Analysis</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {predictions.narrative}
                    </p>
                  </div>
                )}

                {/* Key Risk Factors - Simple Card */}
                {predictions?.riskFactors && predictions.riskFactors.length > 0 && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <h3 className="text-base font-semibold text-foreground">Key Risk Factors</h3>
                    </div>
                    <div className="space-y-2">
                      {predictions.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-orange-500 mt-1 shrink-0">•</span>
                          <span className="flex-1">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Recommendations - Simple Card */}
                {predictions?.recommendations && predictions.recommendations.length > 0 && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-orange-500" />
                      <h3 className="text-base font-semibold text-foreground">Actionable Recommendations</h3>
                    </div>
                    <div className="space-y-2">
                      {predictions.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-orange-500 mt-1 shrink-0">→</span>
                          <span className="flex-1">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Forecast Summary - Simple Stats Grid */}
                {aiForecastData && (
                  <div className="rounded-lg border border-border/50 bg-card/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="h-4 w-4 text-orange-500" />
                      <h3 className="text-base font-semibold text-foreground">Forecast Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Projected Year</div>
                        <div className="font-mono font-bold text-orange-500">
                          {aiForecastData.nextYear ? `${aiForecastData.nextYear}-${String((aiForecastData.nextYear + 1) % 100).padStart(2, "0")}` : "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Projected Ratio</div>
                        <div className="font-mono font-bold text-orange-500">
                          {aiForecastData.projectedRatio != null ? aiForecastData.projectedRatio.toFixed(2) : "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Projected Supply</div>
                        <div className="font-mono font-bold text-foreground">
                          {aiForecastData.projectedSupply != null ? `${Math.round(aiForecastData.projectedSupply).toLocaleString("en-IN")} KToE` : "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Projected Consumption</div>
                        <div className="font-mono font-bold text-foreground">
                          {aiForecastData.projectedConsumption != null ? `${Math.round(aiForecastData.projectedConsumption).toLocaleString("en-IN")} KToE` : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Prediction / Forecast */}
          {viewMode === "history" && commodityForecast && (
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
                    label: analysis.latest ? `Latest supply (${analysis.latest.fiscalYear})` : "Latest supply",
                    value:
                      analysis.latest?.supply != null &&
                      Number.isFinite(analysis.latest.supply)
                        ? Math.round(analysis.latest.supply).toLocaleString("en-IN")
                        : "—",
                  },
                  {
                    label: analysis.latest ? `Latest consumption (${analysis.latest.fiscalYear})` : "Latest consumption",
                    value:
                      analysis.latest?.consumption != null &&
                      Number.isFinite(analysis.latest.consumption)
                        ? Math.round(analysis.latest.consumption).toLocaleString("en-IN")
                        : "—",
                  },
                  {
                    label: analysis.latest ? `Latest balance ratio (${analysis.latest.fiscalYear})` : "Latest balance ratio",
                    value:
                      analysis.latest?.ratio != null
                        ? analysis.latest.ratio.toFixed(2)
                        : "—",
                  },
                ]}
              >
                <ForecastChart
                  data={commodityForecast.history ? commodityForecast.history.map(h => ({ x: h.x, supply: h.supply, consumption: h.consumption })) as Record<string, unknown>[] : []}
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

          {/* Prediction / Forecast Card */}
          {viewMode === "predictions" && (
            <>

              {predictionsLoading && !predictions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card p-6 space-y-4 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
                >
                  <Skeleton className="h-6 w-64" />
                  <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                  <Skeleton className="h-[224px] w-full rounded-xl" />
                </motion.div>
              )}

              {predictions && aiForecastData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-6"
                >

                  {/* Prediction Card with AI Forecasts */}
                  <PredictionCard
                    title={`AI-Powered Forecast for ${selectedCommodity}${selectedYear && selectedYear !== "ALL" ? ` (${selectedYear})` : ""}`}
                    status={
                      aiForecastData.status === "pressure"
                        ? "pressure"
                        : aiForecastData.status === "surplus"
                          ? "stable"
                          : "stable"
                    }
                    className="border-orange-500/30 bg-orange-950/10"
                    metrics={[
                      {
                        label: `Projected supply${selectedYear && selectedYear !== "ALL" ? ` (${selectedYear})` : aiForecastData.nextYear ? ` (${aiForecastData.nextYear})` : ""}`,
                        value:
                          aiForecastData.projectedSupply != null &&
                          Number.isFinite(aiForecastData.projectedSupply)
                            ? Math.round(aiForecastData.projectedSupply).toLocaleString("en-IN")
                            : "—",
                      },
                      {
                        label: `Projected consumption${selectedYear && selectedYear !== "ALL" ? ` (${selectedYear})` : aiForecastData.nextYear ? ` (${aiForecastData.nextYear})` : ""}`,
                        value:
                          aiForecastData.projectedConsumption != null &&
                          Number.isFinite(aiForecastData.projectedConsumption)
                            ? Math.round(aiForecastData.projectedConsumption).toLocaleString("en-IN")
                            : "—",
                      },
                      {
                        label: "Projected balance ratio",
                        value:
                          aiForecastData.projectedRatio != null
                            ? aiForecastData.projectedRatio.toFixed(2)
                            : "—",
                      },
                    ]}
                  >
                  </PredictionCard>

                  {/* Year-by-Year Forecast Table */}
                  {predictions.forecasts && predictions.forecasts.years && predictions.forecasts.years.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-xl border border-orange-500/30 bg-orange-950/10 p-6"
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-4">Year-by-Year Forecast</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-orange-500/20">
                              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Year</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Supply (KToE)</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Consumption (KToE)</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Balance Ratio</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Growth Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {predictions.forecasts.years.map((year, idx) => {
                              const supply = predictions.forecasts.supply[idx] ?? 0;
                              const consumption = predictions.forecasts.consumption[idx] ?? 0;
                              const ratio = consumption > 0 ? supply / consumption : 0;
                              const prevSupply = idx > 0 ? (predictions.forecasts.supply[idx - 1] ?? 0) : supply;
                              const growthRate = prevSupply > 0 ? ((supply - prevSupply) / prevSupply) * 100 : 0;
                              return (
                                <tr key={year} className="border-b border-orange-500/10 hover:bg-orange-950/20">
                                  <td className="py-2 px-3 font-medium text-foreground">{year}-{String((year + 1) % 100).padStart(2, "0")}</td>
                                  <td className="py-2 px-3 text-right font-mono text-orange-400">{Math.round(supply).toLocaleString("en-IN")}</td>
                                  <td className="py-2 px-3 text-right font-mono text-orange-400">{Math.round(consumption).toLocaleString("en-IN")}</td>
                                  <td className="py-2 px-3 text-right font-mono text-orange-400">{ratio.toFixed(2)}</td>
                                  <td className={`py-2 px-3 text-right font-mono ${growthRate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {growthRate >= 0 ? "+" : ""}{growthRate.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {/* Sector Consumption Predictions */}
                  {predictions.sectorConsumption && predictions.sectorConsumption.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="rounded-xl border border-orange-500/30 bg-orange-950/10 p-6"
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Projected Consumption by Sector {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : ""}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {predictions.sectorConsumption.map((sector, idx) => (
                          <motion.div
                            key={sector.sector}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 * idx }}
                            className="p-4 rounded-lg border border-orange-500/20 bg-orange-950/5"
                          >
                            <div className="text-sm font-medium text-foreground mb-1">{sector.sector}</div>
                            <div className="text-lg font-mono font-bold text-orange-400">
                              {Math.round(sector.consumption).toLocaleString("en-IN")} KToE
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Growth Indicators */}
                  {predictions.forecasts && predictions.forecasts.years && predictions.forecasts.years.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      {(() => {
                        const firstSupply = predictions.forecasts.supply[0] ?? 0;
                        const lastSupply = predictions.forecasts.supply[predictions.forecasts.supply.length - 1] ?? 0;
                        const firstConsumption = predictions.forecasts.consumption[0] ?? 0;
                        const lastConsumption = predictions.forecasts.consumption[predictions.forecasts.consumption.length - 1] ?? 0;
                        const supplyGrowth = firstSupply > 0 ? ((lastSupply - firstSupply) / firstSupply) * 100 : 0;
                        const consumptionGrowth = firstConsumption > 0 ? ((lastConsumption - firstConsumption) / firstConsumption) * 100 : 0;
                        const avgGrowth = (supplyGrowth + consumptionGrowth) / 2;
                        return (
                          <>
                            <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                              <div className="text-xs text-muted-foreground mb-1">Supply Growth (Projected)</div>
                              <div className={`text-2xl font-mono font-bold ${supplyGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {supplyGrowth >= 0 ? "+" : ""}{supplyGrowth.toFixed(1)}%
                              </div>
                            </div>
                            <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                              <div className="text-xs text-muted-foreground mb-1">Consumption Growth (Projected)</div>
                              <div className={`text-2xl font-mono font-bold ${consumptionGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {consumptionGrowth >= 0 ? "+" : ""}{consumptionGrowth.toFixed(1)}%
                              </div>
                            </div>
                            <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                              <div className="text-xs text-muted-foreground mb-1">Average Growth Rate</div>
                              <div className={`text-2xl font-mono font-bold ${avgGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {avgGrowth >= 0 ? "+" : ""}{avgGrowth.toFixed(1)}%
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}

                </motion.div>
              )}

              {!predictionsLoading && !predictions && !predictionsError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card p-8 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
                >
                  <p className="text-sm text-muted-foreground text-center">
                    Generating AI-powered forecasts based on historical data...
                  </p>
                </motion.div>
              )}

              {/* Fallback to regression-based forecast if AI fails */}
              {predictionsError && commodityForecast && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Alert variant="default" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Using regression-based forecast as fallback. AI predictions unavailable.
                    </AlertDescription>
                  </Alert>
                  <PredictionCard
                    title={`What's happening with ${selectedCommodity} (Regression Forecast)`}
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
                  </PredictionCard>
            </motion.div>
              )}
            </>
          )}

          {/* Supply in PetaJoules (if data exists) - History mode only */}
          {viewMode === "history" && pjByYear.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`glass-card p-5 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}
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
