import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Factory, Zap, Pickaxe, TrendingUp, TrendingDown } from "lucide-react";
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
import { normalizeIipMonthly, detectThreeNegativeGrowth } from "@/utils/iipLogic";
import { detectIipRisk } from "@/utils/riskRules";
import { FilterBar } from "@/components/FilterBar";
import { AlertBanner } from "@/components/AlertBanner";

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

const IndustrialProduction = () => {
  const { data: annualRaw, isLoading: l1 } = useIIPAnnual();
  const { data: monthlyRaw, isLoading: l2 } = useIIPMonthly();

  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
  const [pendingYear, setPendingYear] = useState("ALL");
  const [pendingType, setPendingType] = useState("ALL");
  const [pendingCategory, setPendingCategory] = useState("ALL");
  const [pendingSubCategory, setPendingSubCategory] = useState("ALL");

  const isLoading = l1 || l2;

  const allRows = useMemo(
    () => (monthlyRaw ? normalizeIipMonthly(monthlyRaw as any) : []),
    [monthlyRaw]
  );

  const yearsOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => set.add(String(r.year)));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.type && set.add(r.type));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.category && set.add(r.category));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const subCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.subCategory && set.add(r.subCategory));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (selectedYear !== "ALL" && String(r.year) !== selectedYear) return false;
      if (selectedType !== "ALL" && r.type !== selectedType) return false;
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
      if (selectedSubCategory !== "ALL" && r.subCategory !== selectedSubCategory) return false;
      return true;
    });
  }, [allRows, selectedYear, selectedType, selectedCategory, selectedSubCategory]);

  const hasStress = useMemo(() => detectThreeNegativeGrowth(filteredRows), [filteredRows]);
  const iipRisk = useMemo(
    () => (hasStress ? { id: "iip-stress", type: "warning" as const, title: "Industrial Stress Alert", message: "Detected 3 consecutive months of negative IIP growth." } : null),
    [hasStress]
  );

  const latest = filteredRows.length > 0 ? filteredRows[filteredRows.length - 1] : null;
  const indexByPeriod = filteredRows;
  const growthByPeriod = filteredRows;

  const categoryAvgData = useMemo(() => {
    return categoryOptions
      .filter((c) => c !== "ALL")
      .map((c) => {
        const subset = filteredRows.filter((r) => r.category === c);
        if (!subset.length) return { name: c, total: 0 };
        const avg = subset.reduce((sum, r) => sum + r.index, 0) / subset.length;
        return { name: c, total: avg };
      });
  }, [categoryOptions, filteredRows]);

  const handleApply = () => {
    setSelectedYear(pendingYear);
    setSelectedType(pendingType);
    setSelectedCategory(pendingCategory);
    setSelectedSubCategory(pendingSubCategory);
  };
  const handleReset = () => {
    setPendingYear("ALL");
    setPendingType("ALL");
    setPendingCategory("ALL");
    setPendingSubCategory("ALL");
    setSelectedYear("ALL");
    setSelectedType("ALL");
    setSelectedCategory("ALL");
    setSelectedSubCategory("ALL");
  };

  // Legacy: annual and monthly for charts
  const annualGeneral = useMemo(() => {
    if (!annualRaw) return [];
    return (annualRaw as any[])
      .filter((r) => r.type === "General" && r.category === "General")
      .map((r) => ({ year: r.year, index: parseNum(r.index), growth: parseNum(r.growth_rate) }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  }, [annualRaw]);

  const annualSectoral = useMemo(() => {
    if (!annualRaw) return [];
    const sectors = (annualRaw as any[]).filter((r) => r.type === "Sectoral" && !r.sub_category && r.category !== "General");
    const byYear: Record<string, any> = {};
    sectors.forEach((r) => {
      if (!byYear[r.year]) byYear[r.year] = { year: r.year };
      byYear[r.year][r.category] = parseNum(r.index);
      byYear[r.year][`${r.category}_growth`] = parseNum(r.growth_rate);
    });
    return Object.values(byYear).sort((a, b) => String(a.year).localeCompare(String(b.year)));
  }, [annualRaw]);

  const electricityTrend = useMemo(() => {
    if (!monthlyRaw) return [];
    let filtered = (monthlyRaw as any[]).filter((r) => r.type === "Sectoral" && r.category === "Electricity" && !r.sub_category);
    if (selectedYear !== "ALL") {
      filtered = filtered.filter((r) => String(r.year) === selectedYear);
    }
    return filtered
      .map((r) => ({
        label: `${r.month?.slice(0, 3)} ${String(r.year).slice(-2)}`,
        index: parseNum(r.index),
        growth: parseNum(r.growth_rate),
        sortKey: `${r.year}-${String(MONTH_ORDER.indexOf(r.month)).padStart(2, "0")}`,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [monthlyRaw, selectedYear]);

  const useBasedBreakdown = useMemo(() => {
    if (!monthlyRaw) return [];
    const useBased = (monthlyRaw as any[]).filter((r) => r.type === "Use-based category" && !r.sub_category);
    if (!useBased.length) return [];
    const sorted = [...useBased].sort((a, b) => {
      const ka = `${a.year}-${String(MONTH_ORDER.indexOf(a.month)).padStart(2, "0")}`;
      const kb = `${b.year}-${String(MONTH_ORDER.indexOf(b.month)).padStart(2, "0")}`;
      return kb.localeCompare(ka);
    });
    const latestMonth = sorted[0]?.month;
    const latestYear = sorted[0]?.year;
    return useBased
      .filter((r) => r.month === latestMonth && String(r.year) === String(latestYear))
      .map((r) => ({
        name: r.category,
        index: parseNum(r.index),
        growth: parseNum(r.growth_rate),
      }))
      .sort((a, b) => b.index - a.index);
  }, [monthlyRaw]);

  const mfgSubSectors = useMemo(() => {
    if (!annualRaw) return [];
    const mfg = (annualRaw as any[]).filter((r) => r.type === "Sectoral" && r.category === "Manufacturing" && r.sub_category);
    if (!mfg.length) return [];
    const years = [...new Set(mfg.map((r) => String(r.year)))].sort();
    const latestYear = years[years.length - 1];
    return mfg
      .filter((r) => String(r.year) === latestYear)
      .map((r) => ({
        name: String(r.sub_category).replace("Manufacture of ", "").slice(0, 30),
        index: parseNum(r.index),
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

  const latestGeneral = annualGeneral[annualGeneral.length - 1];
  const latestSectoral = annualSectoral[annualSectoral.length - 1] as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Industrial Production (IIP)</h1>
          <p className="text-sm text-muted-foreground">Monthly Index of Industrial Production, MoSPI</p>
        </div>
      </div>

      <FilterBar
        filters={[
          { label: "Year", value: pendingYear, onChange: setPendingYear, options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })) },
          { label: "Type", value: pendingType, onChange: setPendingType, options: typeOptions.map((t) => ({ value: t, label: t === "ALL" ? "All types" : t })) },
          { label: "Category", value: pendingCategory, onChange: setPendingCategory, options: categoryOptions.map((c) => ({ value: c, label: c === "ALL" ? "All categories" : c })) },
          { label: "Sub-category", value: pendingSubCategory, onChange: setPendingSubCategory, options: subCategoryOptions.map((s) => ({ value: s, label: s === "ALL" ? "All sub-categories" : s })) },
        ]}
        onApply={handleApply}
        onReset={handleReset}
      />

      {iipRisk && <AlertBanner level={iipRisk.type} title={iipRisk.title} message={iipRisk.message} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIBox icon={<Factory className="w-4 h-4" />} label="General IIP" value={latestGeneral?.index} growth={latestGeneral?.growth} year={String(latestGeneral?.year)} />
        <KPIBox icon={<Pickaxe className="w-4 h-4" />} label="Mining" value={latestSectoral?.Mining as number} growth={latestSectoral?.Mining_growth as number} year={String(latestSectoral?.year)} />
        <KPIBox icon={<Factory className="w-4 h-4" />} label="Manufacturing" value={latestSectoral?.Manufacturing as number} growth={latestSectoral?.Manufacturing_growth as number} year={String(latestSectoral?.year)} />
        <KPIBox icon={<Zap className="w-4 h-4" />} label="Electricity" value={latestSectoral?.Electricity as number} growth={latestSectoral?.Electricity_growth as number} year={String(latestSectoral?.year)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">IIP Index by Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indexByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="periodLabel" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" interval={Math.max(0, Math.floor(indexByPeriod.length / 12))} angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="index" stroke="hsl(187 92% 50%)" strokeWidth={2} name="IIP index" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Growth Rate by Month (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="periodLabel" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" interval={Math.max(0, Math.floor(growthByPeriod.length / 12))} angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="growthRate" stroke="hsl(0 72% 55%)" strokeWidth={2} name="Growth rate (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Average IIP by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryAvgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" fill="hsl(160 84% 45%)" name="Avg Index" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Latest Snapshot</h3>
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
              <div className="font-mono font-bold">{latest?.growthRate != null ? `${latest.growthRate.toFixed(2)} %` : "—"}</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Annual General IIP Trend</h3>
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
                <Area type="monotone" dataKey="index" stroke="hsl(187 92% 50%)" fill="url(#iipGrad)" strokeWidth={2} name="IIP Index" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Sectoral Index</h3>
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Use-Based Categories (Latest Month)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={useBasedBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis dataKey="name" type="category" stroke="hsl(215 20% 55%)" fontSize={8} fontFamily="JetBrains Mono" width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="index" fill="hsl(280 65% 60%)" name="Index" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Top Manufacturing Sub-Sectors</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mfgSubSectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis dataKey="name" type="category" stroke="hsl(215 20% 55%)" fontSize={7} fontFamily="JetBrains Mono" width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="index" name="Index" radius={[0, 3, 3, 0]}>
                  {mfgSubSectors.map((_, i) => (
                    <Cell key={i} fill={["hsl(187 92% 50%)", "hsl(160 84% 45%)", "hsl(38 92% 55%)", "hsl(280 65% 60%)", "hsl(0 72% 55%)", "hsl(215 20% 55%)"][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground font-mono">
          Annual records: {annualRaw?.length ?? "loading…"} · Monthly records: {monthlyRaw?.length ?? "loading…"} · Base Year: 2011-12
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
  year,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  growth?: number;
  year?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">
        {value != null ? value.toFixed(1) : "—"}
      </div>
      <div className="flex items-center gap-2 mt-1">
        {growth != null && (
          <span className={`flex items-center gap-0.5 text-xs font-mono ${growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
          </span>
        )}
        {year && <span className="text-xs text-muted-foreground font-mono">{year}</span>}
      </div>
    </motion.div>
  );
}

export default IndustrialProduction;
