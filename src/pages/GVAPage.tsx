import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Loader2, Lightbulb, Users, AlertCircle, Sparkles, ChevronDown, ChevronUp, Building2 } from "lucide-react";
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
import { normalizeGvaRows, aggregateGvaByYear } from "@/utils/gvaLogic";
import { resolveGvaIndustryFromSlug, gvaIndustryToSlug } from "@/utils/gvaSlug";
import { useGVAIndustryList } from "@/hooks/useGVAIndustryList";
import { FilterBar } from "@/components/FilterBar";
import { GVAIndustryHero } from "@/components/GVAIndustryHero";

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

  const { data: raw, isLoading } = useGVADetailed();

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
    const set = new Set<string>();
    baseRows.forEach((r) => set.add(r.fiscalYear));
    return ["ALL", ...Array.from(set).sort()];
  }, [baseRows]);

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

  const { data: impactContent, loading: impactLoading, error: impactError } = useGVAImpact(
    selectedIndustry ?? null,
    latest?.fiscalYear,
    trendData
  );

  const handleApply = () => {
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
    <div className="min-h-screen p-6 space-y-6">
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

      {/* GVA Intelligence — skeleton when loading so layout is not blocking */}
      {impactLoading && (
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

      {!impactLoading && !impactError && impactContent && (
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

      {/* Sectors affected — click opens popup; show skeleton when loading */}
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
                className="w-full flex items-center gap-3 p-4 text-left rounded-xl border border-border/60 bg-card/50 hover:bg-muted/30 hover:border-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
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

      <div className="flex items-center gap-2">
        <Link to="/gva" className="text-xs text-muted-foreground hover:text-foreground underline">
          View all industries
        </Link>
      </div>

      <FilterBar
        filters={[
          { label: "Year", value: pendingYear, onChange: setPendingYear, options: yearsOptions.map((y) => ({ value: y, label: y === "ALL" ? "All years" : y })) },
          { label: "Subindustry", value: pendingSubindustry, onChange: setPendingSubindustry, options: subindustryOptions.map((s) => ({ value: s, label: s === "ALL" ? "All subindustries" : s })) },
          { label: "Institution", value: pendingInstitution, onChange: setPendingInstitution, options: institutionOptions.map((s) => ({ value: s || "ALL", label: s === "ALL" || !s ? "All sectors" : s })) },
        ]}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
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

      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground font-mono">
          GVA records loaded: {raw?.length ?? 0} · Filtered: {filteredRows.length} · Industry: {selectedIndustry}
        </p>
      </div>
    </div>
  );
};

export default GVAPage;
