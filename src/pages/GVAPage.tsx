import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Lightbulb, Users, AlertCircle, Sparkles, ChevronDown, ChevronUp, Building2, TrendingUp, ChevronRight, Info, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useGVAImpact, type GVAAffectedSector } from "@/hooks/useGVAImpact";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { useGVADetailed } from "@/hooks/useMacroData";
import { useGVAPredictions } from "@/hooks/useGVAPredictions";
import { normalizeGvaRows, aggregateGvaByYear } from "@/utils/gvaLogic";
import { resolveGvaIndustryFromSlug, gvaIndustryToSlug } from "@/utils/gvaSlug";
import { useGVAIndustryList } from "@/hooks/useGVAIndustryList";
import { FilterBar } from "@/components/FilterBar";
import { GVAIndustryHero } from "@/components/GVAIndustryHero";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 22%)",
  borderRadius: "8px",
  fontFamily: "JetBrains Mono",
  fontSize: "12px",
};

const GVAPage = () => {
  const { industrySlug } = useParams<{ industrySlug?: string }>();
  const navigate = useNavigate();
  const industryList = useGVAIndustryList();

  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedSubindustry, setSelectedSubindustry] = useState("ALL");
  const [selectedInstitution, setSelectedInstitution] = useState("ALL");
  const [pendingYear, setPendingYear] = useState("ALL");
  const [pendingSubindustry, setPendingSubindustry] = useState("ALL");
  const [pendingInstitution, setPendingInstitution] = useState("ALL");
  const [viewMode, setViewMode] = useState<"history" | "predictions">("history");

  const { data: raw, isLoading } = useGVADetailed();
  const { loading: predictionsLoading, error: predictionsError, predictions, generatePredictions } = useGVAPredictions();

  const allRows = useMemo(
    () => (raw ? normalizeGvaRows(raw as Record<string, unknown>[]) : []),
    [raw]
  );

  const selectedIndustry = useMemo(
    () => (industrySlug ? resolveGvaIndustryFromSlug(industrySlug, industryList) : null),
    [industrySlug, industryList]
  );

  useEffect(() => {
    if (industrySlug && industryList.length > 0 && !selectedIndustry) {
      navigate("/gva", { replace: true });
    }
  }, [industrySlug, industryList, selectedIndustry, navigate]);

  useEffect(() => {
    if (!industrySlug && industryList.length > 0 && !isLoading) {
      navigate(`/gva/${gvaIndustryToSlug(industryList[0])}`, { replace: true });
    }
  }, [industrySlug, industryList, isLoading, navigate]);

  const baseRows = useMemo(() => {
    if (!selectedIndustry) return allRows;
    return allRows.filter((r) => r.industry === selectedIndustry);
  }, [allRows, selectedIndustry]);

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
      baseRows.forEach((r) => set.add(r.fiscalYear));
      return ["ALL", ...Array.from(set).sort()];
    }
  }, [baseRows, viewMode]);

  const subindustryOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => r.subindustry && set.add(r.subindustry));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const institutionOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => r.institutionalSector && set.add(r.institutionalSector));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const filteredRows = useMemo(() => {
    return baseRows.filter((r) => {
      if (selectedYear !== "ALL" && r.fiscalYear !== selectedYear) return false;
      if (selectedSubindustry !== "ALL" && r.subindustry !== selectedSubindustry) return false;
      if (selectedInstitution !== "ALL" && r.institutionalSector !== selectedInstitution) return false;
      return true;
    });
  }, [baseRows, selectedYear, selectedSubindustry, selectedInstitution]);

  const byYearTotals = useMemo(() => aggregateGvaByYear(filteredRows), [filteredRows]);

  const byIndustryTotals = useMemo(() => {
    const byInd = new Map<string, number>();
    filteredRows.forEach((r) => {
      const key = r.subindustry || r.industry || "Other";
      byInd.set(key, (byInd.get(key) || 0) + r.currentPrice);
    });
    return Array.from(byInd.entries()).map(([name, total]) => ({
      name: name.length > 28 ? name.slice(0, 25) + "…" : name,
      total,
    }));
  }, [filteredRows]);

  const latest = byYearTotals.length > 0 ? byYearTotals[byYearTotals.length - 1] : null;

  const trendData = useMemo(() => {
    const slice = byYearTotals.slice(-3);
    return slice.map((y) => ({ fiscalYear: y.fiscalYear, totalCurrent: y.totalCurrent }));
  }, [byYearTotals]);

  const [showFullBriefing, setShowFullBriefing] = useState(false);
  const [sectorForModal, setSectorForModal] = useState<GVAAffectedSector | null>(null);
  const [showAIDetailsModal, setShowAIDetailsModal] = useState(false);
  const [gvaSectorForModal, setGvaSectorForModal] = useState<{ sector: string; impact: string; reason: string } | null>(null);

  const { data: impactContent, loading: impactLoading, error: impactError } = useGVAImpact(
    selectedIndustry ?? null,
    latest?.fiscalYear,
    trendData
  );

  const handleApply = () => {
    // Clear cache when filters change to force regeneration
    if (viewMode === "predictions" && selectedIndustry) {
      const oldCacheKey = `gva-predictions-${selectedIndustry}-${selectedYear || 'all'}`;
      sessionStorage.removeItem(oldCacheKey);
      sessionStorage.removeItem('last-gva-prediction-data-key');
    }
    setSelectedYear(pendingYear);
    setSelectedSubindustry(pendingSubindustry);
    setSelectedInstitution(pendingInstitution);
  };
  const handleReset = () => {
    setPendingYear("ALL");
    setPendingSubindustry("ALL");
    setPendingInstitution("ALL");
    setSelectedYear("ALL");
    setSelectedSubindustry("ALL");
    setSelectedInstitution("ALL");
  };

  // Prepare historical data for AI predictions
  const historicalDataForAI = useMemo(() => {
    if (!selectedIndustry || !byYearTotals || byYearTotals.length === 0) return null;
    
    const historicalData = byYearTotals.map((r) => ({
      fiscalYear: r.fiscalYear,
      currentPrice: r.totalCurrent,
      constantPrice: r.totalConstant,
      growthRate: r.growthRate,
    }));

    return {
      industry: selectedIndustry,
      historicalData,
      latestCurrentPrice: latest?.totalCurrent,
      latestConstantPrice: latest?.totalConstant,
      latestGrowthRate: latest?.growthRate,
      selectedYear: viewMode === "predictions" ? (selectedYear !== "ALL" ? selectedYear : undefined) : undefined,
      trendDirection: impactContent?.trendDirection,
    };
  }, [selectedIndustry, byYearTotals, latest, selectedYear, viewMode, impactContent]);

  // Generate predictions when switching to predictions mode or when filters change
  useEffect(() => {
    if (viewMode === "predictions" && historicalDataForAI) {
      const dataKey = JSON.stringify({
        year: selectedYear,
        industry: selectedIndustry,
      });
      const lastDataKey = sessionStorage.getItem('last-gva-prediction-data-key');
      
      // Force regeneration if filters changed
      if (lastDataKey !== dataKey) {
        // Clear old cache entries when filters change
        const oldDataKey = lastDataKey ? JSON.parse(lastDataKey) : null;
        if (oldDataKey && selectedIndustry) {
          // Clear cache for old filters
          const oldCacheKey = `gva-predictions-${selectedIndustry}-${oldDataKey.year || 'all'}`;
          sessionStorage.removeItem(oldCacheKey);
        }
        
        sessionStorage.setItem('last-gva-prediction-data-key', dataKey);
        // Always regenerate when filters change
        generatePredictions(historicalDataForAI);
      }
    } else if (viewMode === "history") {
      sessionStorage.removeItem('last-gva-prediction-data-key');
    }
  }, [viewMode, selectedYear, selectedIndustry, historicalDataForAI, generatePredictions]);

  // Prepare AI forecast data for charts
  const aiForecastData = useMemo(() => {
    if (viewMode === "predictions" && predictions && predictions.forecasts && predictions.forecasts.years && predictions.forecasts.years.length > 0) {
      const history = byYearTotals && byYearTotals.length > 0 ? byYearTotals.slice(-5).map((d) => ({
        x: d.fiscalYear,
        currentPrice: d.totalCurrent,
        constantPrice: d.totalConstant,
        growthRate: d.growthRate,
      })) : [];

      // Create future data from predictions
      const future = predictions.forecasts.years.map((year, idx) => ({
        x: year,
        currentPrice: predictions.forecasts.currentPrice[idx] != null ? predictions.forecasts.currentPrice[idx] : 0,
        constantPrice: predictions.forecasts.constantPrice[idx] != null ? predictions.forecasts.constantPrice[idx] : 0,
        growthRate: predictions.forecasts.growthRate[idx] != null ? predictions.forecasts.growthRate[idx] : 0,
      }));

      // Find data for selected year if a specific year is selected
      let targetYearIndex = 0;
      let targetYear: number | null = null;
      
      if (selectedYear && selectedYear !== "ALL") {
        const yearMatch = selectedYear.match(/^(\d{4})/);
        if (yearMatch) {
          targetYear = parseInt(yearMatch[1], 10);
          // Find exact match first
          const foundIndex = predictions.forecasts.years.findIndex(y => y === targetYear);
          if (foundIndex >= 0) {
            targetYearIndex = foundIndex;
          } else {
            // If exact year not found, find the closest year that's <= targetYear
            // This ensures we show data for the selected year or the closest previous year
            let closestIndex = -1;
            let closestYear = -1;
            predictions.forecasts.years.forEach((year, idx) => {
              if (year <= targetYear && (closestYear === -1 || year > closestYear)) {
                closestYear = year;
                closestIndex = idx;
              }
            });
            if (closestIndex >= 0) {
              targetYearIndex = closestIndex;
              targetYear = closestYear;
            } else {
              // Fallback to first year if no year <= targetYear found
              targetYearIndex = 0;
              targetYear = predictions.forecasts.years[0];
            }
          }
        }
      } else {
        // If no specific year selected, use the first forecast year
        targetYear = predictions.forecasts.years[0] || null;
        targetYearIndex = 0;
      }

      const nextYear = targetYear || predictions.forecasts.years[0] || null;
      const projectedCurrentPrice = predictions.forecasts.currentPrice[targetYearIndex] != null ? predictions.forecasts.currentPrice[targetYearIndex] : 0;
      const projectedConstantPrice = predictions.forecasts.constantPrice[targetYearIndex] != null ? predictions.forecasts.constantPrice[targetYearIndex] : 0;
      const projectedGrowthRate = predictions.forecasts.growthRate[targetYearIndex] != null ? predictions.forecasts.growthRate[targetYearIndex] : 0;

      // Don't filter here - include ALL future data from predictions
      // The chart will filter based on selected year when rendering
      // This ensures all prediction data (including years up to 2034+) is available
      return {
        nextYear,
        projectedCurrentPrice,
        projectedConstantPrice,
        projectedGrowthRate,
        history,
        forecastLine: [...history, ...future],
      };
    }
    return null;
  }, [predictions, byYearTotals, selectedYear, viewMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!raw || raw.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-2xl font-bold text-foreground">Gross Value Added (GVA)</h1>
        <p className="text-muted-foreground mt-2">Failed to load GVA data. The detailed NAS API may be unavailable.</p>
      </div>
    );
  }

  if (!selectedIndustry) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gross Value Added (GVA)</h1>
          <p className="text-sm text-muted-foreground">Industry-wise GVA at current and constant prices, MoSPI NAS</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 space-y-4"
        >
          <p className="text-base text-foreground text-center">
            Choose an industry from the left sidebar to see GVA trends, who is affected by changes, and what solutions to follow.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {industryList.map((name) => (
              <Link
                key={name}
                to={`/gva/${gvaIndustryToSlug(name)}`}
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
      {selectedIndustry && (
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
          <h1 className="text-2xl font-bold text-foreground">GVA</h1>
          <p className="text-sm text-muted-foreground">
            Industry-wise contribution to GDP. Select an industry to see trends and impact.
          </p>
        </div>
      </div>

      <GVAIndustryHero
        industryName={selectedIndustry}
        industryAffectsGvaShort={impactContent?.industryAffectsGvaShort}
      />

      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/gva" className="text-muted-foreground hover:text-foreground transition-colors">
          GVA
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{selectedIndustry}</span>
      </nav>

      {/* GVA Intelligence - Only in predictions mode with Know More button - FIRST */}
      {viewMode === "predictions" && selectedIndustry && (
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
                <h3 className="text-xl font-bold text-foreground">GVA Intelligence</h3>
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
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            {predictionsLoading ? (
              <p>Generating AI predictions...</p>
            ) : predictionsError ? (
              <p className="text-red-400">Error: {predictionsError}</p>
            ) : predictions ? (
              <>
                <p className="text-foreground">
                  {predictions.narrative || 'Forecast data will appear here once available.'}
                </p>
                {predictions.riskFactors && predictions.riskFactors.length > 0 && (
                  <ul className="list-none space-y-1.5 pl-0">
                    {predictions.riskFactors.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="text-orange-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {predictions.recommendations && predictions.recommendations.length > 0 && (
                  <ul className="list-none space-y-1.5 pl-0">
                    {predictions.recommendations.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="text-orange-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
            { label: "Subindustry", value: pendingSubindustry, onChange: setPendingSubindustry, options: subindustryOptions.map((s) => ({ value: s, label: s === "ALL" ? "All subindustries" : s })) },
            { label: "Institution", value: pendingInstitution, onChange: setPendingInstitution, options: institutionOptions.map((s) => ({ value: s || "ALL", label: s === "ALL" || !s ? "All sectors" : s })) },
          ]}
          onApply={handleApply}
          onReset={handleReset}
          applyButtonClassName="bg-orange-500/70 hover:bg-orange-500 text-white"
        />
      )}

      {/* GVA Intelligence — Only in history mode */}
      {viewMode === "history" && impactLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border/60 bg-card/30 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-4 shrink-0 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </motion.div>
      )}

      {impactError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            Could not load GVA intelligence
          </h2>
          <p className="text-sm text-muted-foreground">{impactError}</p>
        </motion.div>
      )}

      {viewMode === "history" && !impactLoading && !impactError && impactContent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/60 bg-card/30 p-5"
        >
          <h2 className="text-xl font-bold text-foreground mb-3">GVA Intelligence</h2>
          {impactContent.trendSummary && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{impactContent.trendSummary}</p>
          )}
          {impactContent.hookPoints.length > 0 && (
            <ul className="list-none space-y-1.5 pl-0 mb-4">
              {impactContent.hookPoints.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {(impactContent.whoIsAffected || impactContent.keySuggestions.length > 0 || impactContent.solutions.length > 0) && (
            <button
              type="button"
              onClick={() => setShowFullBriefing((v) => !v)}
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {showFullBriefing ? (
                <>Read less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Read more <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
          <AnimatePresence>
            {showFullBriefing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4 border-t border-border/60 mt-4">
                  {impactContent.whoIsAffected && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Who is affected by this change?
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{impactContent.whoIsAffected}</p>
                    </div>
                  )}
                  {impactContent.keySuggestions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Key suggestions for you
                      </h3>
                      <ul className="list-none space-y-2 pl-0">
                        {impactContent.keySuggestions.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
                            <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {impactContent.solutions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        What is the solution?
                      </h3>
                      <ul className="list-none space-y-2 pl-0">
                        {impactContent.solutions.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                            <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Sectors affected — Only in history mode */}
      {viewMode === "history" && (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold text-foreground">Sectors affected</h2>
        <p className="text-sm text-muted-foreground">
          Industries and sectors most impacted by {selectedIndustry}. Click a card for impact and solutions.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {impactLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-card/50 p-4 flex items-center gap-3"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))
          ) : impactContent?.affectedSectors?.length ? (
            impactContent.affectedSectors.map((sector, index) => (
              <motion.button
                key={`sector-${index}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSectorForModal(sector)}
                className="w-full flex items-center gap-3 p-4 text-left rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 hover:border-border/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="font-medium text-foreground truncate">{sector.name}</span>
              </motion.button>
            ))
          ) : null}
        </div>
      </motion.section>
      )}

      <Dialog open={!!sectorForModal} onOpenChange={(open) => !open && setSectorForModal(null)}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border/60 bg-card shadow-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              {sectorForModal && (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  {sectorForModal.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {sectorForModal && (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Based on recent GVA data and trends
              </p>
              {sectorForModal.solution && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Solution
                  </span>
                  <p className="text-foreground mt-0.5 leading-relaxed text-sm">
                    {sectorForModal.solution}
                  </p>
                </div>
              )}
              {sectorForModal.priceTrend && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price trend
                  </span>
                  <p className="text-foreground mt-0.5 leading-relaxed text-sm">
                    {sectorForModal.priceTrend}
                  </p>
                </div>
              )}
              {sectorForModal.consumptionOutlook && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Consumption
                  </span>
                  <p className="text-foreground mt-0.5 leading-relaxed text-sm">
                    {sectorForModal.consumptionOutlook}
                  </p>
                </div>
              )}
              {sectorForModal.productionOutlook && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Production
                  </span>
                  <p className="text-foreground mt-0.5 leading-relaxed text-sm">
                    {sectorForModal.productionOutlook}
                  </p>
                </div>
              )}
              {sectorForModal.depletionRisk && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Depletion / risk
                  </span>
                  <p className="text-foreground mt-0.5 leading-relaxed text-sm">
                    {sectorForModal.depletionRisk}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sector Modal for Predictions Mode */}
      <Dialog open={!!gvaSectorForModal} onOpenChange={(open) => !open && setGvaSectorForModal(null)}>
        <DialogContent className="sm:max-w-md rounded-xl border border-orange-500/30 bg-orange-950/10 shadow-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              {gvaSectorForModal && (
                <>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    gvaSectorForModal.impact === "positive" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" :
                    gvaSectorForModal.impact === "negative" ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30" :
                    "bg-muted text-muted-foreground border border-border"
                  }`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  {gvaSectorForModal.sector}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {gvaSectorForModal && selectedIndustry && (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Based on AI forecast analysis for {selectedIndustry}
              </p>
              <p className="text-sm text-foreground">
                <strong>Affected:</strong> Yes — this sector is impacted by {selectedIndustry} GVA trends.
              </p>
              <p className="text-sm text-foreground">
                <strong>Impact:</strong> {gvaSectorForModal.impact === "positive" ? "Positive" : gvaSectorForModal.impact === "negative" ? "Negative" : "Neutral"}
              </p>
              {gvaSectorForModal.reason && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Reason
                  </span>
                  <p className="text-sm text-foreground mt-0.5 leading-relaxed">
                    {gvaSectorForModal.reason}
                  </p>
                </div>
              )}
              {aiForecastData && (
                <div className="pt-2 border-t border-orange-500/20">
                  <p className="text-xs text-muted-foreground">
                    Projected GVA growth: {aiForecastData.projectedGrowthRate != null ? `${aiForecastData.projectedGrowthRate >= 0 ? "+" : ""}${aiForecastData.projectedGrowthRate.toFixed(2)}%` : "—"}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2">
        <Link to="/gva" className="text-xs text-muted-foreground hover:text-foreground underline">
          View all industries
        </Link>
      </div>

      {/* Filters - Only in history mode (predictions mode filters are above) */}
      {viewMode === "history" && (
        <FilterBar
          filters={[
            { label: "Year", value: pendingYear, onChange: setPendingYear, options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })) },
            { label: "Subindustry", value: pendingSubindustry, onChange: setPendingSubindustry, options: subindustryOptions.map((s) => ({ value: s, label: s === "ALL" ? "All subindustries" : s })) },
            { label: "Institution", value: pendingInstitution, onChange: setPendingInstitution, options: institutionOptions.map((s) => ({ value: s || "ALL", label: s === "ALL" || !s ? "All sectors" : s })) },
          ]}
          onApply={handleApply}
          onReset={handleReset}
        />
      )}

      {/* Prediction KPIs - Only in predictions mode */}
      {viewMode === "predictions" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 border-orange-500/30 bg-orange-950/10"
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Current Price {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {aiForecastData?.projectedCurrentPrice != null && Number.isFinite(aiForecastData.projectedCurrentPrice)
                ? aiForecastData.projectedCurrentPrice.toLocaleString("en-IN")
                : latest?.totalCurrent != null
                  ? latest.totalCurrent.toLocaleString("en-IN")
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
              Constant Price {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {aiForecastData?.projectedConstantPrice != null && Number.isFinite(aiForecastData.projectedConstantPrice)
                ? aiForecastData.projectedConstantPrice.toLocaleString("en-IN")
                : latest?.totalConstant != null
                  ? latest.totalConstant.toLocaleString("en-IN")
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
              Growth Rate {selectedYear && selectedYear !== "ALL" ? `(${selectedYear})` : aiForecastData?.nextYear ? `(${aiForecastData.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {aiForecastData?.projectedGrowthRate != null && Number.isFinite(aiForecastData.projectedGrowthRate)
                ? `${aiForecastData.projectedGrowthRate >= 0 ? "+" : ""}${aiForecastData.projectedGrowthRate.toFixed(2)}%`
                : latest?.growthRate != null
                  ? `${latest.growthRate >= 0 ? "+" : ""}${latest.growthRate.toFixed(2)}%`
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
              Industry
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {selectedIndustry || "—"}
            </div>
          </motion.div>
        </div>
      )}


      {/* Sectors affected — Only in predictions mode */}
      {viewMode === "predictions" && predictions && predictions.sectorImpact && predictions.sectorImpact.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 rounded-xl border border-orange-500/30 bg-orange-950/10 p-6"
        >
          <h3 className="text-lg font-semibold text-foreground">Sectors affected</h3>
          <p className="text-sm text-muted-foreground">
            Industries most impacted by {selectedIndustry}. Click a card for impact and solutions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.sectorImpact.map((sector, index) => (
              <motion.button
                key={`sector-${index}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => setGvaSectorForModal(sector)}
                className="w-full flex items-center gap-3 p-4 text-left rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 hover:border-border/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  sector.impact === "positive" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" :
                  sector.impact === "negative" ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30" :
                  "bg-muted text-muted-foreground border border-border"
                }`}>
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="font-medium text-foreground truncate">{sector.sector}</span>
                  <span className={cn(
                    "text-xs font-medium w-fit rounded-full px-2 py-0.5",
                    sector.impact === "positive" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                    sector.impact === "negative" && "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30",
                    sector.impact === "neutral" && "bg-muted text-muted-foreground border border-border"
                  )}>
                    {sector.impact === "positive" ? "Positive" : sector.impact === "negative" ? "Negative" : "Neutral"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Projected status: {sector.impact}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* AI-Powered Forecast Card - Only in predictions mode */}
      {viewMode === "predictions" && aiForecastData && aiForecastData.forecastLine && aiForecastData.forecastLine.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="glass-card p-5 border-orange-500/30 bg-orange-950/10">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              AI-Powered Forecast for GVA{selectedYear && selectedYear !== "ALL" ? ` (${selectedYear})` : aiForecastData?.nextYear ? ` (${aiForecastData.nextYear})` : ""}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Projected Current Price</div>
                <div className="font-mono font-bold text-orange-400">
                  {aiForecastData?.projectedCurrentPrice != null ? aiForecastData.projectedCurrentPrice.toLocaleString("en-IN") : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Projected Constant Price</div>
                <div className="font-mono font-bold text-orange-400">
                  {aiForecastData?.projectedConstantPrice != null ? aiForecastData.projectedConstantPrice.toLocaleString("en-IN") : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Projected Growth Rate</div>
                <div className="font-mono font-bold text-orange-400">
                  {aiForecastData?.projectedGrowthRate != null ? `${aiForecastData.projectedGrowthRate >= 0 ? "+" : ""}${aiForecastData.projectedGrowthRate.toFixed(2)}%` : "—"}
                </div>
              </div>
            </div>
          </div>

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
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Current Price (₹ Cr)</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Constant Price (₹ Cr)</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Growth Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.forecasts.years.map((year, idx) => {
                      const currentPrice = predictions.forecasts.currentPrice[idx] ?? 0;
                      const constantPrice = predictions.forecasts.constantPrice[idx] ?? 0;
                      const growthRate = predictions.forecasts.growthRate[idx] ?? 0;
                      return (
                        <tr key={year} className="border-b border-orange-500/10 hover:bg-orange-950/20">
                          <td className="py-2 px-3 font-medium text-foreground">{year}-{String((year + 1) % 100).padStart(2, "0")}</td>
                          <td className="py-2 px-3 text-right font-mono text-orange-400">{Math.round(currentPrice).toLocaleString("en-IN")}</td>
                          <td className="py-2 px-3 text-right font-mono text-orange-400">{Math.round(constantPrice).toLocaleString("en-IN")}</td>
                          <td className={`py-2 px-3 text-right font-mono ${growthRate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {growthRate >= 0 ? "+" : ""}{growthRate.toFixed(2)}%
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
                const firstCurrent = predictions.forecasts.currentPrice[0] ?? 0;
                const lastCurrent = predictions.forecasts.currentPrice[predictions.forecasts.currentPrice.length - 1] ?? 0;
                const firstGrowth = predictions.forecasts.growthRate[0] ?? 0;
                const lastGrowth = predictions.forecasts.growthRate[predictions.forecasts.growthRate.length - 1] ?? 0;
                const totalGrowth = firstCurrent > 0 ? ((lastCurrent - firstCurrent) / firstCurrent) * 100 : 0;
                const avgGrowth = predictions.forecasts.growthRate.reduce((sum, val) => sum + (val ?? 0), 0) / predictions.forecasts.growthRate.length;
                return (
                  <>
                    <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                      <div className="text-xs text-muted-foreground mb-1">Total GVA Growth</div>
                      <div className={`text-2xl font-mono font-bold ${totalGrowth >= 0 ? "text-orange-400" : "text-red-400"}`}>
                        {totalGrowth >= 0 ? "+" : ""}{totalGrowth.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Over forecast period</div>
                    </div>
                    <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                      <div className="text-xs text-muted-foreground mb-1">Average Growth Rate</div>
                      <div className={`text-2xl font-mono font-bold ${avgGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {avgGrowth >= 0 ? "+" : ""}{avgGrowth.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Period average</div>
                    </div>
                    <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                      <div className="text-xs text-muted-foreground mb-1">Growth Trend</div>
                      <div className={`text-2xl font-mono font-bold ${lastGrowth >= firstGrowth ? "text-emerald-400" : "text-red-400"}`}>
                        {lastGrowth >= firstGrowth ? "↑ Improving" : "↓ Declining"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">First vs Last year</div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Historical Charts - Only in history mode */}
      {viewMode === "history" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`glass-card p-5 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}>
          <h3 className="text-sm font-medium text-foreground mb-4">Total GVA by Year (Current Prices) — {selectedIndustry}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byYearTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="fiscalYear" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString("en-IN"), "Total"]} />
                <Line type="monotone" dataKey="totalCurrent" stroke="hsl(187 92% 50%)" strokeWidth={2} name="Total GVA (₹ crore, current)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">GVA by Subindustry (Current Prices)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byIndustryTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" angle={-20} textAnchor="end" height={80} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString("en-IN"), "GVA"]} />
                <Bar dataKey="total" fill="hsl(160 84% 45%)" name="GVA (₹ crore)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Latest Snapshot</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Latest year</div>
              <div className="font-mono font-bold">{latest ? latest.fiscalYear : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total GVA (current)</div>
              <div className="font-mono font-bold">{latest ? latest.totalCurrent.toLocaleString("en-IN") : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total GVA (constant)</div>
              <div className="font-mono font-bold">{latest ? latest.totalConstant.toLocaleString("en-IN") : "—"}</div>
            </div>
          </div>
        </motion.div>
        </div>
      )}

      {/* Know More Modal for AI Details */}
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
                  GVA Forecast Intelligence
                </DialogTitle>
                <div className="text-sm text-muted-foreground mt-0.5">{selectedIndustry}</div>
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
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-orange-500" />
                  <h3 className="text-base font-semibold text-foreground">Forecast Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Year</div>
                    <div className="font-mono font-bold text-orange-500">
                      {selectedYear && selectedYear !== "ALL" ? selectedYear : aiForecastData?.nextYear || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Current Price</div>
                    <div className="font-mono font-bold text-orange-500">
                      {aiForecastData?.projectedCurrentPrice != null ? aiForecastData.projectedCurrentPrice.toLocaleString("en-IN") : "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Constant Price</div>
                    <div className="font-mono font-bold text-foreground">
                      {aiForecastData?.projectedConstantPrice != null ? aiForecastData.projectedConstantPrice.toLocaleString("en-IN") : "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Growth Rate</div>
                    <div className="font-mono font-bold text-foreground">
                      {aiForecastData?.projectedGrowthRate != null ? `${aiForecastData.projectedGrowthRate >= 0 ? "+" : ""}${aiForecastData.projectedGrowthRate.toFixed(2)}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground font-mono">
          GVA records loaded: {raw?.length ?? 0} · Filtered: {filteredRows.length} · Industry: {selectedIndustry}
        </p>
      </div>
    </div>
  );
};

export default GVAPage;
