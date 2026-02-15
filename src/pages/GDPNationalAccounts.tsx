import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, IndianRupee, Landmark, Building2, BarChart3, ChevronRight, Info, AlertTriangle, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar, AreaChart, Area, Cell,
} from "recharts";
import { useNASData } from "@/hooks/useMacroData";
import { useForecast } from "@/hooks/useForecast";
import {
  parseFiscalYearToStartYear,
} from "@/utils/dates";
import { toNumber } from "@/utils/numbers";
import {
  computeManualGdpGrowth,
  mergeGdpGrowth,
  normalizeOfficialGdpGrowth,
} from "@/utils/gdpLogic";
import { detectGdpRisk } from "@/utils/riskRules";
import { FilterBar } from "@/components/FilterBar";
import { AlertBanner } from "@/components/AlertBanner";
import { GdpIntelligenceBriefing } from "@/components/GdpIntelligenceBriefing";
import { PredictionCard } from "@/components/PredictionCard";
import { ForecastChart } from "@/components/ForecastChart";
import { GDP_COMPONENTS_IMPACT } from "@/data/gdpComponentsImpact";
import {
  getGDPComponentImpact,
  computeYoYGrowthFromTrend,
} from "@/utils/sectorImpactLogic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 22%)",
  borderRadius: "8px",
  fontFamily: "JetBrains Mono",
  fontSize: "12px",
};

function parseNum(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function toTrillions(v: number): number {
  return Math.round(v / 100000) / 10; // ₹ Lakh Crore
}

const GDPNationalAccounts = () => {
  const [selectedRevision, setSelectedRevision] = useState("Latest per year");
  const [pendingRevision, setPendingRevision] = useState("Latest per year");
  const [gdpComponentForModal, setGdpComponentForModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"history" | "predictions">("history");
  const [showAIDetailsModal, setShowAIDetailsModal] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("ALL");
  const [pendingFiscalYear, setPendingFiscalYear] = useState<string>("ALL");

  // indicator_code: 1=GVA, 2=Net Taxes, 5=GDP, 22=GDP Growth
  const { data: gvaRaw, isLoading: l1 } = useNASData(1);
  const { data: gdpRaw, isLoading: l2 } = useNASData(5);
  const { data: taxRaw, isLoading: l3 } = useNASData(2);
  const { data: growthRaw, isLoading: l4 } = useNASData(22);
  const { gdp: gdpForecast, loading: forecastLoading } = useForecast();

  const isLoading = l1 || l2 || l3 || l4;

  const allGdpRows = useMemo(() => {
    if (!gdpRaw) return [];
    return (gdpRaw as any[])
      .map((r) => ({
        fiscalYear: r.year,
        year: parseFiscalYearToStartYear(r.year),
        revision: r.revision,
        currentPrice: toNumber(r.current_price),
        constantPrice: toNumber(r.constant_price),
        unit: r.unit,
      }))
      .filter((r) => Number.isFinite(r.year) && Number.isFinite(r.currentPrice));
  }, [gdpRaw]);

  const revisionOptions = useMemo(() => {
    const set = new Set<string>();
    allGdpRows.forEach((r) => r.revision && set.add(r.revision));
    return ["Latest per year", ...Array.from(set).sort()];
  }, [allGdpRows]);

  const gdpSeries = useMemo(() => {
    if (selectedRevision === "Latest per year") {
      const byYear = new Map<number, (typeof allGdpRows)[0]>();
      allGdpRows.forEach((row) => {
        const existing = byYear.get(row.year);
        if (!existing) {
          byYear.set(row.year, row);
        } else if (row.revision && existing.revision) {
          if (row.revision > existing.revision) {
            byYear.set(row.year, row);
          }
        }
      });
      return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
    }
    return allGdpRows
      .filter((r) => r.revision === selectedRevision)
      .sort((a, b) => a.year - b.year);
  }, [allGdpRows, selectedRevision]);

  const officialGrowthSeries = useMemo(
    () => (growthRaw ? normalizeOfficialGdpGrowth(growthRaw as any) : []),
    [growthRaw]
  );
  const manualGrowthSeries = useMemo(
    () => computeManualGdpGrowth(gdpSeries.map((r) => ({ ...r, currentPrice: r.currentPrice }))),
    [gdpSeries]
  );
  const mergedGrowth = useMemo(
    () => mergeGdpGrowth(manualGrowthSeries, officialGrowthSeries),
    [manualGrowthSeries, officialGrowthSeries]
  );

  const latest = gdpSeries.length ? gdpSeries[gdpSeries.length - 1] : null;
  const latestGrowth = mergedGrowth.length > 0 ? mergedGrowth[mergedGrowth.length - 1] : null;
  const gdpRisk = useMemo(
    () => detectGdpRisk(latestGrowth?.manualGrowthPct),
    [latestGrowth]
  );

  // ── GDP Trend (for legacy charts) ──
  const gdpTrend = useMemo(() => {
    return gdpSeries.map((r) => ({
      year: r.fiscalYear,
      currentPrice: toTrillions(r.currentPrice),
      constantPrice: toTrillions(r.constantPrice ?? 0),
    }));
  }, [gdpSeries]);

  // ── GVA by Industry (latest year) ──
  const gvaByIndustry = useMemo(() => {
    if (!gvaRaw) return [];
    const records = gvaRaw as any[];
    // Get latest year
    const years = [...new Set(records.map((r) => r.year))].sort();
    const latestYear = years[years.length - 1];
    return records
      .filter((r) => r.year === latestYear && r.industry && r.industry !== "Total Gross Value Added")
      .map((r: any) => ({
        name: r.industry.length > 30 ? r.industry.slice(0, 28) + "…" : r.industry,
        fullName: r.industry,
        currentPrice: toTrillions(parseNum(r.current_price)),
        constantPrice: toTrillions(parseNum(r.constant_price)),
      }))
      .sort((a: any, b: any) => b.currentPrice - a.currentPrice);
  }, [gvaRaw]);

  // ── GVA Total trend over years ──
  const gvaTrend = useMemo(() => {
    if (!gvaRaw) return [];
    const records = gvaRaw as any[];
    const totals = records.filter((r) => r.industry === "Total Gross Value Added");
    const byYear: Record<string, any> = {};
    totals.forEach((r) => {
      if (!byYear[r.year]) byYear[r.year] = r;
    });
    return Object.values(byYear)
      .map((r: any) => ({
        year: r.year,
        currentPrice: toTrillions(parseNum(r.current_price)),
        constantPrice: toTrillions(parseNum(r.constant_price)),
      }))
      .sort((a: any, b: any) => a.year.localeCompare(b.year));
  }, [gvaRaw]);

  // ── GDP Growth Rate (YoY) - from merged manual/official ──
  const gdpGrowth = useMemo(() => {
    return mergedGrowth.map((r) => ({
      year: r.fiscalYear,
      growth: r.manualGrowthPct ?? r.officialGrowthPct ?? 0,
      manualGrowthPct: r.manualGrowthPct,
      officialGrowthPct: r.officialGrowthPct,
    }));
  }, [mergedGrowth]);

  // ── Net Taxes trend ──
  const taxTrend = useMemo(() => {
    if (!taxRaw) return [];
    const byYear: Record<string, any> = {};
    (taxRaw as any[]).forEach((r) => {
      if (!byYear[r.year]) byYear[r.year] = r;
    });
    return Object.values(byYear)
      .map((r: any) => ({
        year: r.year,
        currentPrice: toTrillions(parseNum(r.current_price)),
        constantPrice: toTrillions(parseNum(r.constant_price)),
      }))
      .sort((a: any, b: any) => a.year.localeCompare(b.year));
  }, [taxRaw]);

  // ── KPIs ──
  const latestGDP = gdpTrend[gdpTrend.length - 1];
  const latestGVA = gvaTrend[gvaTrend.length - 1];
  const latestTax = taxTrend[taxTrend.length - 1];

  const gdpInsightContext = useMemo(
    () => ({
      sectorName: "GDP",
      gdpGrowth:
        latestGrowth?.manualGrowthPct != null
          ? `${latestGrowth.manualGrowthPct.toFixed(2)}%`
          : latestGrowth?.officialGrowthPct != null
            ? `${latestGrowth.officialGrowthPct.toFixed(2)}%`
            : undefined,
      inflationTrend: undefined,
    }),
    [latestGrowth]
  );

  const gvaGrowthPct = useMemo(
    () => computeYoYGrowthFromTrend(gvaTrend),
    [gvaTrend]
  );
  const taxGrowthPct = useMemo(
    () => computeYoYGrowthFromTrend(taxTrend),
    [taxTrend]
  );
  const gdpGrowthPct =
    latestGrowth?.manualGrowthPct != null
      ? latestGrowth.manualGrowthPct
      : latestGrowth?.officialGrowthPct ?? null;

  const gdpImpactInputs = useMemo(
    () => ({
      gvaGrowthPct,
      taxGrowthPct,
      gdpGrowthPct,
    }),
    [gvaGrowthPct, taxGrowthPct, gdpGrowthPct]
  );

  const gdpComponentImpacts = useMemo(
    () =>
      GDP_COMPONENTS_IMPACT.map((component) => ({
        ...component,
        impact: getGDPComponentImpact(component, gdpImpactInputs),
      })),
    [gdpImpactInputs]
  );

  // Fiscal year options based on view mode
  const fiscalYearOptions = useMemo(() => {
    if (viewMode === "predictions") {
      // Future years for predictions
      const currentYear = new Date().getFullYear();
      const years = ["ALL"];
      for (let i = 0; i < 10; i++) {
        const year = currentYear + i + 1;
        years.push(`${year}-${String(year + 1).slice(-2)}`);
      }
      return years;
    } else {
      // Historical years for history mode
      const years = ["ALL"];
      const uniqueYears = new Set<string>();
      allGdpRows.forEach((row) => {
        if (row.fiscalYear) {
          uniqueYears.add(row.fiscalYear);
        }
      });
      return [...years, ...Array.from(uniqueYears).sort().reverse()];
    }
  }, [viewMode, allGdpRows]);

  const handleApply = () => {
    // Clear cache when filters change to force regeneration
    if (viewMode === "predictions") {
      // For GDP, we use useForecast which is regression-based, but we still want to ensure data updates
      sessionStorage.removeItem('last-gdp-prediction-data-key');
    }
    setSelectedRevision(pendingRevision);
    if (viewMode === "predictions") {
      setSelectedFiscalYear(pendingFiscalYear);
    }
  };
  const handleReset = () => {
    setPendingRevision("Latest per year");
    setSelectedRevision("Latest per year");
    if (viewMode === "predictions") {
      setPendingFiscalYear("ALL");
      setSelectedFiscalYear("ALL");
    }
  };

  return (
    <div className={`min-h-screen p-6 space-y-6 ${viewMode === "predictions" ? "bg-gradient-to-br from-orange-950/20 via-background to-orange-900/10" : ""}`}>
      {/* Toggle in top-right header area */}
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gross Domestic Product (GDP)</h1>
          <p className="text-sm text-muted-foreground">National accounts: GDP, growth, and GVA by industry.</p>
        </div>
        {isLoading && <Skeleton className="h-5 w-5 rounded" />}
      </div>

      {/* GDP Intelligence - Only in predictions mode with Know More button - FIRST */}
      {viewMode === "predictions" && gdpInsightContext.gdpGrowth && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-950/20 via-orange-900/10 to-orange-950/20 p-6 mb-6 shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">GDP Intelligence</h3>
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
            {forecastLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            ) : gdpForecast ? (
              <>
                <p className="line-clamp-2">
                  Latest Growth: {gdpForecast.latestGrowth != null ? `${gdpForecast.latestGrowth >= 0 ? "+" : ""}${gdpForecast.latestGrowth.toFixed(1)}%` : "—"} · 
                  Projected GDP ({selectedFiscalYear && selectedFiscalYear !== "ALL" ? selectedFiscalYear : gdpForecast.nextYear ? `${gdpForecast.nextYear}-${String((gdpForecast.nextYear + 1) % 100).padStart(2, "0")}` : "—"}): {gdpForecast.projectedConstant != null ? `₹ ${toTrillions(gdpForecast.projectedConstant).toFixed(1)} L Cr` : "—"}
                </p>
                {gdpInsightContext.trendDirection && (
                  <p className="line-clamp-1 text-xs">
                    <span className="font-semibold text-orange-400">Trend:</span> {gdpInsightContext.trendDirection}
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
            {
              label: "Fiscal Year",
              value: pendingFiscalYear,
              onChange: setPendingFiscalYear,
              options: fiscalYearOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })),
            },
          ]}
          onApply={handleApply}
          onReset={handleReset}
          applyButtonClassName="bg-orange-500/70 hover:bg-orange-500 text-white"
        />
      )}

      {viewMode === "history" && (
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
          {gdpComponentImpacts.map(({ name, impact }, index) => (
            <motion.button
              key={name}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              onClick={() => setGdpComponentForModal(name)}
              className="w-full flex items-center gap-3 p-4 text-left rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 hover:border-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="font-medium text-foreground truncate">{name}</span>
                <span
                  className={cn(
                    "text-xs font-medium w-fit rounded-full px-2 py-0.5",
                    impact.direction === "negative" &&
                      "bg-destructive/15 text-destructive border border-destructive/30",
                    impact.direction === "positive" &&
                      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                    impact.direction === "neutral" &&
                      "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {impact.direction === "positive" ? "Positive impact" : impact.direction === "negative" ? "Negative impact" : "Neutral"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {impact.metricLabel}: {impact.metricValue}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>
      )}

      <Dialog open={!!gdpComponentForModal} onOpenChange={(open) => !open && setGdpComponentForModal(null)}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border/60 bg-card shadow-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              {gdpComponentForModal && (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  {gdpComponentForModal}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {gdpComponentForModal && (() => {
            const item = gdpComponentImpacts.find((c) => c.name === gdpComponentForModal);
            if (!item) return null;
            const { impact } = item;
            return (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-foreground">
                  <strong>Affected:</strong> {impact.affected ? "Yes" : "No"}.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Impact:</strong> {impact.direction === "positive" ? "Positive" : impact.direction === "negative" ? "Negative" : "Neutral"}.
                </p>
                <p className="text-sm text-foreground">
                  Based on current data: {impact.metricLabel} is {impact.metricValue}.
                </p>
                {impact.growthPct != null && impact.growthPct < 4 && (
                  <p className="text-xs text-muted-foreground">
                    Growth below 4% may signal slowdown (policy threshold).
                  </p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Filters - For history mode */}
      {viewMode === "history" && (
      <FilterBar
        filters={[
          {
            label: "Revision",
            value: pendingRevision,
            onChange: setPendingRevision,
            options: revisionOptions.map((rev) => ({ value: rev, label: rev })),
          },
        ]}
        onApply={handleApply}
        onReset={handleReset}
      />
      )}

      {viewMode === "history" && gdpRisk && <AlertBanner level={gdpRisk.type} title={gdpRisk.title} message={gdpRisk.message} />}

      {/* KPI Cards - only in history mode */}
      {viewMode === "history" && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIBox icon={<IndianRupee className="w-4 h-4" />} label="GDP (Current)" value={latest ? toTrillions(latest.currentPrice) : undefined} suffix="L Cr" year={latest?.fiscalYear} />
        <KPIBox icon={<Landmark className="w-4 h-4" />} label="GVA (Current)" value={latestGVA?.currentPrice} suffix="L Cr" year={latestGVA?.year} />
        <KPIBox icon={<BarChart3 className="w-4 h-4" />} label="Manual YoY Growth" value={latestGrowth?.manualGrowthPct} suffix="%" year={latestGrowth?.fiscalYear} isGrowth />
        <KPIBox icon={<Building2 className="w-4 h-4" />} label="Net Taxes" value={latestTax?.currentPrice} suffix="L Cr" year={latestTax?.year} />
      </div>
      )}

      {/* Historical charts - only in history mode */}
      {viewMode === "history" && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GDP Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`glass-card p-5 ${viewMode === "predictions" ? "border-orange-500/30 bg-orange-950/10" : ""}`}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">GDP Trend (₹ Lakh Crore)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gdpTrend}>
                <defs>
                  <linearGradient id="gdpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187 92% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(187 92% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="currentPrice" stroke="hsl(187 92% 50%)" fill="url(#gdpGrad)" strokeWidth={2} name="Current Price" />
                <Line type="monotone" dataKey="constantPrice" stroke="hsl(160 84% 45%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Constant Price" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* GDP Growth: Manual vs Official */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">GDP Growth: Manual vs Official</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="fiscalYear" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="manualGrowthPct" stroke="hsl(160 84% 45%)" strokeWidth={2} name="Manual YoY growth (%)" />
                <Line type="monotone" dataKey="officialGrowthPct" stroke="hsl(0 72% 55%)" strokeWidth={2} name="Official GDP growth (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* GVA by Industry */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 lg:col-span-2">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">GVA by Industry — Latest Year (₹ Lakh Crore)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gvaByIndustry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis dataKey="name" type="category" stroke="hsl(215 20% 55%)" fontSize={7} fontFamily="JetBrains Mono" width={160} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name: string) => [`₹${value} L Cr`, name]} />
                <Legend />
                <Bar dataKey="currentPrice" fill="hsl(187 92% 50%)" name="Current Price" radius={[0, 3, 3, 0]} />
                <Bar dataKey="constantPrice" fill="hsl(280 65% 60%)" name="Constant Price" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* GVA Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Total GVA Trend (₹ Lakh Crore)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gvaTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="currentPrice" stroke="hsl(38 92% 55%)" strokeWidth={2} dot={false} name="Current Price" />
                <Line type="monotone" dataKey="constantPrice" stroke="hsl(160 84% 45%)" strokeWidth={2} dot={false} name="Constant Price" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Net Taxes Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Net Taxes on Products (₹ Lakh Crore)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={taxTrend}>
                <defs>
                  <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280 65% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(280 65% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="currentPrice" stroke="hsl(280 65% 60%)" fill="url(#taxGrad)" strokeWidth={2} name="Current Price" />
              </AreaChart>
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
                  GDP Forecast Intelligence
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-5 space-y-4">
            {gdpForecast && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-orange-500" />
                  <h3 className="text-base font-semibold text-foreground">Forecast Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Latest Growth</div>
                    <div className="font-mono font-bold text-orange-500">
                      {gdpForecast.latestGrowth != null ? `${gdpForecast.latestGrowth >= 0 ? "+" : ""}${gdpForecast.latestGrowth.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Year</div>
                    <div className="font-mono font-bold text-orange-500">
                      {gdpForecast.nextYear || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected GDP</div>
                    <div className="font-mono font-bold text-foreground">
                      {gdpForecast.projectedConstant != null ? `₹ ${toTrillions(gdpForecast.projectedConstant).toFixed(1)} L Cr` : "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">Projected Growth</div>
                    <div className="font-mono font-bold text-foreground">
                      {gdpForecast.projectedGrowth != null ? `${gdpForecast.projectedGrowth >= 0 ? "+" : ""}${gdpForecast.projectedGrowth.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {gdpInsightContext && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <h3 className="text-base font-semibold text-foreground">Intelligence Briefing</h3>
                </div>
                <GdpIntelligenceBriefing context={gdpInsightContext} />
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
              GDP (Current) {selectedFiscalYear && selectedFiscalYear !== "ALL" ? `(${selectedFiscalYear})` : gdpForecast?.nextYear ? `(${gdpForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {gdpForecast?.projectedConstant != null && Number.isFinite(gdpForecast.projectedConstant)
                ? `₹ ${toTrillions(gdpForecast.projectedConstant).toFixed(1)} L Cr`
                : latest ? `₹ ${toTrillions(latest.currentPrice).toFixed(1)} L Cr`
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
              Growth {selectedFiscalYear && selectedFiscalYear !== "ALL" ? `(${selectedFiscalYear})` : gdpForecast?.nextYear ? `(${gdpForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {gdpForecast?.projectedGrowth != null && Number.isFinite(gdpForecast.projectedGrowth)
                ? `${gdpForecast.projectedGrowth >= 0 ? "+" : ""}${gdpForecast.projectedGrowth.toFixed(1)}%`
                : gdpForecast?.latestGrowth != null
                  ? `${gdpForecast.latestGrowth >= 0 ? "+" : ""}${gdpForecast.latestGrowth.toFixed(1)}%`
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
              GVA (Current) {selectedFiscalYear && selectedFiscalYear !== "ALL" ? `(${selectedFiscalYear})` : gdpForecast?.nextYear ? `(${gdpForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {latestGVA?.currentPrice != null ? `${latestGVA.currentPrice.toFixed(1)} L Cr` : "—"}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y:20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 border-orange-500/30 bg-orange-950/10"
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Net Taxes {selectedFiscalYear && selectedFiscalYear !== "ALL" ? `(${selectedFiscalYear})` : gdpForecast?.nextYear ? `(${gdpForecast.nextYear})` : "(Projected)"}
            </div>
            <div className="font-mono font-bold mt-1 text-orange-400">
              {latestTax?.currentPrice != null ? `${latestTax.currentPrice.toFixed(1)} L Cr` : "—"}
            </div>
          </motion.div>
        </div>
      )}


      {/* Sectors affected — Only in predictions mode */}
      {viewMode === "predictions" && gdpComponentImpacts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 rounded-xl border border-orange-500/30 bg-orange-950/10 p-6"
        >
          <h3 className="text-lg font-semibold text-foreground">Sectors affected</h3>
          <p className="text-sm text-muted-foreground">
            Click a card for impact and solutions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gdpComponentImpacts.map(({ name, impact }, index) => (
              <motion.button
                key={name}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => setGdpComponentForModal(name)}
                className="w-full flex items-center gap-3 p-4 text-left rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 hover:border-border/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="font-medium text-foreground truncate">{name}</span>
                  <span
                    className={cn(
                      "text-xs font-medium w-fit rounded-full px-2 py-0.5",
                      impact.direction === "negative" &&
                        "bg-destructive/15 text-destructive border border-destructive/30",
                      impact.direction === "positive" &&
                        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                      impact.direction === "neutral" &&
                        "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {impact.direction === "positive" ? "Positive" : impact.direction === "negative" ? "Negative" : "Neutral"}
                  </span>
                  {gdpForecast && (
                    <span className="text-xs text-muted-foreground">
                      Projected status: {gdpForecast.status === "pressure" ? "pressure" : "stable"}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* AI-Powered Forecast Card - Only in predictions mode */}
      {viewMode === "predictions" && gdpForecast && gdpForecast.forecastLine && gdpForecast.forecastLine.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
            <PredictionCard
            title={`AI-Powered Forecast for GDP${selectedFiscalYear && selectedFiscalYear !== "ALL" ? ` (${selectedFiscalYear})` : gdpForecast.nextYear ? ` (${gdpForecast.nextYear}-${String((gdpForecast.nextYear + 1) % 100).padStart(2, "0")})` : ""}`}
              status={gdpForecast.status === "pressure" ? "pressure" : "stable"}
            className="border-orange-500/30 bg-orange-950/10"
              metrics={[
                {
                label: `Latest growth (YoY %)`,
                  value:
                  gdpForecast.latestGrowth != null && Number.isFinite(gdpForecast.latestGrowth)
                      ? `${gdpForecast.latestGrowth >= 0 ? "+" : ""}${gdpForecast.latestGrowth.toFixed(1)}%`
                      : "—",
                },
              {
                label: `Projected GDP${selectedFiscalYear && selectedFiscalYear !== "ALL" ? ` (${selectedFiscalYear})` : gdpForecast.nextYear ? ` (${gdpForecast.nextYear}-${String((gdpForecast.nextYear + 1) % 100).padStart(2, "0")})` : ""}`,
                value:
                  gdpForecast.projectedConstant != null && Number.isFinite(gdpForecast.projectedConstant)
                    ? `₹ ${toTrillions(gdpForecast.projectedConstant).toFixed(1)} L Cr`
                    : latest ? `₹ ${toTrillions(latest.currentPrice).toFixed(1)} L Cr`
                      : "—",
              },
              {
                label: `Projected growth${selectedFiscalYear && selectedFiscalYear !== "ALL" ? ` (${selectedFiscalYear})` : gdpForecast.nextYear ? ` (${gdpForecast.nextYear}-${String((gdpForecast.nextYear + 1) % 100).padStart(2, "0")})` : ""}`,
                value:
                  gdpForecast.projectedGrowth != null && Number.isFinite(gdpForecast.projectedGrowth)
                    ? `${gdpForecast.projectedGrowth >= 0 ? "+" : ""}${gdpForecast.projectedGrowth.toFixed(1)}%`
                    : "—",
              },
              ]}
            >
            </PredictionCard>

            {/* Forecast Summary Table */}
            {gdpForecast && gdpForecast.forecastLine && gdpForecast.forecastLine.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl border border-orange-500/30 bg-orange-950/10 p-6 mt-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">Forecast Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gdpForecast.forecastLine.slice(-6).map((point: any, idx: number) => {
                    const year = point.year || point.x || "";
                    const gdp = point.currentPrice || point.constantPrice || 0;
                    const growth = point.growthRate || point.growth || 0;
                    return (
                      <div key={idx} className="p-4 rounded-lg border border-orange-500/20 bg-orange-950/5">
                        <div className="text-xs text-muted-foreground mb-1">{year}</div>
                        <div className="text-lg font-mono font-bold text-orange-400 mb-1">
                          ₹ {toTrillions(gdp).toFixed(1)} L Cr
                        </div>
                        <div className={`text-sm font-mono ${growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Growth Indicators */}
            {gdpForecast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
              >
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                  <div className="text-xs text-muted-foreground mb-1">Latest Growth</div>
                  <div className={`text-2xl font-mono font-bold ${(gdpForecast.latestGrowth ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(gdpForecast.latestGrowth ?? 0) >= 0 ? "+" : ""}{(gdpForecast.latestGrowth ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Year-over-year</div>
                </div>
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                  <div className="text-xs text-muted-foreground mb-1">Projected Growth</div>
                  <div className={`text-2xl font-mono font-bold ${(gdpForecast.projectedGrowth ?? 0) >= 0 ? "text-orange-400" : "text-red-400"}`}>
                    {(gdpForecast.projectedGrowth ?? 0) >= 0 ? "+" : ""}{(gdpForecast.projectedGrowth ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedFiscalYear && selectedFiscalYear !== "ALL" ? selectedFiscalYear : gdpForecast.nextYear ? `${gdpForecast.nextYear}-${String((gdpForecast.nextYear + 1) % 100).padStart(2, "0")}` : "Next year"}
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/10">
                  <div className="text-xs text-muted-foreground mb-1">Projected GDP</div>
                  <div className="text-2xl font-mono font-bold text-orange-400">
                    ₹ {gdpForecast.projectedConstant != null ? toTrillions(gdpForecast.projectedConstant).toFixed(1) : "—"} L Cr
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Constant prices</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

      {viewMode === "history" && (
      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground font-mono">
          GDP records: {(gdpRaw as any[])?.length ?? "loading…"} · GVA records: {(gvaRaw as any[])?.length ?? "loading…"} · Tax records: {(taxRaw as any[])?.length ?? "loading…"}
        </p>
      </div>
      )}
    </div>
  );
};

function KPIBox({ icon, label, value, suffix, year, isGrowth }: {
  icon: React.ReactNode; label: string; value?: number; suffix?: string; year?: string; isGrowth?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground font-mono">
        {value != null ? (
          <>
            {isGrowth && value >= 0 && "+"}
            {isGrowth ? value.toFixed(1) : value.toFixed(1)}
            {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
          </>
        ) : "—"}
      </div>
      {isGrowth && value != null && (
        <span className={`flex items-center gap-0.5 text-xs font-mono mt-1 ${value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          YoY
        </span>
      )}
      {year && <p className="text-xs text-muted-foreground font-mono mt-1">{year}</p>}
    </motion.div>
  );
}

export default GDPNationalAccounts;
