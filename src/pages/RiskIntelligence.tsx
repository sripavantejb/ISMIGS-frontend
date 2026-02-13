import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, TrendingUp, Activity, Brain, Loader2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCPIData } from "@/hooks/useCPIData";
import { getUniqueStates, getLatestPeriod, getStateDataForPeriod, computeVolatility, getStateTimeSeries, getRiskLevelFromInflation } from "@/services/cpiDataService";
import { forecastAllStates, ForecastResult } from "@/services/cpiForecastEngine";
import { generateAlerts } from "@/services/stateAlertEngine";
import { computeAllCorrelations, CorrelationResult } from "@/services/agriCpiCorrelationEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const RiskIntelligence = () => {
  const { data: cpiData, isLoading } = useCPIData();
  const [labourType, setLabourType] = useState<"AL" | "RL">("AL");
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const states = useMemo(() => cpiData ? getUniqueStates(cpiData) : [], [cpiData]);
  const latest = useMemo(() => cpiData ? getLatestPeriod(cpiData) : { year: "", month: "" }, [cpiData]);
  const stateMap = useMemo(() => cpiData && latest.year ? getStateDataForPeriod(cpiData, latest.year, latest.month, labourType) : new Map(), [cpiData, latest, labourType]);

  const forecasts = useMemo<ForecastResult[]>(() => {
    if (!cpiData || states.length === 0) return [];
    return forecastAllStates(cpiData, states, labourType, 12);
  }, [cpiData, states, labourType]);

  const alerts = useMemo(() => {
    if (!cpiData || states.length === 0) return [];
    return generateAlerts(cpiData, states, labourType, forecasts);
  }, [cpiData, states, labourType, forecasts]);

  const correlations = useMemo<CorrelationResult[]>(() => {
    if (!cpiData || states.length === 0) return [];
    return computeAllCorrelations(cpiData, states);
  }, [cpiData, states]);

  const riskData = useMemo(() => {
    return states.map(s => {
      const info = stateMap.get(s);
      const fc = forecasts.find(f => f.state === s);
      const corr = correlations.find(c => c.state === s);
      const risk = getRiskLevelFromInflation(info?.inflation ?? null);
      const vol = cpiData ? computeVolatility(
        getStateTimeSeries(cpiData, s).map(r => labourType === "AL" ? r.indexAL : r.indexRL).filter(v => v > 0).slice(-12)
      ) : 0;
      return {
        state: s,
        riskLevel: risk,
        volatility: vol,
        forecastGrowth: fc?.projectedGrowthRate ?? 0,
        acceleration: fc?.accelerationScore ?? 0,
        stressIndex: corr?.stressIndex ?? 0,
        stabilityScore: corr?.stabilityScore ?? 100,
        cagr: corr?.cagr ?? 0,
        inflation: info?.inflation ?? 0,
        riskScore: (risk === "Critical" ? 4 : risk === "High" ? 3 : risk === "Moderate" ? 2 : 1) + vol * 0.5 + (fc?.accelerationScore ?? 0) * 0.3 + (corr?.stressIndex ?? 0) * 0.2,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [states, stateMap, forecasts, correlations, cpiData, labourType]);

  // Scatter data for stress vs stability
  const scatterData = useMemo(() => {
    return correlations.map(c => ({
      state: c.state,
      stressIndex: c.stressIndex,
      stabilityScore: c.stabilityScore,
      cagr: Math.abs(c.cagr),
    }));
  }, [correlations]);

  // Top stress states bar chart
  const stressBarData = useMemo(() => {
    return riskData.slice(0, 15).map(r => ({
      state: r.state.length > 12 ? r.state.substring(0, 10) + "…" : r.state,
      fullName: r.state,
      riskScore: +r.riskScore.toFixed(1),
      stressIndex: r.stressIndex,
    }));
  }, [riskData]);

  const fetchAIInsight = useCallback(async () => {
    if (riskData.length === 0) return;
    setAiLoading(true);
    setAiInsight(null);
    try {
      const { data, error } = await supabase.functions.invoke("cpi-insights", {
        body: {
          stateData: riskData.slice(0, 10),
          alerts: alerts.slice(0, 8),
          forecasts: forecasts
            .filter(f => f.forecastValues.length > 0)
            .sort((a, b) => b.projectedGrowthRate - a.projectedGrowthRate)
            .slice(0, 5),
          labourType,
        },
      });
      if (error) throw error;
      setAiInsight(data.insight);
    } catch (e: any) {
      console.error("AI insight error:", e);
      toast.error(e.message || "Failed to generate AI insight");
    } finally {
      setAiLoading(false);
    }
  }, [riskData, alerts, forecasts, labourType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    );
  }

  const highRiskCount = riskData.filter(r => r.riskLevel === "Critical" || r.riskLevel === "High").length;
  const avgStress = correlations.length > 0 ? +(correlations.reduce((a, c) => a + c.stressIndex, 0) / correlations.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-background grid-pattern p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Risk Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Combined stress index, AL-RL correlation, and predictive risk analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 glass-card rounded-lg overflow-hidden">
              <button onClick={() => setLabourType("AL")} className={`px-3 py-1.5 text-xs font-mono transition-colors ${labourType === "AL" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Agricultural</button>
              <button onClick={() => setLabourType("RL")} className={`px-3 py-1.5 text-xs font-mono transition-colors ${labourType === "RL" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Rural</button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">High-Risk States</div>
            <div className="font-mono font-bold text-2xl text-critical">{highRiskCount}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Alerts</div>
            <div className="font-mono font-bold text-2xl text-warning">{alerts.length}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Stress Index</div>
            <div className="font-mono font-bold text-2xl text-stress">{avgStress}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">States Monitored</div>
            <div className="font-mono font-bold text-2xl text-primary">{states.length}</div>
          </div>
        </div>

        {/* AI Insight Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" /> AI Intelligence Briefing
            </h3>
            <button
              onClick={fetchAIInsight}
              disabled={aiLoading}
              className="flex items-center gap-2 glass-card px-3 py-1.5 text-xs font-mono text-primary hover:bg-primary/10 transition-colors rounded-lg disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {aiLoading ? "Analyzing..." : aiInsight ? "Refresh" : "Generate Insight"}
            </button>
          </div>
          {aiInsight ? (
            <div className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground leading-relaxed">
              <ReactMarkdown>{aiInsight}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Click "Generate Insight" to get an AI-powered intelligence briefing based on current data.</p>
          )}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Score Ranking */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🚨 Combined Risk Score — Top 15</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stressBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} />
                <YAxis dataKey="state" type="category" tick={{ fontSize: 9, fill: "hsl(215, 20%, 55%)" }} width={90} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 8 }} />
                <Bar dataKey="riskScore" name="Risk Score" radius={[0, 4, 4, 0]}>
                  {stressBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.riskScore > 5 ? "hsl(0, 72%, 55%)" : entry.riskScore > 3 ? "hsl(25, 95%, 55%)" : "hsl(38, 92%, 55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Stress vs Stability Scatter */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">📊 Stress vs Stability Matrix</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="stressIndex" name="Stress Index" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} label={{ value: "Stress Index", position: "bottom", fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
                <YAxis type="number" dataKey="stabilityScore" name="Stability Score" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} label={{ value: "Stability Score", angle: -90, position: "insideLeft", fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
                <ZAxis type="number" dataKey="cagr" range={[40, 200]} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 8 }}
                  formatter={(value: number, name: string) => [value.toFixed(1), name]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.state || ""}
                />
                <Legend />
                <Scatter name="States" data={scatterData} fill="hsl(38, 92%, 55%)" />
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
              <AlertTriangle className="w-4 h-4 inline mr-2 text-warning" />Active Alerts ({alerts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {alerts.slice(0, 10).map((a, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${a.severity === "Red" ? "bg-critical/10 border border-critical/30 text-critical" : "bg-warning/10 border border-warning/30 text-warning"}`}>
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="font-bold shrink-0">{a.state}</span>
                  <span className="flex-1 truncate">{a.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Full Risk Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">📋 Complete State Risk Assessment</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono">#</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono">State</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Risk</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Volatility</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Forecast</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Stress</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Stability</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">CAGR</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Score</th>
                </tr>
              </thead>
              <tbody>
                {riskData.map((r, i) => (
                  <tr key={r.state} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                    <td className="py-2 px-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{r.state}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        r.riskLevel === "Critical" ? "bg-critical/20 text-critical" :
                        r.riskLevel === "High" ? "bg-stress/20 text-stress" :
                        r.riskLevel === "Moderate" ? "bg-moderate/20 text-moderate" :
                        "bg-stable/20 text-stable"
                      }`}>{r.riskLevel}</span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-foreground">{r.volatility.toFixed(1)}%</td>
                    <td className={`py-2 px-3 text-center font-mono ${r.forecastGrowth > 5 ? "text-critical" : r.forecastGrowth < 0 ? "text-stable" : "text-foreground"}`}>
                      {r.forecastGrowth > 0 ? "+" : ""}{r.forecastGrowth.toFixed(1)}%
                    </td>
                    <td className={`py-2 px-3 text-center font-mono ${r.stressIndex > 3 ? "text-stress" : "text-foreground"}`}>{r.stressIndex.toFixed(1)}</td>
                    <td className={`py-2 px-3 text-center font-mono ${r.stabilityScore < 50 ? "text-critical" : "text-stable"}`}>{r.stabilityScore}</td>
                    <td className="py-2 px-3 text-center font-mono text-foreground">{r.cagr.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-warning">{r.riskScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RiskIntelligence;
