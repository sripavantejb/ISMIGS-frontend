import { motion } from "framer-motion";
import { ArrowLeft, Zap, BarChart3, TrendingUp, Gauge, AlertTriangle, Globe, Factory } from "lucide-react";
import { StateData, getScoreColor, getRiskColor } from "@/data/statesData";
import KPICard from "./KPICard";
import EnergyGauge from "./EnergyGauge";
import EnergyCharts from "./EnergyCharts";
import ShockSimulator from "./ShockSimulator";
import RiskPanel from "./RiskPanel";

interface StateDashboardProps {
  state: StateData;
  onBack: () => void;
}

const StateDashboard = ({ state, onBack }: StateDashboardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background grid-pattern"
    >
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="glass-card p-2 hover:border-primary/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <span className="hover:text-primary cursor-pointer" onClick={onBack}>INDIA</span>
            <span>→</span>
            <span className="text-primary font-semibold">{state.name.toUpperCase()}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              state.riskLevel === "Strong" || state.riskLevel === "Stable"
                ? "border-stable/30 bg-stable/10 text-stable"
                : state.riskLevel === "Moderate"
                ? "border-moderate/30 bg-moderate/10 text-moderate"
                : "border-critical/30 bg-critical/10 text-critical"
            }`}>
              {state.riskLevel}
            </span>
            <span className="text-xs text-muted-foreground font-mono">CODE: {state.code}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* KPI Command Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPICard label="EPS" value={state.eps} icon={<Zap className="w-4 h-4" />} color={getScoreColor(state.eps)} delay={0} />
          <KPICard label="EBR" value={state.ebr} decimals={2} icon={<BarChart3 className="w-4 h-4" />} delay={100} />
          <KPICard label="Import Dep." value={state.importDependency} suffix="%" icon={<Globe className="w-4 h-4" />} delay={200} />
          <KPICard label="Ind. Intensity" value={state.industrialIntensity} decimals={2} icon={<Factory className="w-4 h-4" />} delay={300} />
          <KPICard label="Risk Level" value={state.forecastStress} suffix="%" icon={<AlertTriangle className="w-4 h-4" />} color={state.forecastStress > 40 ? "text-critical" : "text-stable"} delay={400} />
          <KPICard label="Composite" value={state.compositeScore} icon={<TrendingUp className="w-4 h-4" />} delay={500} />
          <KPICard label="Renewable" value={state.renewableShare} suffix="%" icon={<Gauge className="w-4 h-4" />} color="text-accent" delay={600} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EnergyCharts state={state} />
          </div>
          <div>
            <EnergyGauge eps={state.eps} ebr={state.ebr} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ShockSimulator state={state} />
          <RiskPanel alerts={state.riskAlerts} />
        </div>

        {/* Forecast panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🔮 Forecast Panel — 6 Month Projection</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Energy Demand", value: `${Math.round(state.finalConsumption * 1.06).toLocaleString()} MW`, change: "+6.2%" },
              { label: "Import Req.", value: `${Math.round(state.imports * 1.08).toLocaleString()} MW`, change: "+8.1%" },
              { label: "Industrial Cons.", value: `${Math.round(state.sectorBreakdown[0].consumption * 1.04).toLocaleString()} MW`, change: "+4.3%" },
              { label: "Stress Probability", value: `${state.forecastStress}%`, change: state.forecastStress > 30 ? "↑ Rising" : "↓ Stable" },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/30 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="font-mono font-bold text-lg text-foreground">{item.value}</div>
                <div className="text-xs font-mono text-primary mt-1">{item.change}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StateDashboard;
