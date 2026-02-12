import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Loader2, TrendingUp, TrendingDown, Flame, Wheat, Factory } from "lucide-react";
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
import { PredictionCard } from "@/components/PredictionCard";
import { ForecastChart } from "@/components/ForecastChart";

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
  const { wpi: wpiForecast } = useForecast();

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

  useEffect(() => {
    if (majorGroupSlug && allRows.length > 0 && !selectedMajorGroupDisplay) {
      navigate("/wpi", { replace: true });
    }
  }, [majorGroupSlug, allRows.length, selectedMajorGroupDisplay, navigate]);

  const baseRows = useMemo(() => {
    if (!apiMajorGroupValue) return allRows;
    return allRows.filter((r) => r.majorgroup === apiMajorGroupValue);
  }, [allRows, apiMajorGroupValue]);

  const yearsOptions = useMemo(() => {
    const set = new Set<number>();
    baseRows.forEach((r) => set.add(r.year));
    return ["ALL", ...Array.from(set).sort((a, b) => a - b).map(String)];
  }, [baseRows]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const latestWPI = overallWPIChart[overallWPIChart.length - 1];
  const prevWPI = overallWPIChart.length > 1 ? overallWPIChart[overallWPIChart.length - 2] : null;
  const wpiChange =
    latestWPI && prevWPI ? ((latestWPI.index - prevWPI.index) / prevWPI.index) * 100 : null;
  const latestMajor = majorGroupTrend[majorGroupTrend.length - 1] as Record<string, number> | undefined;

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
    <div className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{selectedMajorGroupDisplay}</h1>
        <p className="text-sm text-muted-foreground">WPI inflation trends for this category</p>
      </div>

      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/wpi" className="text-muted-foreground hover:text-foreground transition-colors">
          Inflation (WPI)
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{selectedMajorGroupDisplay}</span>
      </nav>

      {selectedMajorGroupDisplay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border/60 bg-card/30 p-5"
        >
          <WpiIntelligenceBriefing
            sectorName={selectedMajorGroupDisplay}
            context={wpiOutlookContext}
          />
        </motion.div>
      )}

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

      {wpiRisk && <AlertBanner level={wpiRisk.type} title={wpiRisk.title} message={wpiRisk.message} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIBox icon={<TrendingUp className="w-4 h-4" />} label="WPI Index" value={latestWPI?.index} change={wpiChange} />
        <KPIBox icon={<Wheat className="w-4 h-4" />} label="Primary Articles" value={latestMajor?.["Primary articles"]} />
        <KPIBox icon={<Flame className="w-4 h-4" />} label="Fuel & Power" value={latestMajor?.["Fuel & power"]} />
        <KPIBox icon={<Factory className="w-4 h-4" />} label="Manufactured" value={latestMajor?.["Manufactured products"]} />
      </div>

      <div className="flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Monthly WPI Index</h3>
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Monthly Inflation (MoM %)</h3>
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

      {wpiForecast && wpiForecast.forecastLine && wpiForecast.forecastLine.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PredictionCard
            title="Inflation (WPI) outlook"
            status={wpiForecast.status === "pressure" ? "pressure" : "stable"}
            metrics={[
              {
                label: `Projected average WPI inflation (${wpiForecast.nextYear})`,
                value:
                  wpiForecast.projectedInflation != null && Number.isFinite(wpiForecast.projectedInflation)
                    ? `${wpiForecast.projectedInflation.toFixed(2)} %`
                    : "—",
              },
            ]}
          >
            <ForecastChart
              data={wpiForecast.forecastLine as Record<string, unknown>[]}
              xKey="x"
              actualKey="avgInflationPct"
              forecastKey="avgInflationPct"
              actualName="Average annual inflation"
              forecastName="Projected inflation"
              historyLength={wpiForecast.history?.length ?? 0}
              height={224}
              historyColor="hsl(217 91% 60%)"
              forecastColor="hsl(38 92% 50%)"
            />
          </PredictionCard>
        </motion.div>
      )}

      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground font-mono">
          WPI records loaded: {wpiRaw?.length ?? "loading…"} · Filtered: {filteredRows.length}
        </p>
      </div>
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
