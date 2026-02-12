import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Loader2, Factory, Zap, Pickaxe, TrendingUp, TrendingDown, Building2 } from "lucide-react";
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
  Cell,
} from "recharts";
import { useIIPAnnual, useIIPMonthly } from "@/hooks/useMacroData";
import { useForecast } from "@/hooks/useForecast";
import { normalizeIipMonthly, detectThreeNegativeGrowth } from "@/utils/iipLogic";
import { FilterBar } from "@/components/FilterBar";
import { AlertBanner } from "@/components/AlertBanner";
import { IipIntelligenceBriefing } from "@/components/IipIntelligenceBriefing";
import { PredictionCard } from "@/components/PredictionCard";
import { ForecastChart } from "@/components/ForecastChart";
import { IIP_CATEGORY_LIST, resolveIIPCategoryFromSlug } from "@/utils/iipSlug";
import { getIIPCategoryImpact } from "@/data/iipCategoryImpact";
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

function parseNum(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function matchCategory(apiCategory: string | undefined, configCategory: string): boolean {
  if (!apiCategory) return false;
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s*-\s*/g, " ");
  return norm(apiCategory) === norm(configCategory);
}

const IndustrialProduction = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const { data: annualRaw, isLoading: l1 } = useIIPAnnual();
  const { data: monthlyRaw, isLoading: l2 } = useIIPMonthly();
  const { iip: iipForecast } = useForecast();

  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
  const [pendingYear, setPendingYear] = useState("ALL");
  const [pendingSubCategory, setPendingSubCategory] = useState("ALL");
  const [iipSectorForModal, setIipSectorForModal] = useState<string | null>(null);

  const isLoading = l1 || l2;

  const allRows = useMemo(
    () => (monthlyRaw ? normalizeIipMonthly(monthlyRaw as Record<string, unknown>[]) : []),
    [monthlyRaw]
  );

  const categoryConfig = useMemo(
    () => (categorySlug ? resolveIIPCategoryFromSlug(categorySlug) : null),
    [categorySlug]
  );

  const categoryImpact = useMemo(
    () => getIIPCategoryImpact(categoryConfig?.slug),
    [categoryConfig?.slug]
  );

  useEffect(() => {
    if (categorySlug && allRows.length > 0 && !categoryConfig) {
      navigate("/iip", { replace: true });
    }
  }, [categorySlug, allRows.length, categoryConfig, navigate]);

  useEffect(() => {
    if (!categorySlug && IIP_CATEGORY_LIST.length > 0) {
      navigate(`/iip/${IIP_CATEGORY_LIST[0].slug}`, { replace: true });
    }
  }, [categorySlug, navigate]);

  const baseRows = useMemo(() => {
    if (!categoryConfig) return [];
    return allRows.filter(
      (r) =>
        r.type === categoryConfig.type &&
        matchCategory(r.category, categoryConfig.category)
    );
  }, [allRows, categoryConfig]);

  const yearsOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => set.add(String(r.year)));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const subCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    baseRows.forEach((r) => r.subCategory && set.add(r.subCategory));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

  const filteredRows = useMemo(() => {
    return baseRows.filter((r) => {
      if (selectedYear !== "ALL" && String(r.year) !== selectedYear) return false;
      if (selectedSubCategory !== "ALL" && r.subCategory !== selectedSubCategory) return false;
      return true;
    });
  }, [baseRows, selectedYear, selectedSubCategory]);

  const hasStress = useMemo(() => detectThreeNegativeGrowth(filteredRows), [filteredRows]);
  const iipRisk = useMemo(
    () =>
      hasStress
        ? {
            id: "iip-stress",
            type: "warning" as const,
            title: "Industrial Stress Alert",
            message: "Detected 3 consecutive months of negative IIP growth.",
          }
        : null,
    [hasStress]
  );

  const latest = filteredRows.length > 0 ? filteredRows[filteredRows.length - 1] : null;
  const indexByPeriod = filteredRows;
  const growthByPeriod = filteredRows;

  const iipImpactStatus = useMemo(() => {
    const rate = latest?.growthRate;
    if (rate == null || !Number.isFinite(rate)) return { label: "Neutral", variant: "neutral" as const };
    if (rate > 0) return { label: "Positive", variant: "positive" as const };
    if (rate < 0) return { label: "Negative", variant: "negative" as const };
    return { label: "Neutral", variant: "neutral" as const };
  }, [latest?.growthRate]);

  const iipOutlookContext = useMemo(
    () =>
      categoryConfig && latest
        ? {
            sectorName: categoryConfig.displayName,
            industrialGrowth:
              latest.growthRate != null && Number.isFinite(latest.growthRate)
                ? `${latest.growthRate.toFixed(2)}%`
                : undefined,
            currentIIP: latest.index != null ? String(latest.index.toFixed(1)) : undefined,
            avgMonthlyGrowth:
              filteredRows.length > 1
                ? (() => {
                    const rates = filteredRows
                      .map((r) => r.growthRate)
                      .filter((v) => Number.isFinite(v));
                    if (!rates.length) return undefined;
                    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
                    return avg.toFixed(2);
                  })()
                : undefined,
            trendDirection:
              latest.growthRate != null
                ? latest.growthRate > 0
                  ? "up"
                  : latest.growthRate < 0
                    ? "down"
                    : "stable"
                : undefined,
          }
        : null,
    [categoryConfig, latest, filteredRows]
  );

  const categoryAvgData = useMemo(() => {
    if (!categoryConfig || categoryConfig.slug === "general") {
      const byCat = new Map<string, number[]>();
      filteredRows.forEach((r) => {
        const c = r.category || "Other";
        if (!byCat.has(c)) byCat.set(c, []);
        byCat.get(c)!.push(r.index);
      });
      return Array.from(byCat.entries()).map(([name, arr]) => ({
        name,
        total: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
      }));
    }
    const bySub = new Map<string, number[]>();
    filteredRows.forEach((r) => {
      const s = r.subCategory || r.category || "Other";
      if (!bySub.has(s)) bySub.set(s, []);
      bySub.get(s)!.push(r.index);
    });
    return Array.from(bySub.entries()).map(([name, arr]) => ({
      name: name.length > 28 ? name.slice(0, 25) + "…" : name,
      total: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
    }));
  }, [categoryConfig, filteredRows]);

  const handleApply = () => {
    setSelectedYear(pendingYear);
    setSelectedSubCategory(pendingSubCategory);
  };
  const handleReset = () => {
    setPendingYear("ALL");
    setPendingSubCategory("ALL");
    setSelectedYear("ALL");
    setSelectedSubCategory("ALL");
  };

  const annualGeneral = useMemo(() => {
    if (!annualRaw) return [];
    return (annualRaw as Record<string, unknown>[])
      .filter((r) => r.type === "General" && r.category === "General")
      .map((r) => ({
        year: r.year,
        index: parseNum(r.index ?? r.index_value),
        growth: parseNum(r.growth_rate),
      }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  }, [annualRaw]);

  const annualSectoral = useMemo(() => {
    if (!annualRaw) return [];
    const sectors = (annualRaw as Record<string, unknown>[]).filter(
      (r) => r.type === "Sectoral" && !r.sub_category && r.category !== "General"
    );
    const byYear: Record<string, Record<string, unknown>> = {};
    sectors.forEach((r) => {
      const y = String(r.year);
      if (!byYear[y]) byYear[y] = { year: y };
      const cat = String(r.category);
      (byYear[y] as Record<string, unknown>)[cat] = parseNum(r.index ?? r.index_value);
      (byYear[y] as Record<string, unknown>)[`${cat}_growth`] = parseNum(r.growth_rate);
    });
    return Object.values(byYear).sort((a, b) =>
      String(a.year).localeCompare(String(b.year))
    );
  }, [annualRaw]);

  const useBasedBreakdown = useMemo(() => {
    if (!monthlyRaw) return [];
    const useBased = (monthlyRaw as Record<string, unknown>[]).filter(
      (r) => r.type === "Use-based category" && !r.sub_category
    );
    if (!useBased.length) return [];
    const sorted = [...useBased].sort((a, b) => {
      const ka = `${a.year}-${String(MONTH_ORDER.indexOf((a.month as string) || "")).padStart(2, "0")}`;
      const kb = `${b.year}-${String(MONTH_ORDER.indexOf((b.month as string) || "")).padStart(2, "0")}`;
      return kb.localeCompare(ka);
    });
    const latestMonth = sorted[0]?.month;
    const latestYear = sorted[0]?.year;
    return useBased
      .filter((r) => r.month === latestMonth && String(r.year) === String(latestYear))
      .map((r) => ({
        name: String(r.category),
        index: parseNum(r.index ?? r.index_value),
        growth: parseNum(r.growth_rate),
      }))
      .sort((a, b) => b.index - a.index);
  }, [monthlyRaw]);

  const mfgSubSectors = useMemo(() => {
    if (!annualRaw) return [];
    const mfg = (annualRaw as Record<string, unknown>[]).filter(
      (r) =>
        r.type === "Sectoral" &&
        r.category === "Manufacturing" &&
        r.sub_category
    );
    if (!mfg.length) return [];
    const years = [...new Set(mfg.map((r) => String(r.year)))].sort();
    const latestYear = years[years.length - 1];
    return mfg
      .filter((r) => String(r.year) === latestYear)
      .map((r) => ({
        name: String(r.sub_category)
          .replace("Manufacture of ", "")
          .slice(0, 30),
        index: parseNum(r.index ?? r.index_value),
        growth: parseNum(r.growth_rate),
      }))
      .sort((a, b) => b.index - a.index)
      .slice(0, 12);
  }, [annualRaw]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const latestGeneral = annualGeneral[annualGeneral.length - 1] as
    | { year: string; index: number; growth: number }
    | undefined;
  const latestSectoral = annualSectoral[annualSectoral.length - 1] as Record<string, unknown> | undefined;

  if (!categoryConfig) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Industrial Production (IIP)</h1>
          <p className="text-sm text-muted-foreground">Index of Industrial Production, MoSPI — choose a category</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 space-y-4"
        >
          <p className="text-base text-foreground text-center">
            Choose a category from the left sidebar (General, Mining, Manufacturing, Electricity, or use-based categories) to see index trends, growth, and intelligence briefing.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {IIP_CATEGORY_LIST.map((config) => (
              <Link
                key={config.slug}
                to={`/iip/${config.slug}`}
                className="text-sm text-primary hover:underline font-medium"
              >
                {config.displayName}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Industrial (IIP)</h1>
          <p className="text-sm text-muted-foreground">Index of Industrial Production by category. Select from the sidebar.</p>
        </div>
      </div>

      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/iip" className="text-muted-foreground hover:text-foreground transition-colors">
          Industrial (IIP)
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{categoryConfig.displayName}</span>
      </nav>

      {categoryConfig && iipOutlookContext && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border/60 bg-card/30 p-5"
        >
          <IipIntelligenceBriefing sectorName={categoryConfig.displayName} context={iipOutlookContext} />
        </motion.div>
      )}

      {categoryConfig && categoryImpact.sectorsAffected.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-foreground">Sectors affected</h2>
          <p className="text-sm text-muted-foreground">
            Industries most impacted by {categoryConfig.displayName}. Click a card for impact and solutions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryImpact.sectorsAffected.map((sectorName, index) => (
              <motion.button
                key={sectorName}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => setIipSectorForModal(sectorName)}
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
                      iipImpactStatus.variant === "negative" &&
                        "bg-destructive/15 text-destructive border border-destructive/30",
                      iipImpactStatus.variant === "positive" &&
                        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                      iipImpactStatus.variant === "neutral" &&
                        "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {iipImpactStatus.label}
                  </span>
                  {latest?.growthRate != null && (
                    <span className="text-xs text-muted-foreground">
                      IIP growth: {latest.growthRate.toFixed(2)}%
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      <Dialog open={!!iipSectorForModal} onOpenChange={(open) => !open && setIipSectorForModal(null)}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border/60 bg-card shadow-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              {iipSectorForModal && (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  {iipSectorForModal}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {iipSectorForModal && categoryConfig && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-foreground">
                <strong>Affected:</strong> Yes — this sector is linked to IIP category {categoryConfig.displayName}.
              </p>
              <p className="text-sm text-foreground">
                <strong>Impact:</strong> {iipImpactStatus.label}.
              </p>
              <p className="text-sm text-foreground">
                Category {categoryConfig.displayName} IIP growth (latest):{" "}
                {latest?.growthRate != null ? `${latest.growthRate.toFixed(2)}%` : "—"}.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FilterBar
        filters={[
          {
            label: "Year",
            value: pendingYear,
            onChange: setPendingYear,
            options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })),
          },
          {
            label: "Sub-category",
            value: pendingSubCategory,
            onChange: setPendingSubCategory,
            options: subCategoryOptions.map((s) => ({
              value: s,
              label: s === "ALL" ? "All sub-categories" : s,
            })),
          },
        ]}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="flex items-center gap-2">
        <Link to="/iip" className="text-xs text-muted-foreground hover:text-foreground underline">
          View all categories
        </Link>
      </div>

      {iipRisk && (
        <AlertBanner level={iipRisk.type} title={iipRisk.title} message={iipRisk.message} />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIBox
          icon={<Factory className="w-4 h-4" />}
          label={categoryConfig.displayName}
          value={latest?.index}
          growth={latest?.growthRate}
          period={latest?.periodLabel}
        />
        <KPIBox
          icon={<Pickaxe className="w-4 h-4" />}
          label="Mining"
          value={latestSectoral?.Mining as number}
          growth={latestSectoral?.Mining_growth as number}
          period={latestSectoral?.year as string}
        />
        <KPIBox
          icon={<Factory className="w-4 h-4" />}
          label="Manufacturing"
          value={latestSectoral?.Manufacturing as number}
          growth={latestSectoral?.Manufacturing_growth as number}
          period={latestSectoral?.year as string}
        />
        <KPIBox
          icon={<Zap className="w-4 h-4" />}
          label="Electricity"
          value={latestSectoral?.Electricity as number}
          growth={latestSectoral?.Electricity_growth as number}
          period={latestSectoral?.year as string}
        />
      </div>

      {/* IIP Index and Growth Rate — full width, stacked down by down for clarity */}
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">
            IIP Index by Month — {categoryConfig.displayName}
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indexByPeriod} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 22%)" />
                <XAxis
                  dataKey="periodLabel"
                  stroke="hsl(215 20% 55%)"
                  fontSize={11}
                  fontFamily="JetBrains Mono"
                  interval={Math.max(0, Math.floor(indexByPeriod.length / 14))}
                  angle={-45}
                  textAnchor="end"
                  height={56}
                  tick={{ fill: "hsl(215 20% 65%)" }}
                />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={11} fontFamily="JetBrains Mono" width={44} tick={{ fill: "hsl(215 20% 65%)" }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontFamily: "JetBrains Mono" }} />
                <Line type="monotone" dataKey="index" stroke="hsl(187 92% 50%)" strokeWidth={2.5} dot={false} name="IIP index" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-medium text-foreground mb-4">
            Growth Rate by Month (%) — {categoryConfig.displayName}
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthByPeriod} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 22%)" />
                <XAxis
                  dataKey="periodLabel"
                  stroke="hsl(215 20% 55%)"
                  fontSize={11}
                  fontFamily="JetBrains Mono"
                  interval={Math.max(0, Math.floor(growthByPeriod.length / 14))}
                  angle={-45}
                  textAnchor="end"
                  height={56}
                  tick={{ fill: "hsl(215 20% 65%)" }}
                />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={11} fontFamily="JetBrains Mono" width={44} tick={{ fill: "hsl(215 20% 65%)" }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontFamily: "JetBrains Mono" }} />
                <Line
                  type="monotone"
                  dataKey="growthRate"
                  stroke="hsl(0 72% 55%)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Growth rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-medium text-foreground mb-4">
            Average IIP by {categoryConfig.slug === "general" ? "Category" : "Sub-category"}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryAvgData}>
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
                <Bar dataKey="total" fill="hsl(160 84% 45%)" name="Avg Index" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-medium text-foreground mb-4">
            Latest Snapshot
          </h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Latest period</div>
              <div className="font-mono font-bold">{latest ? latest.periodLabel : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">IIP index</div>
              <div className="font-mono font-bold">{latest ? latest.index.toFixed(1) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Growth rate</div>
              <div className="font-mono font-bold">
                {latest?.growthRate != null ? `${latest.growthRate.toFixed(2)} %` : "—"}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Annual General IIP Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={annualGeneral}>
                <defs>
                  <linearGradient id="iipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187 92% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(187 92% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="hsl(187 92% 50%)"
                  fill="url(#iipGrad)"
                  strokeWidth={2}
                  name="IIP Index"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Sectoral Index (Mining, Manufacturing, Electricity)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={annualSectoral}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="Mining" stroke="hsl(38 92% 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Manufacturing" stroke="hsl(187 92% 50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Electricity" stroke="hsl(160 84% 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5"
        >
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Use-Based Categories (Latest Month)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={useBasedBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="hsl(215 20% 55%)"
                  fontSize={8}
                  fontFamily="JetBrains Mono"
                  width={120}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="index" fill="hsl(280 65% 60%)" name="Index" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-5"
        >
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Top Manufacturing Sub-Sectors
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mfgSubSectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="hsl(215 20% 55%)"
                  fontSize={7}
                  fontFamily="JetBrains Mono"
                  width={130}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="index" name="Index" radius={[0, 3, 3, 0]}>
                  {mfgSubSectors.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        [
                          "hsl(187 92% 50%)",
                          "hsl(160 84% 45%)",
                          "hsl(38 92% 55%)",
                          "hsl(280 65% 60%)",
                          "hsl(0 72% 55%)",
                          "hsl(215 20% 55%)",
                        ][i % 6]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Future predictions — General IIP outlook (shown on all pages for context) */}
      {iipForecast &&
        iipForecast.forecastLine &&
        iipForecast.forecastLine.length > 0 &&
        (iipForecast.history?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-medium text-foreground px-1">Future predictions</h3>
            <PredictionCard
              title={categoryConfig.slug === "general" ? "General IIP outlook" : "Overall IIP outlook (General)"}
              status={
                iipForecast.projectedGrowth != null && iipForecast.projectedGrowth < 0
                  ? "pressure"
                  : "stable"
              }
              metrics={[
                {
                  label: "Current index (latest month)",
                  value:
                    iipForecast.currentIndex != null
                      ? iipForecast.currentIndex.toFixed(1)
                      : "—",
                },
                {
                  label: "Projected index (6 months ahead)",
                  value:
                    iipForecast.projectedIndex != null
                      ? iipForecast.projectedIndex.toFixed(1)
                      : "—",
                },
                {
                  label: "Projected growth (6M)",
                  value:
                    iipForecast.projectedGrowth != null
                      ? `${iipForecast.projectedGrowth >= 0 ? "+" : ""}${iipForecast.projectedGrowth.toFixed(2)}%`
                      : "—",
                },
              ]}
            >
              <ForecastChart
                  data={iipForecast.forecastLine as Record<string, unknown>[]}
                  xKey="periodLabel"
                  actualKey="index"
                  forecastKey="index"
                  actualName="IIP index (actual)"
                  forecastName="IIP index (projected)"
                  historyLength={iipForecast.history?.length ?? 0}
                  height={280}
                  historyColor="hsl(217 91% 60%)"
                  forecastColor="hsl(187 92% 50%)"
                />
            </PredictionCard>
          </motion.div>
        )}

      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground font-mono">
          Annual records: {annualRaw?.length ?? "—"} · Monthly records: {monthlyRaw?.length ?? "—"} · Filtered:{" "}
          {filteredRows.length} · Base Year: 2011-12
        </p>
      </div>
    </div>
  );
};

function KPIBox({
  icon,
  label,
  value,
  growth,
  period,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  growth?: number;
  period?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">
        {value != null ? value.toFixed(1) : "—"}
      </div>
      <div className="flex items-center gap-2 mt-1">
        {growth != null && (
          <span
            className={`flex items-center gap-0.5 text-xs font-mono ${
              growth >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}%
          </span>
        )}
        {period && <span className="text-xs text-muted-foreground font-mono">{period}</span>}
      </div>
    </motion.div>
  );
}

export default IndustrialProduction;
