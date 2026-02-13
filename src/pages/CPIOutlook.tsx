import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, BarChart3, Gauge } from "lucide-react";
import { useCPIData } from "@/hooks/useCPIData";
import { getUniqueStates, getLatestPeriod, getStateDataForPeriod, computeVolatility, getStateTimeSeries, getRiskLevelFromInflation } from "@/services/cpiDataService";
import { forecastAllStates, ForecastResult } from "@/services/cpiForecastEngine";
import { generateAlerts } from "@/services/stateAlertEngine";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const CPIOutlook = () => {
  const { data: cpiData, isLoading } = useCPIData();
  const [labourType, setLabourType] = useState<"AL" | "RL">("AL");

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

  // All India time series for overall forecast
  const allIndiaTS = useMemo(() => {
    if (!cpiData) return [];
    return getStateTimeSeries(cpiData, "All India").slice(-24).map(r => ({
      period: `${r.month.substring(0, 3)} ${r.year.toString().slice(-4)}`,
      index: labourType === "AL" ? r.indexAL : r.indexRL,
      inflation: labourType === "AL" ? r.inflationAL : r.inflationRL,
    })).filter(d => d.index > 0);
  }, [cpiData, labourType]);

  // State ranking by projected growth
  const rankingData = useMemo(() => {
    return forecasts
      .filter(f => f.forecastValues.length > 0)
      .sort((a, b) => b.projectedGrowthRate - a.projectedGrowthRate)
      .slice(0, 20)
      .map(f => ({
        state: f.state.length > 15 ? f.state.substring(0, 13) + "…" : f.state,
        fullName: f.state,
        growth: f.projectedGrowthRate,
        momentum: f.momentum,
        confidence: f.confidenceLevel,
      }));
  }, [forecasts]);

  // Risk index
  const riskData = useMemo(() => {
    return states.map(s => {
      const info = stateMap.get(s);
      const fc = forecasts.find(f => f.state === s);
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
        riskScore: (risk === "Critical" ? 4 : risk === "High" ? 3 : risk === "Moderate" ? 2 : 1) + vol * 0.5 + (fc?.accelerationScore ?? 0) * 0.3,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [states, stateMap, forecasts, cpiData, labourType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[260px] w-full rounded-xl" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-pattern p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CPI Outlook & Forecast Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1">Predictive analytics for Consumer Price Index — {labourType === "AL" ? "Agricultural" : "Rural"} Labourers</p>
          </div>
          <div className="flex items-center gap-2 glass-card rounded-lg overflow-hidden">
            <button onClick={() => setLabourType("AL")} className={`px-3 py-1.5 text-xs font-mono transition-colors ${labourType === "AL" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Agricultural</button>
            <button onClick={() => setLabourType("RL")} className={`px-3 py-1.5 text-xs font-mono transition-colors ${labourType === "RL" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Rural</button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="glass-card p-4 space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">🚨 Active Alerts ({alerts.length})</h3>
            {alerts.slice(0, 5).map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${a.severity === "Red" ? "bg-critical/10 border border-critical/30 text-critical" : "bg-warning/10 border border-warning/30 text-warning"}`}>
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="font-bold">{a.state}</span>
                <span className="flex-1">{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All India Trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">📈 All India CPI Trend ({labourType})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={allIndiaTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="index" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={false} name="CPI Index" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* State Ranking by Projected Growth */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🏆 State Ranking — Projected 12m Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rankingData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} />
                <YAxis dataKey="state" type="category" tick={{ fontSize: 9, fill: "hsl(215, 20%, 55%)" }} width={100} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 8 }} />
                <Bar dataKey="growth" name="Projected Growth %" radius={[0, 4, 4, 0]}>
                  {rankingData.map((entry, index) => (
                    <Cell key={index} fill={entry.growth > 8 ? "hsl(0, 72%, 55%)" : entry.growth > 5 ? "hsl(25, 95%, 55%)" : entry.growth > 0 ? "hsl(38, 92%, 55%)" : "hsl(160, 84%, 45%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Risk Index Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🚨 State Risk Index</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-mono">State</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Risk Level</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Volatility</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Forecast Growth</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Acceleration</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground font-mono">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {riskData.slice(0, 15).map((r, i) => (
                  <tr key={r.state} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
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
                    <td className={`py-2 px-3 text-center font-mono ${r.forecastGrowth > 5 ? "text-critical" : "text-foreground"}`}>{r.forecastGrowth > 0 ? "+" : ""}{r.forecastGrowth.toFixed(1)}%</td>
                    <td className={`py-2 px-3 text-center font-mono ${r.acceleration > 2 ? "text-stress" : "text-foreground"}`}>{r.acceleration > 0 ? "+" : ""}{r.acceleration.toFixed(1)}</td>
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

export default CPIOutlook;
