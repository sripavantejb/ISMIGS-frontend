import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Flame, Wheat, Factory, Building2, ChevronRight, Info, AlertTriangle, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  AreaChart,
  Area,
} from "recharts";
import { useWPIData } from "@/hooks/useMacroData";
import {
  normalizeWpiRows,
  computeMonthlyInflation,
  computeAverageAnnualInflation,
} from "@/utils/wpiLogic";
import { detectWpiRisk } from "@/utils/riskRules";
import { FilterBar } from "@/components/FilterBar";
import { AlertBanner } from "@/components/AlertBanner";
import {
  WPI_MAJOR_GROUP_LIST,
  resolveMajorGroupFromSlug,
  majorGroupNameToSlug,
  majorGroupDisplayToApiValue,
} from "@/utils/wpiSlug";
import { WpiIntelligenceBriefing } from "@/components/WpiIntelligenceBriefing";
import { useForecast } from "@/hooks/useForecast";
import { useWPIPredictions } from "@/hooks/useWPIPredictions";
import { PredictionCard } from "@/components/PredictionCard";
import { ForecastChart } from "@/components/ForecastChart";
import { getWPIMajorGroupImpact } from "@/data/wpiMajorGroupImpact";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const tooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 22%)",
  borderRadius: "8px",
  fontFamily: "JetBrains Mono",
  fontSize: "12px",
};

const InflationWPI = () => {
  const { majorGroupSlug } = useParams<{ majorGroupSlug?: string }>();
  const navigate = useNavigate();
  const { data: wpiRaw, isLoading } = useWPIData();
  const { wpi: wpiForecast, loading: forecastLoading } = useForecast();
  const { loading: predictionsLoading, error: predictionsError, predictions, generatePredictions } = useWPIPredictions();

  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSubgroup, setSelectedSubgroup] = useState("ALL");
  const [selectedSubSubgroup, setSelectedSubSubgroup] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState("ALL");
  const [pendingYear, setPendingYear] = useState("ALL");
  const [pendingGroup, setPendingGroup] = useState("ALL");
  const [pendingSubgroup, setPendingSubgroup] = useState("ALL");
  const [pendingSubSubgroup, setPendingSubSubgroup] = useState("ALL");
  const [pendingItem, setPendingItem] = useState("ALL");
  const [wpiSectorForModal, setWpiSectorForModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"history" | "predictions">("history");
  const [showAIDetailsModal, setShowAIDetailsModal] = useState(false);

  const allRows = useMemo(
    () => (wpiRaw ? normalizeWpiRows(wpiRaw as Record<string, unknown>[]) : []),
    [wpiRaw]
  );

  const selectedMajorGroupDisplay = useMemo(
    () =>
      majorGroupSlug
        ? resolveMajorGroupFromSlug(majorGroupSlug, [...WPI_MAJOR_GROUP_LIST])
        : null,
    [majorGroupSlug]
  );

  const apiMajorGroupValue = useMemo(
    () =>
      selectedMajorGroupDisplay
        ? majorGroupDisplayToApiValue(selectedMajorGroupDisplay)
        : null,
    [selectedMajorGroupDisplay]
  );

  const majorGroupImpact = useMemo(
    () => getWPIMajorGroupImpact(selectedMajorGroupDisplay ?? null),
    [selectedMajorGroupDisplay]
  );

  useEffect(() => {
    if (majorGroupSlug && allRows.length > 0 && !selectedMajorGroupDisplay) {
      navigate("/wpi", { replace: true });
    }
  }, [majorGroupSlug, allRows.length, selectedMajorGroupDisplay, navigate]);

  useEffect(() => {
    if (!majorGroupSlug && WPI_MAJOR_GROUP_LIST.length > 0) {
      navigate(`/wpi/${majorGroupNameToSlug(WPI_MAJOR_GROUP_LIST[0])}`, { replace: true });
    }
  }, [majorGroupSlug, navigate]);

  const baseRows = useMemo(() => {
    if (!apiMajorGroupValue) return allRows;
    return allRows.filter((r) => r.majorgroup === apiMajorGroupValue);
  }, [allRows, apiMajorGroupValue]);

  const yearsOptions = useMemo(() => {
    if (viewMode === "predictions") {
      // For predictions mode, show future years (next 10 years)
      const currentYear = new Date().getFullYear();
      const futureYears: string[] = [];
      for (let i = 1; i <= 10; i++) {
        futureYears.push(String(currentYear + i));
      }
      return ["ALL", ...futureYears];
    } else {
      // For history mode, show historical years
      const set = new Set<number>();
      baseRows.forEach((r) => set.add(r.year));
      return ["ALL", ...Array.from(set).sort((a, b) => a - b).map(String)];
    }
  }, [baseRows, viewMode]);

  const groupOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => r.group && set.add(r.group));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const subgroupOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => r.subgroup && set.add(r.subgroup));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const subSubgroupOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => r.subSubgroup && set.add(r.subSubgroup));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const itemOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => r.item && set.add(r.item));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const filteredRows = useMemo(() => {
    return baseRows.filter((r) => {
      if (selectedYear !== "ALL" && String(r.year) !== selectedYear) return false;
      if (selectedGroup !== "ALL" && r.group !== selectedGroup) return false;
      if (selectedSubgroup !== "ALL" && r.subgroup !== selectedSubgroup) return false;
      if (selectedSubSubgroup !== "ALL" && r.subSubgroup !== selectedSubSubgroup) return false;
      if (selectedItem !== "ALL" && r.item !== selectedItem) return false;
      return true;
    });
  }, [
    baseRows,
    selectedYear,
    selectedGroup,
    selectedSubgroup,
    selectedSubSubgroup,
    selectedItem,
  ]);

  const monthlyInflation = useMemo(
    () => computeMonthlyInflation(filteredRows),
    [filteredRows]
  );

  const annualInflation = useMemo(
    () => computeAverageAnnualInflation(monthlyInflation),
    [monthlyInflation]
  );

  const latestMonth =
    monthlyInflation.length > 0 ? monthlyInflation[monthlyInflation.length - 1] : null;

  const wpiRisk = useMemo(
    () => detectWpiRisk(latestMonth ? latestMonth.inflationPct : undefined),
    [latestMonth]
  );

  const wpiOutlookContext = useMemo(
    () => ({
      isWpiInflation: "true" as const,
      sectorName: selectedMajorGroupDisplay ?? undefined,
      wpiMajorGroup: selectedMajorGroupDisplay ?? undefined,
      latestWpiIndex:
        latestMonth?.index != null ? String(latestMonth.index.toFixed(1)) : undefined,
      momInflationPct:
        latestMonth?.inflationPct != null
          ? String(latestMonth.inflationPct.toFixed(2))
          : undefined,
      trendDirection:
        latestMonth?.inflationPct != null
          ? latestMonth.inflationPct > 0
            ? "up"
            : latestMonth.inflationPct < 0
              ? "down"
              : "stable"
          : undefined,
    }),
    [selectedMajorGroupDisplay, latestMonth]
  );

  const wpiImpactStatus = useMemo(() => {
    const pct = latestMonth?.inflationPct;
    if (pct == null || !Number.isFinite(pct)) return { label: "Neutral", variant: "neutral" as const };
    if (pct > 6) return { label: "Negative", variant: "negative" as const };
    if (pct < 3) return { label: "Positive", variant: "positive" as const };
    return { label: "Neutral", variant: "neutral" as const };
  }, [latestMonth?.inflationPct]);

  const overallWPI = useMemo(() => {
    const filtered = baseRows.filter((r) => !r.group && !r.subgroup);
    if (selectedYear !== "ALL") {
      return filtered.filter((r) => String(r.year) === selectedYear);
    }
    return filtered;
  }, [baseRows, selectedYear]);

  const overallWPIChart = useMemo(() => {
    return overallWPI
      .map((r) => ({
        label: `${r.month?.slice(0, 3)} ${String(r.year).slice(-2)}`,
        index: r.index,
        sortKey: `${r.year}-${String(MONTH_ORDER.indexOf(r.month)).padStart(2, "0")}`,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [overallWPI]);

  const majorGroupTrend = useMemo(() => {
    const majorGroups = ["Primary articles", "Fuel & power", "Manufactured products"];
    let filtered = allRows.filter(
      (r) => majorGroups.includes(r.majorgroup || "") && !r.group && !r.subgroup && !r.item
    );
    if (selectedYear !== "ALL") {
      filtered = filtered.filter((r) => String(r.year) === selectedYear);
    }
    const byPeriod: Record<string, { label: string; sortKey: string; [k: string]: unknown }> = {};
    filtered.forEach((r) => {
      const key = `${r.year}-${String(MONTH_ORDER.indexOf(r.month)).padStart(2, "0")}`;
      const label = `${r.month?.slice(0, 3)} ${String(r.year).slice(-2)}`;
      if (!byPeriod[key]) byPeriod[key] = { label, sortKey: key };
      byPeriod[key][r.majorgroup || ""] = r.index;
    });
    return Object.values(byPeriod).sort((a, b) => (a.sortKey as string).localeCompare(b.sortKey as string));
  }, [allRows, selectedYear]);

  const handleApply = () => {
    // Clear cache when filters change to force regeneration
    if (viewMode === "predictions" && selectedMajorGroupDisplay) {
      const oldCacheKey = `wpi-predictions-${selectedMajorGroupDisplay}-${selectedYear || 'all'}`;
      sessionStorage.removeItem(oldCacheKey);
      sessionStorage.removeItem('last-wpi-prediction-data-key');
    }
    setSelectedYear(pendingYear);
    setSelectedGroup(pendingGroup);
    setSelectedSubgroup(pendingSubgroup);
    setSelectedSubSubgroup(pendingSubSubgroup);
    setSelectedItem(pendingItem);
  };

  const handleReset = () => {
    setPendingYear("ALL");
    setPendingGroup("ALL");
    setPendingSubgroup("ALL");
    setPendingSubSubgroup("ALL");
    setPendingItem("ALL");
    setSelectedYear("ALL");
    setSelectedGroup("ALL");
    setSelectedSubgroup("ALL");
    setSelectedSubSubgroup("ALL");
    setSelectedItem("ALL");
  };

  // Prepare AI forecast data for charts
  const aiForecastData = useMemo(() => {
    if (viewMode === "predictions" && predictions && predictions.forecasts && predictions.forecasts.years && predictions.forecasts.years.length > 0) {
      const history = annualInflation && annualInflation.length > 0 ? annualInflation.slice(-5).map((d) => ({
        x: d.year,
        avgInflationPct: (d as any).avgInflationPct,
        index: d.avgIndex,
      })) : [];

      // Filter future data based on selected year
      let filteredFuture = predictions.forecasts.years.map((year, idx) => ({
        x: year,
        avgInflationPct: predictions.forecasts.inflation[idx] != null ? predictions.forecasts.inflation[idx] : 0,
        index: predictions.forecasts.index[idx] != null ? predictions.forecasts.index[idx] : 0,
      }));

      // If a specific year is selected, filter to show up to that year (and a bit beyond for context)
      if (selectedYear && selectedYear !== "ALL") {
        const yearMatch = selectedYear.match(/^(\d{4})/);
        if (yearMatch) {
          const targetYear = parseInt(yearMatch[1], 10);
          // Show forecasts up to the selected year + 2 years for context
          filteredFuture = filteredFuture.filter((d) => {
            const year = typeof d.x === 'number' ? d.x : parseInt(String(d.x).split('-')[0], 10);
            return year <= targetYear + 2;
          });
        }
      }

      const future = filteredFuture;

      // Find data for selected year if a specific year is selected
      let targetYearIndex = 0;
      let targetYear: number | null = null;
      
      if (selectedYear && selectedYear !== "ALL") {
        const yearMatch = selectedYear.match(/^(\d{4})/);
        if (yearMatch) {
          targetYear = parseInt(yearMatch[1], 10);
          // Find the index in the original predictions array, not the filtered one
          const foundIndex = predictions.forecasts.years.findIndex(y => y === targetYear);
          if (foundIndex >= 0) {
            targetYearIndex = foundIndex;
          } else {
            // Find closest year in predictions
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

      const nextYear = targetYear || predictions.forecasts.years[0] || null;
      const projectedInflation = predictions.forecasts.inflation[targetYearIndex] != null ? predictions.forecasts.inflation[targetYearIndex] : 0;
      const projectedIndex = predictions.forecasts.index[targetYearIndex] != null ? predictions.forecasts.index[targetYearIndex] : 0;

      let status: "pressure" | "stable" = "stable";
      if (projectedInflation > 6) {
        status = "pressure";
      }

      return {
        nextYear,
        projectedInflation,
        projectedIndex,
        status,
        history,
        forecastLine: [...history, ...future],
      };
    }
    return null;
  }, [predictions, annualInflation, selectedYear, viewMode]);

  // Calculate latestMajor for use in hooks (must be before hooks that use it)
  const latestMajor = majorGroupTrend[majorGroupTrend.length - 1] as Record<string, number> | undefined;

  // Prepare historical data for AI predictions (must be after latestMajor is calculated, but before early returns)
  const historicalDataForAI = useMemo(() => {
    if (!selectedMajorGroupDisplay || !annualInflation || annualInflation.length === 0) return null;
    
    const historicalData = annualInflation.map((r) => ({
      year: r.year,
      index: r.avgIndex,
      inflation: (r as any).avgInflationPct,
      primaryArticles: latestMajor?.["Primary articles"] as number | undefined,
      fuelPower: latestMajor?.["Fuel & power"] as number | undefined,
    }));

    return {
      majorGroup: selectedMajorGroupDisplay,
      historicalData,
      latestIndex: latestMonth?.index,
      latestInflation: latestMonth?.inflationPct,
      latestPrimaryArticles: latestMajor?.["Primary articles"] as number | undefined,
      latestFuelPower: latestMajor?.["Fuel & power"] as number | undefined,
      selectedYear: viewMode === "predictions" ? (selectedYear !== "ALL" ? selectedYear : undefined) : undefined,
      trendDirection: wpiOutlookContext.trendDirection,
    };
  }, [selectedMajorGroupDisplay, annualInflation, latestMonth, latestMajor, selectedYear, viewMode, wpiOutlookContext]);

  // Generate predictions when switching to predictions mode or when filters change
  useEffect(() => {
    if (viewMode === "predictions" && historicalDataForAI) {
      const dataKey = JSON.stringify({
        year: selectedYear,
        majorGroup: selectedMajorGroupDisplay,
      });
      const lastDataKey = sessionStorage.getItem('last-wpi-prediction-data-key');
      
      // Force regeneration if filters changed
      if (lastDataKey !== dataKey) {
        // Clear old cache entries when filters change
        const oldDataKey = lastDataKey ? JSON.parse(lastDataKey) : null;
        if (oldDataKey && selectedMajorGroupDisplay) {
          // Clear cache for old filters
          const oldCacheKey = `wpi-predictions-${selectedMajorGroupDisplay}-${oldDataKey.year || 'all'}`;
          sessionStorage.removeItem(oldCacheKey);
        }
        
        sessionStorage.setItem('last-wpi-prediction-data-key', dataKey);
        // Always regenerate when filters change
        generatePredictions(historicalDataForAI);
      }
    } else if (viewMode === "history") {
      sessionStorage.removeItem('last-wpi-prediction-data-key');
    }
  }, [viewMode, selectedYear, selectedMajorGroupDisplay, historicalDataForAI, generatePredictions]);

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-[340px] w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[260px] w-full rounded-xl" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculate derived values (after early returns, these are not hooks)
  const latestWPI = overallWPIChart[overallWPIChart.length - 1];
  const prevWPI = overallWPIChart.length > 1 ? overallWPIChart[overallWPIChart.length - 2] : null;
  const wpiChange =
    latestWPI && prevWPI ? ((latestWPI.index - prevWPI.index) / prevWPI.index) * 100 : null;

  if (!selectedMajorGroupDisplay) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wholesale Price Index (WPI)</h1>
          <p className="text-sm text-muted-foreground">Inflation trends based on MoSPI WPI records</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 space-y-4"
        >
          <p className="text-base text-foreground text-center">
            Choose a major group from the left sidebar (Overall, Primary articles, Fuel & power, Manufactured products) to see inflation trends and intelligence briefing.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {WPI_MAJOR_GROUP_LIST.map((name) => (
              <Link
                key={name}
                to={`/wpi/${majorGroupNameToSlug(name)}`}
                className="text-sm text-primary hover:underline font-medium"
              >
                {name}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 space-y-6 ${viewMode === "predictions" ? "bg-gradient-to-br from-orange-950/20 via-background to-orange-900/10" : ""}`}>
      {/* Toggle in top-right header area */}
      {selectedMajorGroupDisplay && (
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
          <h1 className="text-2xl font-bold text-foreground">Inflation (WPI)</h1>
          <p className="text-sm text-muted-foreground">Wholesale price inflation by category. Select from the sidebar.</p>
        </div>
      </div>

      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/wpi" className="text-muted-foreground hover:text-foreground transition-colors">
          Inflation (WPI)
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{selectedMajorGroupDisplay}</span>
      </nav>

      {/* WPI Intelligence - Only in predictions mode with Know More button - FIRST */}
      {viewMode === "predictions" && selectedMajorGroupDisplay && (
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
                <h3 className="text-lg font-semibold text-foreground">WPI Intelligence</h3>
                <p className="text-xs text-muted-foreground">AI-powered insights and forecasts</p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowAIDetailsModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 transition-all duration-200 font-medium text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Know More
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            {predictionsLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex gap-4 mt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </>
            ) : predictionsError ? (
              <p className="text-destructive">Error: {predictionsError}</p>
            ) : predictions ? (
              <>
                <p className="line-clamp-2">
                  {predictions.narrative.split('\n')[0]}
                </p>
                <div className="flex items-center gap-4 text-xs mt-2">
                  {predictions.riskFactors && predictions.riskFactors.length > 0 && (
                    <span>
                      <span className="font-semibold text-orange-400">Risks:</span> {predictions.riskFactors.length}
                    </span>
                  )}
                  {predictions.recommendations && predictions.recommendations.length > 0 && (
                    <span>
                      <span className="font-semibold text-orange-400">Recommendations:</span> {predictions.recommendations.length}
                    </span>
                  )}
                </div>
              </>
            ) : wpiForecast ? (
              <>
                <p className="line-clamp-2">
                  Projected average WPI inflation ({wpiForecast.nextYear}): {wpiForecast.projectedInflation != null ? `${wpiForecast.projectedInflation.toFixed(2)}%` : "—"}
                </p>
                {wpiOutlookContext && (
                  <p className="line-clamp-1 text-xs">
                    <span className="font-semibold text-orange-400">Trend:</span> {wpiOutlookContext.trendDirection || "stable"}
                  </p>
                )}
              </>
            ) : (
              <p>Forecast data will appear here once available.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Filters - AFTER Intelligence in prediction mode */}
      {viewMode === "predictions" && (
        <FilterBar
          filters={[
            { label: "Year", value: pendingYear, onChange: setPendingYear, options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })) },
            { label: "Group", value: pendingGroup, onChange: setPendingGroup, options: groupOptions.map((g) => ({ value: g, label: g === "ALL" ? "All groups" : g })) },
            { label: "Subgroup", value: pendingSubgroup, onChange: setPendingSubgroup, options: subgroupOptions.map((s) => ({ value: s, label: s === "ALL" ? "All subgroups" : s })) },
            { label: "Sub-subgroup", value: pendingSubSubgroup, onChange: setPendingSubSubgroup, options: subSubgroupOptions.map((s) => ({ value: s, label: s === "ALL" ? "All sub-subgroups" : s })) },
            { label: "Item", value: pendingItem, onChange: setPendingItem, options: itemOptions.map((i) => ({ value: i, label: i === "ALL" ? "All items" : i })) },
          ]}
          onApply={handleApply}
          onReset={handleReset}
          applyButtonClassName="bg-orange-500/70 hover:bg-orange-500 text-white"
        />
      )}

      {viewMode === "history" && selectedMajorGroupDisplay && majorGroupImpact.sectorsAffected.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-foreground">Sectors affected</h2>
          <p className="text-sm text-muted-foreground">
            Click a card for impact and solutions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {majorGroupImpact.sectorsAffected.map((sectorName, index) => (
              <motion.button
                key={sectorName}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => setWpiSectorForModal(sectorName)}
                className="w-full flex items-center gap-3 p-4 text-left rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 hover:border-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="font-medium text-foreground truncate">{sectorName}</span>
                  <span
                    className={cn(
                      "text-xs font-medium w-fit rounded-full px-2 py-0.5",
                      wpiImpactStatus.variant === "negative" &&
                        "bg-destructive/15 text-destructive border border-destructive/30",
                      wpiImpactStatus.variant === "positive" &&
                        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                      wpiImpactStatus.variant === "neutral" &&
                        "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {wpiImpactStatus.label}
                  </span>
                  {latestMonth?.inflationPct != null && (
                    <span className="text-xs text-muted-foreground">
                      MoM inflation: {latestMonth.inflationPct.toFixed(2)}%
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      <Dialog open={!!wpiSectorForModal} onOpenChange={(open) => !open && setWpiSectorForModal(null)}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border/60 bg-card shadow-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              {wpiSectorForModal && (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  {wpiSectorForModal}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {wpiSectorForModal && selectedMajorGroupDisplay && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-foreground">
                <strong>Affected:</strong> Yes — this sector is linked to WPI major group {selectedMajorGroupDisplay}.
              </p>
              <p className="text-sm text-foreground">
                <strong>Impact:</strong> {wpiImpactStatus.label}.
              </p>
              <p className="text-sm text-foreground">
                Major group {selectedMajorGroupDisplay} inflation (latest):{" "}
                {latestMonth?.inflationPct != null ? `${latestMonth.inflationPct.toFixed(2)}%` : "—"} MoM.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters - For history mode */}
      {viewMode === "history" && (
        <FilterBar
          filters={[
            { label: "Year", value: pendingYear, onChange: setPendingYear, options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })) },
            { label: "Group", value: pendingGroup, onChange: setPendingGroup, options: groupOptions.map((g) => ({ value: g, label: g === "ALL" ? "All groups" : g })) },
            { label: "Subgroup", value: pendingSubgroup, onChange: setPendingSubgroup, options: subgroupOptions.map((s) => ({ value: s, label: s === "ALL" ? "All subgroups" : s })) },
            { label: "Sub-subgroup", value: pendingSubSubgroup, onChange: setPendingSubSubgroup, options: subSubgroupOptions.map((s) => ({ value: s, label: s === "ALL" ? "All sub-subgroups" : s })) },
            { label: "Item", value: pendingItem, onChange: setPendingItem, options: itemOptions.map((i) => ({ value: i, label: i === "ALL" ? "All items" : i })) },
          ]}
          onApply={handleApply}
          onReset={handleReset}
        />
      )}

      {viewMode === "history" && wpiRisk && <AlertBanner level={wpiRisk.type} title={wpiRisk.title} message={wpiRisk.message} />}

      {viewMode === "history" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIBox icon={<TrendingUp className="w-4 h-4" />} label="WPI Index" value={latestWPI?.index} change={wpiChange} />
        <KPIBox icon={<Wheat className="w-4 h-4" />} label="Primary Articles" value={latestMajor?.["Primary articles"]} />
        <KPIBox icon={<Flame className="w-4 h-4" />} label="Fuel & Power" value={latestMajor?.["Fuel & power"]} />
        <KPIBox icon={<Factory className="w-4 h-4" />} label="Manufactured" value={latestMajor?.["Manufactured products"]} />
        </div>
      )}

      {/* Historical charts - only in history mode */}
      {viewMode === "history" && (
        <div className="flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`glass-card p-5 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">{viewMode === "predictions" ? "WPI Index Forecast" : "Monthly WPI Index"}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="periodLabel" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" interval={Math.max(0, Math.floor(filteredRows.length / 12))} angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="index" stroke="hsl(187 92% 50%)" strokeWidth={2} name="WPI index" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`glass-card p-5 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">{viewMode === "predictions" ? "Inflation Forecast (MoM %)" : "Monthly Inflation (MoM %)"}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyInflation}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="periodLabel" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" interval={Math.max(0, Math.floor(monthlyInflation.length / 12))} angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="inflationPct" stroke="hsl(0 72% 55%)" strokeWidth={2} name="MoM inflation (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        </div>
      )}

      {/* Additional charts - only in history mode */}
      {viewMode === "history" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Average Annual Inflation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualInflation}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgInflationPct" fill="hsl(38 92% 55%)" name="Avg inflation (%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Latest Snapshot</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Latest period</div>
              <div className="font-mono font-bold">{latestMonth ? `${latestMonth.month} ${latestMonth.year}` : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">WPI index</div>
              <div className="font-mono font-bold">{latestMonth ? latestMonth.index.toFixed(1) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">MoM inflation</div>
              <div className="font-mono font-bold">{latestMonth ? `${latestMonth.inflationPct.toFixed(2)} %` : "—"}</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">WPI Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overallWPIChart}>
                <defs>
                  <linearGradient id="wpiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38 92% 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38 92% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="label" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" interval={selectedYear === "ALL" ? 3 : 0} angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="index" stroke="hsl(38 92% 55%)" fill="url(#wpiGrad)" strokeWidth={2} name="WPI Index" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Major Groups</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={majorGroupTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="label" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" interval={selectedYear === "ALL" ? 3 : 0} angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="Primary articles" stroke="hsl(160 84% 45%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Fuel & power" stroke="hsl(0 72% 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Manufactured products" stroke="hsl(187 92% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        </div>
      )}

      {/* AI Forecast Details Modal */}
      <Dialog open={showAIDetailsModal} onOpenChange={setShowAIDetailsModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-border/50 bg-background shadow-xl p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  WPI Forecast Intelligence
                </DialogTitle>
                <div className="text-sm text-muted-foreground mt-0.5">{selectedMajorGroupDisplay}</div>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-5 space-y-4">
            {/* AI Forecast Analysis */}
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

            {/* Key Risk Factors */}
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

            {/* Actionable Recommendations */}
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

            {/* Forecast Summary */}
            {(aiForecastData || wpiForecast) && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-orange-500" />
                  <h3 className="text-base font-semibold text-foreground">Forecast Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Year</div>
                    <div className="font-mono font-bold text-orange-500">
                      {selectedYear && selectedYear !== "ALL" ? selectedYear : aiForecastData?.nextYear || wpiForecast?.nextYear || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Inflation</div>
                    <div className="font-mono font-bold text-orange-500">
                      {aiForecastData?.projectedInflation != null ? `${aiForecastData.projectedInflation.toFixed(2)}%` : wpiForecast?.projectedInflation != null ? `${wpiForecast.projectedInflation.toFixed(2)}%` : "—"}
                    </div>
                  </div>
                  {predictions?.kpis && (
                    <>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Projected Index</div>
                        <div className="font-mono font-bold text-foreground">
                          {aiForecastData?.projectedIndex != null ? aiForecastData.projectedIndex.toFixed(1) : "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Primary Articles</div>
                        <div className="font-mono font-bold text-foreground">
                          {predictions.kpis.primaryArticles != null ? predictions.kpis.primaryArticles.toFixed(1) : "—"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Prediction KPIs - Only in predictions mode */}
      {viewMode === "predictions" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 border-orange-500/30 bg-orange-950/10"
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              WPI Index {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : wpiForecast?.nextYear ? `(${wpiForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {aiForecastData?.projectedIndex != null && Number.isFinite(aiForecastData.projectedIndex)
                ? aiForecastData.projectedIndex.toFixed(1)
                : wpiForecast?.projectedIndex != null && Number.isFinite(wpiForecast.projectedIndex)
                  ? wpiForecast.projectedIndex.toFixed(1)
                  : latestWPI?.index != null
                    ? latestWPI.index.toFixed(1)
                    : "—"}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-4 border-orange-500/30 bg-orange-950/10"
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Inflation {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : wpiForecast?.nextYear ? `(${wpiForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {aiForecastData?.projectedInflation != null && Number.isFinite(aiForecastData.projectedInflation)
                ? `${aiForecastData.projectedInflation.toFixed(2)}%`
                : wpiForecast?.projectedInflation != null && Number.isFinite(wpiForecast.projectedInflation)
                  ? `${wpiForecast.projectedInflation.toFixed(2)}%`
                  : "—"}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 border-orange-500/30 bg-orange-950/10"
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Primary Articles {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : wpiForecast?.nextYear ? `(${wpiForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {predictions?.kpis?.primaryArticles != null && Number.isFinite(predictions.kpis.primaryArticles)
                ? predictions.kpis.primaryArticles.toFixed(1)
                : latestMajor?.["Primary articles"] != null
                  ? latestMajor["Primary articles"].toFixed(1)
                  : "—"}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 border-orange-500/30 bg-orange-950/10"
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Fuel & Power {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : wpiForecast?.nextYear ? `(${wpiForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {predictions?.kpis?.fuelPower != null && Number.isFinite(predictions.kpis.fuelPower)
                ? predictions.kpis.fuelPower.toFixed(1)
                : latestMajor?.["Fuel & power"] != null
                  ? latestMajor["Fuel & power"].toFixed(1)
                  : "—"}
            </div>
          </motion.div>
        </div>
      )}


      {/* Sectors affected — Only in predictions mode */}
      {viewMode === "predictions" && selectedMajorGroupDisplay && majorGroupImpact.sectorsAffected.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 rounded-xl border border-orange-500/30 bg-orange-950/10 p-6"
        >
          <h3 className="text-lg font-semibold text-foreground">Sectors affected</h3>
          <p className="text-sm text-muted-foreground">
            Industries most impacted by {selectedMajorGroupDisplay}. Click a card for impact and solutions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {majorGroupImpact.sectorsAffected.map((sectorName, index) => (
              <motion.button
                key={sectorName}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => setWpiSectorForModal(sectorName)}
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
                      wpiImpactStatus.variant === "negative" &&
                        "bg-destructive/15 text-destructive border border-destructive/30",
                      wpiImpactStatus.variant === "positive" &&
                        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                      wpiImpactStatus.variant === "neutral" &&
                        "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {wpiImpactStatus.label}
                  </span>
                  {wpiForecast && (
                    <span className="text-xs text-muted-foreground">
                      Projected status: {wpiForecast.status === "pressure" ? "pressure" : "stable"}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* AI-Powered Forecast Card - Only in predictions mode */}
      {viewMode === "predictions" && (aiForecastData || wpiForecast) && (aiForecastData?.forecastLine || wpiForecast?.forecastLine) && (aiForecastData?.forecastLine?.length ?? wpiForecast?.forecastLine?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <PredictionCard
            title={`AI-Powered Forecast for WPI Inflation${selectedYear && selectedYear !== "ALL" ? ` (${selectedYear})` : aiForecastData?.nextYear ? ` (${aiForecastData.nextYear})` : wpiForecast?.nextYear ? ` (${wpiForecast.nextYear})` : ""}`}
            status={(aiForecastData || wpiForecast)?.status === "pressure" ? "pressure" : "stable"}
            className="border-orange-500/30 bg-orange-950/10"
            metrics={[
              {
                label: `Projected average WPI inflation${selectedYear && selectedYear !== "ALL" ? ` (${selectedYear})` : aiForecastData?.nextYear ? ` (${aiForecastData.nextYear})` : wpiForecast?.nextYear ? ` (${wpiForecast.nextYear})` : ""}`,
                value:
                  aiForecastData?.projectedInflation != null && Number.isFinite(aiForecastData.projectedInflation)
                    ? `${aiForecastData.projectedInflation.toFixed(2)}%`
                    : wpiForecast?.projectedInflation != null && Number.isFinite(wpiForecast.projectedInflation)
                      ? `${wpiForecast.projectedInflation.toFixed(2)}%`
                      : "—",
              },
              {
                label: `Projected WPI index${selectedYear && selectedYear !== "ALL" ? ` (${selectedYear})` : aiForecastData?.nextYear ? ` (${aiForecastData.nextYear})` : wpiForecast?.nextYear ? ` (${wpiForecast.nextYear})` : ""}`,
                value:
                  aiForecastData?.projectedIndex != null && Number.isFinite(aiForecastData.projectedIndex)
                    ? aiForecastData.projectedIndex.toFixed(1)
                    : wpiForecast?.projectedIndex != null && Number.isFinite(wpiForecast.projectedIndex)
                      ? wpiForecast.projectedIndex.toFixed(1)
                      : latestWPI?.index != null
                        ? latestWPI.index.toFixed(1)
                        : "—",
              },
            ]}
          >
          </PredictionCard>

          {/* Year-by-Year Forecast Table */}
          {predictions && predictions.forecasts && predictions.forecasts.years && predictions.forecasts.years.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-orange-500/30 bg-orange-950/10 p-6 mt-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Year-by-Year Forecast</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-500/20">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Year</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">WPI Index</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Inflation (%)</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Index Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.forecasts.years.map((year, idx) => {
                      const index = predictions.forecasts.index[idx] ?? 0;
                      const inflation = predictions.forecasts.inflation[idx] ?? 0;
                      const prevIndex = idx > 0 ? (predictions.forecasts.index[idx - 1] ?? index) : index;
                      const indexGrowth = prevIndex > 0 ? ((index - prevIndex) / prevIndex) * 100 : 0;
                      return (
                        <tr key={year} className="border-b border-orange-500/10 hover:bg-orange-950/20">
                          <td className="py-2 px-3 font-medium text-foreground">{year}</td>
                          <td className="py-2 px-3 text-right font-mono text-orange-400">{index.toFixed(1)}</td>
                          <td className={`py-2 px-3 text-right font-mono ${inflation >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {inflation >= 0 ? "+" : ""}{inflation.toFixed(2)}%
                          </td>
                          <td className={`py-2 px-3 text-right font-mono ${indexGrowth >= 0 ? "text-orange-400" : "text-red-400"}`}>
                            {indexGrowth >= 0 ? "+" : ""}{indexGrowth.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Growth Indicators */}
          {predictions && predictions.forecasts && predictions.forecasts.years && predictions.forecasts.years.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
            >
              {(() => {
                const firstInflation = predictions.forecasts.inflation[0] ?? 0;
                const lastInflation = predictions.forecasts.inflation[predictions.forecasts.inflation.length - 1] ?? 0;
                const firstIndex = predictions.forecasts.index[0] ?? 0;
                const lastIndex = predictions.forecasts.index[predictions.forecasts.index.length - 1] ?? 0;
                const inflationChange = lastInflation - firstInflation;
                const indexGrowth = firstIndex > 0 ? ((lastIndex - firstIndex) / firstIndex) * 100 : 0;
                return (
                  <>
                    <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                      <div className="text-xs text-muted-foreground mb-1">Inflation Trend</div>
                      <div className={`text-2xl font-mono font-bold ${inflationChange >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {inflationChange >= 0 ? "+" : ""}{inflationChange.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Change over period</div>
                    </div>
                    <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                      <div className="text-xs text-muted-foreground mb-1">Index Growth (Projected)</div>
                      <div className={`text-2xl font-mono font-bold ${indexGrowth >= 0 ? "text-orange-400" : "text-red-400"}`}>
                        {indexGrowth >= 0 ? "+" : ""}{indexGrowth.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Total growth over period</div>
                    </div>
                    <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                      <div className="text-xs text-muted-foreground mb-1">Average Inflation</div>
                      <div className="text-2xl font-mono font-bold text-orange-400">
                        {predictions.forecasts.inflation.reduce((sum, val) => sum + (val ?? 0), 0) / predictions.forecasts.inflation.length >= 0 ? "+" : ""}
                        {(predictions.forecasts.inflation.reduce((sum, val) => sum + (val ?? 0), 0) / predictions.forecasts.inflation.length).toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Period average</div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </motion.div>
      )}

      {viewMode === "history" && (
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground font-mono">
            WPI records loaded: {wpiRaw?.length ?? "loading…"} · Filtered: {filteredRows.length}
          </p>
        </div>
      )}
    </div>
  );
};

function KPIBox({ icon, label, value, change }: { icon: React.ReactNode; label: string; value?: number; change?: number | null }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">
        {value != null ? value.toFixed(1) : "—"}
      </div>
      {change != null && (
        <span className={`flex items-center gap-0.5 text-xs font-mono mt-1 ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change >= 0 ? "+" : ""}{change.toFixed(2)}% MoM
        </span>
      )}
    </motion.div>
  );
}

export default InflationWPI;
