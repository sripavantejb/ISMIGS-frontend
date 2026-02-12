import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BarChart3, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import ParticleField from "@/components/ParticleField";
import { useCPIData } from "@/hooks/useCPIData";
import {
  getLatestPeriod, getUniqueYears, getUniqueMonths, getUniqueStates,
  getStateDataForPeriod, getCPIMapColor, getRiskLevelFromInflation,
  resolveGeoStateName,
} from "@/services/cpiDataService";
import { forecastAllStates, ForecastResult } from "@/services/cpiForecastEngine";
import { generateAlerts, CPIAlert } from "@/services/stateAlertEngine";
import CPIStateDashboard from "@/components/CPIStateDashboard";

const INDIA_TOPO_URL = "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson";

const CPIMap = () => {
  const { data: allRecords, isLoading: cpiLoading } = useCPIData();
  const cpiData = allRecords;
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; state: string; index: number; inflation: number | null } | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [labourType, setLabourType] = useState<"AL" | "RL">("AL");
  const [showForecast, setShowForecast] = useState(false);

  // Year/month selectors
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    fetch(INDIA_TOPO_URL).then(r => r.json()).then(setGeoData).catch(console.error);
  }, []);

  const years = useMemo(() => cpiData ? getUniqueYears(cpiData) : [], [cpiData]);
  const months = useMemo(() => cpiData && selectedYear ? getUniqueMonths(cpiData, selectedYear) : [], [cpiData, selectedYear]);

  // Set defaults when data loads
  useEffect(() => {
    if (cpiData && !selectedYear) {
      const latest = getLatestPeriod(cpiData);
      setSelectedYear(latest.year);
      setSelectedMonth(latest.month);
    }
  }, [cpiData, selectedYear]);

  useEffect(() => {
    if (months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1]);
    }
  }, [months, selectedMonth]);

  const stateMap = useMemo(() => {
    if (!cpiData || !selectedYear || !selectedMonth) return new Map();
    return getStateDataForPeriod(cpiData, selectedYear, selectedMonth, labourType);
  }, [cpiData, selectedYear, selectedMonth, labourType]);

  const states = useMemo(() => cpiData ? getUniqueStates(cpiData) : [], [cpiData]);

  const forecasts = useMemo<ForecastResult[]>(() => {
    if (!cpiData || !showForecast || states.length === 0) return [];
    return forecastAllStates(cpiData, states, labourType, 12);
  }, [cpiData, showForecast, states, labourType]);

  const alerts = useMemo<CPIAlert[]>(() => {
    if (!cpiData || states.length === 0) return [];
    return generateAlerts(cpiData, states, labourType, forecasts.length > 0 ? forecasts : undefined);
  }, [cpiData, states, labourType, forecasts]);

  const allIndia = stateMap.get("All India");

  // Projection
  const WIDTH = 500, HEIGHT = 560;
  const project = (lon: number, lat: number): [number, number] => {
    const lonMin = 68, lonMax = 98, latMin = 6, latMax = 37;
    const x = ((lon - lonMin) / (lonMax - lonMin)) * WIDTH;
    const latRad = (lat * Math.PI) / 180;
    const latMinRad = (latMin * Math.PI) / 180;
    const latMaxRad = (latMax * Math.PI) / 180;
    const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const mercMin = Math.log(Math.tan(Math.PI / 4 + latMinRad / 2));
    const mercMax = Math.log(Math.tan(Math.PI / 4 + latMaxRad / 2));
    const y = HEIGHT - ((mercY - mercMin) / (mercMax - mercMin)) * HEIGHT;
    return [x, y];
  };

  const featureToPath = (feature: any): string => {
    const coords = feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
    return coords
      .map((polygon: number[][][]) =>
        polygon.map((ring: number[][]) =>
          ring.map((coord: number[], i: number) => {
            const [x, y] = project(coord[0], coord[1]);
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ") + " Z"
        ).join(" ")
      ).join(" ");
  };

  if (selectedState && cpiData) {
    return (
      <CPIStateDashboard
        state={selectedState}
        records={cpiData}
        labourType={labourType}
        onBack={() => setSelectedState(null)}
      />
    );
  }

  const isLoading = cpiLoading || !geoData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full overflow-auto relative flex flex-col"
      style={{ background: "radial-gradient(ellipse at center, hsl(222 47% 10%) 0%, hsl(222 47% 4%) 60%, hsl(0 0% 0%) 100%)" }}
    >
      <ParticleField count={40} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[700px] h-[700px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsl(38 92% 55% / 0.3) 0%, transparent 70%)" }} />
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-40 mx-4 mt-2">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium ${
            alerts[0].severity === "Red" ? "bg-critical/15 border border-critical/30 text-critical" : "bg-warning/15 border border-warning/30 text-warning"
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{alerts[0].message} — <span className="font-bold">{alerts[0].state}</span></span>
            {alerts.length > 1 && <span className="ml-auto text-xs opacity-75 shrink-0">+{alerts.length - 1} more</span>}
          </div>
        </motion.div>
      )}

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between px-8 pt-4 pb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-warning" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">CPI-AL/RL India Map</h1>
          <p className="text-sm text-muted-foreground mt-1">Consumer Price Index — Agricultural & Rural Labourers</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${cpiData ? "text-stable" : "text-muted-foreground"} animate-pulse`} />
          <span className="text-xs text-muted-foreground font-mono">{cpiData ? "LIVE — CSV" : "LOADING"}</span>
        </motion.div>
      </header>

      {/* Controls */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative z-30 flex items-center justify-center gap-3 px-6 py-2 flex-wrap">
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="w-auto min-w-[100px] appearance-auto glass-card px-3 py-1.5 text-xs font-mono text-foreground border-border/50 rounded-lg cursor-pointer"
          style={{ background: "rgba(15, 23, 42, 0.8)" }}
        >
          {years.map(y => <option key={y} value={y} style={{ background: "#0f172a" }}>{y}</option>)}
        </select>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-auto min-w-[120px] appearance-auto glass-card px-3 py-1.5 text-xs font-mono text-foreground border-border/50 rounded-lg cursor-pointer"
          style={{ background: "rgba(15, 23, 42, 0.8)" }}
        >
          {months.map(m => <option key={m} value={m} style={{ background: "#0f172a" }}>{m}</option>)}
        </select>
        <div className="flex items-center gap-1 glass-card rounded-lg overflow-hidden">
          <button onClick={() => setLabourType("AL")} className={`px-3 py-1.5 text-xs font-mono transition-colors ${labourType === "AL" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Agricultural</button>
          <button onClick={() => setLabourType("RL")} className={`px-3 py-1.5 text-xs font-mono transition-colors ${labourType === "RL" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Rural</button>
        </div>
        <button onClick={() => setShowForecast(!showForecast)} className={`glass-card px-3 py-1.5 text-xs font-mono transition-colors rounded-lg ${showForecast ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          🔮 {showForecast ? "Forecast ON" : "Show Forecast"}
        </button>
      </motion.div>

      {/* Map */}
      <div className="flex-1 relative z-20 flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-mono">Loading CPI Data...</span>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="w-full max-w-[750px] aspect-[4/4.5] relative">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full max-w-[600px] max-h-[680px] mx-auto" style={{ filter: "drop-shadow(0 0 40px rgba(250, 204, 21, 0.08))" }}>
              {geoData.features.map((feature: any, idx: number) => {
                const geoName = feature.properties.ST_NM || feature.properties.NAME_1 || feature.properties.name || "";
                const csvName = resolveGeoStateName(geoName);
                const stateInfo = csvName ? stateMap.get(csvName) : undefined;

                let fill = "#1a2332";
                if (stateInfo && stateInfo.index > 0) {
                  const detectedBase = stateInfo.index > 500 ? "1986-87" : "2019";
                  if (showForecast) {
                    const fc = forecasts.find(f => f.state === csvName);
                    if (fc && fc.forecastValues.length > 0) {
                      fill = getCPIMapColor(fc.forecastValues[fc.forecastValues.length - 1].value, detectedBase);
                    } else {
                      fill = getCPIMapColor(stateInfo.index, detectedBase);
                    }
                  } else {
                    fill = getCPIMapColor(stateInfo.index, detectedBase);
                  }
                }

                const isHovered = hoveredState === csvName;

                return (
                  <path
                    key={`${geoName}-${idx}`}
                    d={featureToPath(feature)}
                    fill={fill}
                    stroke={isHovered ? "#facc15" : "rgba(100, 150, 200, 0.25)"}
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    opacity={isHovered ? 1 : 0.85}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={(e) => {
                      if (csvName) {
                        setHoveredState(csvName);
                        setTooltip({ x: e.clientX, y: e.clientY, state: csvName, index: stateInfo?.index || 0, inflation: stateInfo?.inflation ?? null });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (csvName) setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseLeave={() => { setHoveredState(null); setTooltip(null); }}
                    onClick={() => { if (csvName) setSelectedState(csvName); }}
                  />
                );
              })}
            </svg>
          </motion.div>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 pointer-events-none min-w-[200px]"
            style={{ left: tooltip.x + 15, top: tooltip.y - 10, background: "rgba(10, 15, 30, 0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(250, 204, 21, 0.2)", borderRadius: "10px", padding: "14px 16px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="font-semibold text-foreground text-sm mb-2">{tooltip.state}</div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">CPI Index ({labourType})</span>
                <span className="text-warning font-bold">{tooltip.index > 0 ? tooltip.index.toFixed(2) : "N/A"}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Inflation YoY</span>
                <span className={`font-bold flex items-center gap-1 ${
                  tooltip.inflation === null ? "text-muted-foreground" :
                  tooltip.inflation > 5 ? "text-critical" :
                  tooltip.inflation > 3 ? "text-stress" :
                  tooltip.inflation < 0 ? "text-primary" : "text-stable"
                }`}>
                  {tooltip.inflation !== null ? (
                    <>{tooltip.inflation > 0 ? <TrendingUp className="w-3 h-3" /> : tooltip.inflation < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}{tooltip.inflation.toFixed(2)}%</>
                  ) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Risk</span>
                <span className={`font-bold ${
                  getRiskLevelFromInflation(tooltip.inflation) === "Critical" ? "text-critical" :
                  getRiskLevelFromInflation(tooltip.inflation) === "High" ? "text-stress" :
                  getRiskLevelFromInflation(tooltip.inflation) === "Moderate" ? "text-moderate" : "text-stable"
                }`}>{getRiskLevelFromInflation(tooltip.inflation)}</span>
              </div>
              {showForecast && (() => {
                const fc = forecasts.find(f => f.state === tooltip.state);
                return fc ? (
                  <div className="flex justify-between gap-6 border-t border-border/30 pt-1 mt-1">
                    <span className="text-muted-foreground">12m Forecast</span>
                    <span className="text-accent font-bold">{fc.projectedGrowthRate > 0 ? "+" : ""}{fc.projectedGrowthRate}%</span>
                  </div>
                ) : null;
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="absolute bottom-20 right-6 z-30">
        <div className="text-xs text-muted-foreground mb-2 text-right font-mono">
          {showForecast ? "Forecast CPI" : "CPI Index"} ({labourType})
        </div>
        <div className="flex items-center gap-0 rounded overflow-hidden border border-border/30">
          <div className="h-4 w-10" style={{ background: "linear-gradient(to right, #22c55e, #4ade80, #facc15, #f97316, #ef4444)" }} />
        </div>
        <div className="flex justify-between text-xs font-mono text-muted-foreground mt-1 w-full">
          <span>Low</span><span>High</span>
        </div>
      </motion.div>

      {/* Footer Stats */}
      <motion.footer initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="relative z-30 border-t border-border/20 bg-background/30 backdrop-blur-md px-6 py-4 shrink-0">
        <div className="text-center mb-2">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            CPI-AL/RL Intelligence — {selectedMonth} {selectedYear} — {labourType === "AL" ? "Agricultural Labourers" : "Rural Labourers"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          <StatItem label="ALL INDIA INDEX" value={allIndia?.index?.toFixed(1) || "—"} color="text-warning" />
          <Dot />
          <StatItem label="INFLATION" value={allIndia?.inflation !== null && allIndia?.inflation !== undefined ? `${allIndia.inflation.toFixed(1)}%` : "—"} color={allIndia?.inflation && allIndia.inflation > 5 ? "text-critical" : "text-stable"} />
          <Dot />
          <StatItem label="STATES" value={states.length.toString()} color="text-primary" />
          <Dot />
          <StatItem label="ALERTS" value={alerts.length.toString()} color={alerts.length > 5 ? "text-critical" : alerts.length > 0 ? "text-stress" : "text-stable"} />
          {showForecast && forecasts.length > 0 && (
            <>
              <Dot />
              <StatItem label="AVG FORECAST" value={`${(forecasts.reduce((a, f) => a + f.projectedGrowthRate, 0) / forecasts.length).toFixed(1)}%`} color="text-accent" />
            </>
          )}
        </div>
      </motion.footer>
    </motion.div>
  );
};

const StatItem = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <span className="font-medium text-foreground">
    {label}: <span className={`font-mono font-bold ${color}`}>{value}</span>
  </span>
);

const Dot = () => <span className="text-muted-foreground/40 hidden md:inline">·</span>;

export default CPIMap;
