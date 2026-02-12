import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BarChart3, Database, Loader2 } from "lucide-react";
import IndiaMap from "@/components/IndiaMap";
import StateDashboard from "@/components/StateDashboard";
import ParticleField from "@/components/ParticleField";
import { StateData, statesData } from "@/data/statesData";
import { useSupplyData, useConsumptionData } from "@/hooks/useEnergyData";

const Index = () => {
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const { data: supplyData, isLoading: supplyLoading } = useSupplyData();
  const { data: consumptionData, isLoading: consumptionLoading } = useConsumptionData();

  const isLive = !!supplyData && !!consumptionData;
  const isLoading = supplyLoading || consumptionLoading;

  const totalStates = statesData.length;
  const avgEPS = Math.round(statesData.reduce((a, s) => a + s.eps, 0) / totalStates);
  const criticalCount = statesData.filter(s => s.riskLevel === "Critical" || s.riskLevel === "Stress").length;
  const stableCount = statesData.filter(s => s.riskLevel === "Strong" || s.riskLevel === "Stable").length;

  // Use real API data when available, fallback to mock
  const totalSupply = supplyData ? Math.round(supplyData.totalPrimarySupply) : statesData.reduce((a, s) => a + s.totalSupply, 0);
  const totalConsumption = consumptionData ? Math.round(consumptionData.totalFinalConsumption) : statesData.reduce((a, s) => a + s.finalConsumption, 0);
  const totalProduction = supplyData ? Math.round(supplyData.totalProduction) : 0;
  const totalImports = supplyData ? Math.round(supplyData.totalImports) : 0;
  const totalExports = supplyData ? Math.round(supplyData.totalExports) : 0;
  const avgImportDep = supplyData && supplyData.totalPrimarySupply > 0
    ? Math.round((supplyData.totalImports / supplyData.totalPrimarySupply) * 100)
    : Math.round(statesData.reduce((a, s) => a + s.importDependency, 0) / totalStates);
  const latestYear = supplyData?.latestYear || "2023-24";

  return (
    <AnimatePresence mode="wait">
      {selectedState ? (
        <StateDashboard
          key="dashboard"
          state={selectedState}
          onBack={() => setSelectedState(null)}
        />
      ) : (
        <motion.div
          key="map"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen w-screen overflow-auto relative flex flex-col"
          style={{ background: "radial-gradient(ellipse at center, hsl(222 47% 10%) 0%, hsl(222 47% 4%) 60%, hsl(0 0% 0%) 100%)" }}
        >
          {/* Particles */}
          <ParticleField count={60} />

          {/* Radial glow behind map */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-[700px] h-[700px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsl(187 92% 50% / 0.3) 0%, transparent 70%)" }} />
          </div>

          {/* Header */}
          <header className="relative z-30 flex items-center justify-between px-8 pt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <BarChart3 className="w-7 h-7 text-primary" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                ISMIGS
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Click on a state to see energy intelligence and governance analytics.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Activity className={`w-4 h-4 ${isLive ? "text-stable" : "text-primary"} animate-pulse`} />
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {isLoading ? "SYNCING" : isLive ? "LIVE — MoSPI" : "OFFLINE"}
              </span>
              {isLive && <Database className="w-3 h-3 text-stable" />}
            </motion.div>
          </header>

          {/* Centered Map */}
          <div className="flex-1 relative z-20 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="w-full max-w-[750px] aspect-[4/4.5]"
            >
              <IndiaMap onStateSelect={setSelectedState} />
            </motion.div>
          </div>

          {/* Legend - bottom right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-20 right-6 z-30"
          >
            <div className="text-xs text-muted-foreground mb-2 text-right font-mono">Legend (EPS)</div>
            <div className="flex items-center gap-0 rounded overflow-hidden border border-border/30">
              <div className="h-4 w-10" style={{ background: "linear-gradient(to right, #ef4444, #f97316, #facc15, #4ade80, #22c55e)" }} />
            </div>
            <div className="flex justify-between text-xs font-mono text-muted-foreground mt-1 w-full">
              <span>0</span>
              <span>150</span>
            </div>
          </motion.div>

          {/* Bottom stats bar */}
          <motion.footer
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative z-30 border-t border-border/20 bg-background/30 backdrop-blur-md px-6 py-4 shrink-0"
          >
            <div className="text-center mb-2">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                National Energy Intelligence — {latestYear} — {isLive ? "MoSPI Real-Time Data" : `${totalStates} States Monitored`}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
              {isLive && (
                <>
                  <StatItem label="PRODUCTION" value={totalProduction.toLocaleString()} color="text-accent" sub="PJ" />
                  <Dot />
                  <StatItem label="IMPORTS" value={totalImports.toLocaleString()} color="text-moderate" sub="PJ" />
                  <Dot />
                  <StatItem label="EXPORTS" value={totalExports.toLocaleString()} color="text-stress" sub="PJ" />
                  <Dot />
                </>
              )}
              <StatItem label="TOTAL SUPPLY" value={totalSupply.toLocaleString()} color="text-primary" sub={isLive ? "PJ" : "MW"} />
              <Dot />
              <StatItem label="CONSUMPTION" value={totalConsumption.toLocaleString()} color="text-moderate" sub={isLive ? "KToE" : "MW"} />
              <Dot />
              <StatItem label="IMPORT DEP" value={`${avgImportDep}%`} color="text-stress" />
              <Dot />
              <StatItem label="AT RISK" value={criticalCount.toString()} color="text-critical" sub={`(${Math.round(criticalCount / totalStates * 100)}%)`} />
              <Dot />
              <StatItem label="STABLE" value={stableCount.toString()} color="text-stable" sub={`(${Math.round(stableCount / totalStates * 100)}%)`} />
            </div>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatItem = ({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) => (
  <span className="font-medium text-foreground">
    {label}:{" "}
    <span className={`font-mono font-bold ${color}`}>{value}</span>
    {sub && <span className="text-muted-foreground text-xs ml-1">{sub}</span>}
  </span>
);

const Dot = () => <span className="text-muted-foreground/40 hidden md:inline">·</span>;

export default Index;
