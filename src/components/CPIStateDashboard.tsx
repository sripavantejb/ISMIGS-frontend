import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3, Gauge } from "lucide-react";
import { CPIRecord, getStateTimeSeries, computeYoY, computeMovingAverage, computeVolatility } from "@/services/cpiDataService";
import { forecastState, ForecastResult } from "@/services/cpiForecastEngine";
import { generateAlerts } from "@/services/stateAlertEngine";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, Legend, BarChart, Bar } from "recharts";

interface CPIStateDashboardProps {
  state: string;
  records: CPIRecord[];
  labourType: "AL" | "RL";
  onBack: () => void;
}

const CPIStateDashboard = ({ state, records, labourType, onBack }: CPIStateDashboardProps) => {
  const timeSeries = useMemo(() => getStateTimeSeries(records, state), [records, state]);
  const yoy = useMemo(() => computeYoY(timeSeries, labourType), [timeSeries, labourType]);
  const forecast = useMemo(() => forecastState(timeSeries, labourType, 12), [timeSeries, labourType]);
  const alerts = useMemo(() => generateAlerts(records, [state], labourType, [forecast]), [records, state, labourType, forecast]);

  const indexValues = timeSeries.map(r => labourType === "AL" ? r.indexAL : r.indexRL).filter(v => v > 0);
  const ma6 = computeMovingAverage(indexValues, 6);
  const volatility = computeVolatility(indexValues);

  const latest = timeSeries[timeSeries.length - 1];
  const latestIndex = latest ? (labourType === "AL" ? latest.indexAL : latest.indexRL) : 0;
  const latestInflation = latest ? (labourType === "AL" ? latest.inflationAL : latest.inflationRL) : null;

  // Chart data: last 60 entries
  const chartData = timeSeries.slice(-60).map((r, i) => ({
    period: `${r.month.substring(0, 3)} ${r.year.toString().slice(-4)}`,
    index: labourType === "AL" ? r.indexAL : r.indexRL,
    inflation: labourType === "AL" ? r.inflationAL : r.inflationRL,
    ma: ma6[indexValues.length - 60 + i] ?? undefined,
  })).filter(d => d.index > 0);

  // AL vs RL comparison
  const comparisonData = timeSeries.slice(-24).map(r => ({
    period: `${r.month.substring(0, 3)} ${r.year.toString().slice(-4)}`,
    AL: r.indexAL,
    RL: r.indexRL,
  })).filter(d => d.AL > 0 || d.RL > 0);

  // Forecast chart
  const forecastChartData = forecast.forecastValues.map((f, i) => ({
    month: `M+${f.month}`,
    forecast: f.value,
    lower: f.lower,
    upper: f.upper,
  }));
  if (latestIndex > 0) {
    forecastChartData.unshift({ month: "Now", forecast: latestIndex, lower: latestIndex, upper: latestIndex });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="glass-card p-2 hover:border-primary/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <span className="hover:text-primary cursor-pointer" onClick={onBack}>INDIA CPI MAP</span>
            <span>→</span>
            <span className="text-warning font-semibold">{state.toUpperCase()}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">{labourType === "AL" ? "Agricultural" : "Rural"} Labourers</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPI label="CPI Index" value={latestIndex.toFixed(1)} icon={<BarChart3 className="w-4 h-4" />} color="text-warning" />
          <KPI label="Inflation YoY" value={latestInflation !== null ? `${latestInflation.toFixed(1)}%` : "N/A"} icon={latestInflation && latestInflation > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />} color={latestInflation && latestInflation > 5 ? "text-critical" : "text-stable"} />
          <KPI label="YoY Change" value={yoy !== null ? `${yoy > 0 ? "+" : ""}${yoy}%` : "N/A"} icon={<TrendingUp className="w-4 h-4" />} color={yoy && yoy > 5 ? "text-critical" : "text-foreground"} />
          <KPI label="Volatility" value={volatility.toFixed(1)} icon={<Activity className="w-4 h-4" />} color={volatility > 3 ? "text-stress" : "text-stable"} />
          <KPI label="Trend Slope" value={forecast.trendSlope.toFixed(3)} icon={<Gauge className="w-4 h-4" />} color="text-primary" />
          <KPI label="Momentum" value={`${forecast.momentum > 0 ? "+" : ""}${forecast.momentum}%`} icon={<TrendingUp className="w-4 h-4" />} color={forecast.momentum > 2 ? "text-stress" : "text-stable"} />
          <KPI label="Confidence" value={`${forecast.confidenceLevel}%`} icon={<Gauge className="w-4 h-4" />} color="text-accent" />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${a.severity === "Red" ? "bg-critical/10 border border-critical/30 text-critical" : "bg-warning/10 border border-warning/30 text-warning"}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historical CPI Line */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">📈 Historical CPI Index ({labourType})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} interval={Math.max(0, Math.floor(chartData.length / 8))} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="index" stroke="hsl(38, 92%, 55%)" fill="url(#cpiGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="ma" stroke="hsl(187, 92%, 50%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* AL vs RL Comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">📊 Agricultural vs Rural CPI</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} interval={Math.max(0, Math.floor(comparisonData.length / 6))} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="AL" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={false} name="Agricultural" />
                <Line type="monotone" dataKey="RL" stroke="hsl(187, 92%, 50%)" strokeWidth={2} dot={false} name="Rural" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inflation chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🔥 Inflation Rate YoY</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.filter(d => d.inflation !== null)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} interval={Math.max(0, Math.floor(chartData.length / 8))} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 8 }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="inflation" name="Inflation %" fill="hsl(38, 92%, 55%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Forecast */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🔮 12-Month Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastChartData}>
                <defs>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", border: "1px solid rgba(160,250,100,0.2)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(160, 84%, 45%)" fillOpacity={0.1} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                <Line type="monotone" dataKey="forecast" stroke="hsl(160, 84%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between mt-3 text-xs font-mono">
              <span className="text-muted-foreground">Projected Growth: <span className="text-accent font-bold">{forecast.projectedGrowthRate > 0 ? "+" : ""}{forecast.projectedGrowthRate}%</span></span>
              <span className="text-muted-foreground">Confidence: <span className="text-primary font-bold">{forecast.confidenceLevel}%</span></span>
            </div>
          </motion.div>
        </div>

        {/* Predictive Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🧠 Predictive Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Trend Slope" value={forecast.trendSlope.toFixed(4)} desc="Linear regression slope" />
            <MetricCard label="12m Volatility" value={`${volatility.toFixed(2)}%`} desc="Standard deviation of changes" />
            <MetricCard label="Momentum Index" value={`${forecast.momentum > 0 ? "+" : ""}${forecast.momentum}%`} desc="6m vs prior 6m" />
            <MetricCard label="Acceleration" value={`${forecast.accelerationScore > 0 ? "+" : ""}${forecast.accelerationScore}`} desc="Change in growth rate" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const KPI = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <div className={`font-mono font-bold text-lg ${color}`}>{value}</div>
  </motion.div>
);

const MetricCard = ({ label, value, desc }: { label: string; value: string; desc: string }) => (
  <div className="bg-secondary/30 rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="font-mono font-bold text-lg text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
  </div>
);

export default CPIStateDashboard;
