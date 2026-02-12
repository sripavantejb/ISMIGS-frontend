import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Building2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { useGVADetailed } from "@/hooks/useMacroData";
import { normalizeGvaRows, aggregateGvaByYear } from "@/utils/gvaLogic";
import { FilterBar } from "@/components/FilterBar";

const tooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 22%)",
  borderRadius: "8px",
  fontFamily: "JetBrains Mono",
  fontSize: "12px",
};

const GVAPage = () => {
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");
  const [selectedSubindustry, setSelectedSubindustry] = useState("ALL");
  const [selectedInstitution, setSelectedInstitution] = useState("ALL");
  const [pendingYear, setPendingYear] = useState("ALL");
  const [pendingIndustry, setPendingIndustry] = useState("ALL");
  const [pendingSubindustry, setPendingSubindustry] = useState("ALL");
  const [pendingInstitution, setPendingInstitution] = useState("ALL");

  const { data: raw, isLoading } = useGVADetailed();

  const allRows = useMemo(
    () => (raw ? normalizeGvaRows(raw as any) : []),
    [raw]
  );

  const yearsOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => set.add(r.fiscalYear));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const industryOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.industry && set.add(r.industry));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const subindustryOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.subindustry && set.add(r.subindustry));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const institutionOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.institutionalSector && set.add(r.institutionalSector));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (selectedYear !== "ALL" && r.fiscalYear !== selectedYear) return false;
      if (selectedIndustry !== "ALL" && r.industry !== selectedIndustry) return false;
      if (selectedSubindustry !== "ALL" && r.subindustry !== selectedSubindustry) return false;
      if (selectedInstitution !== "ALL" && r.institutionalSector !== selectedInstitution) return false;
      return true;
    });
  }, [allRows, selectedYear, selectedIndustry, selectedSubindustry, selectedInstitution]);

  const byYearTotals = useMemo(() => aggregateGvaByYear(filteredRows), [filteredRows]);

  const byIndustryTotals = useMemo(() => {
    const byInd = new Map<string, number>();
    filteredRows.forEach((r) => {
      const key = r.industry || "Other";
      byInd.set(key, (byInd.get(key) || 0) + r.currentPrice);
    });
    return Array.from(byInd.entries()).map(([name, total]) => ({ name, total }));
  }, [filteredRows]);

  const latest = byYearTotals.length > 0 ? byYearTotals[byYearTotals.length - 1] : null;

  const handleApply = () => {
    setSelectedYear(pendingYear);
    setSelectedIndustry(pendingIndustry);
    setSelectedSubindustry(pendingSubindustry);
    setSelectedInstitution(pendingInstitution === "ALL" ? "ALL" : pendingInstitution);
  };
  const handleReset = () => {
    setPendingYear("ALL");
    setPendingIndustry("ALL");
    setPendingSubindustry("ALL");
    setPendingInstitution("ALL");
    setSelectedYear("ALL");
    setSelectedIndustry("ALL");
    setSelectedSubindustry("ALL");
    setSelectedInstitution("ALL");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gross Value Added (GVA)</h1>
        <p className="text-sm text-muted-foreground">Industry-wise GVA at current and constant prices, MoSPI NAS</p>
      </div>

      <FilterBar
        filters={[
          { label: "Year", value: pendingYear, onChange: setPendingYear, options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })) },
          { label: "Industry", value: pendingIndustry, onChange: setPendingIndustry, options: industryOptions.map((i) => ({ value: i, label: i === "ALL" ? "All industries" : i })) },
          { label: "Subindustry", value: pendingSubindustry, onChange: setPendingSubindustry, options: subindustryOptions.map((s) => ({ value: s, label: s === "ALL" ? "All subindustries" : s })) },
          { label: "Institution", value: pendingInstitution, onChange: setPendingInstitution, options: institutionOptions.map((s) => ({ value: s || "ALL", label: s === "ALL" || !s ? "All institutional sectors" : s })) },
        ]}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Total GVA by Year (Current Prices)</h3>
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
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">GVA by Industry (Current Prices)</h3>
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
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Latest Snapshot</h3>
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

      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground font-mono">
          GVA records loaded: {raw?.length ?? 0} · Filtered: {filteredRows.length}
        </p>
      </div>
    </div>
  );
};

export default GVAPage;
