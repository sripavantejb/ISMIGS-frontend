import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Activity, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCPIData } from "@/hooks/useCPIData";
import {
  getUniqueYears,
  getUniqueMonths,
  getUniqueStates,
  getLatestPeriod,
  getStateDataForPeriod,
  getCPIMapColor,
  getRiskLevelFromInflation,
  resolveGeoStateName,
  filterByBaseYear,
} from "@/services/cpiDataService";
import { forecastAllStates } from "@/services/cpiForecastEngine";
import CPIStateDashboard from "@/components/CPIStateDashboard";

const INDIA_TOPO_URL =
  "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson";

const CPIMap = () => {
  const { data: cpiData, isLoading } = useCPIData();
  const [geoData, setGeoData] = useState<any>(null);
  const [labourType, setLabourType] = useState<"AL" | "RL">("AL");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    state: string;
    index: number;
    inflation: number | null;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const base2019 = useMemo(() => (cpiData ? filterByBaseYear(cpiData, "2019") : []), [cpiData]);
  const dataSource = base2019.length > 0 ? base2019 : cpiData ?? [];
  const latest = useMemo(() => getLatestPeriod(dataSource), [dataSource]);
  const years = useMemo(() => getUniqueYears(dataSource), [dataSource]);
  const months = useMemo(
    () => (selectedYear ? getUniqueMonths(dataSource, selectedYear) : []),
    [dataSource, selectedYear]
  );
  const states = useMemo(() => getUniqueStates(dataSource), [dataSource]);

  const year = selectedYear || latest.year;
  const month = selectedMonth || latest.month;
  const detectedBase = dataSource[0]?.baseYear || "2019";

  const stateMap = useMemo(
    () => (cpiData && year ? getStateDataForPeriod(cpiData, year, month, labourType) : new Map()),
    [cpiData, year, month, labourType]
  );

  const forecasts = useMemo(
    () => (cpiData && states.length ? forecastAllStates(cpiData, states, labourType, 12) : []),
    [cpiData, states, labourType]
  );

  useEffect(() => {
    if (!year && years.length) setSelectedYear(years[0]);
  }, [years, year]);
  useEffect(() => {
    if (year && months.length && !month) setSelectedMonth(months[0]);
  }, [year, months, month]);
  useEffect(() => {
    fetch(INDIA_TOPO_URL)
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  const project = (lon: number, lat: number, width: number, height: number): [number, number] => {
    const lonMin = 68,
      lonMax = 98,
      latMin = 6,
      latMax = 37;
    const x = ((lon - lonMin) / (lonMax - lonMin)) * width;
    const latRad = (lat * Math.PI) / 180;
    const latMinRad = (latMin * Math.PI) / 180;
    const latMaxRad = (latMax * Math.PI) / 180;
    const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const mercMin = Math.log(Math.tan(Math.PI / 4 + latMinRad / 2));
    const mercMax = Math.log(Math.tan(Math.PI / 4 + latMaxRad / 2));
    const y = height - ((mercY - mercMin) / (mercMax - mercMin)) * height;
    return [x, y];
  };

  const featureToPath = (feature: any): string => {
    const coords =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    return coords
      .map((polygon: number[][][]) =>
        polygon
          .map((ring: number[][]) =>
            ring
              .map((coord: number[], i: number) => {
                const [x, y] = project(coord[0], coord[1], 500, 560);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ") + " Z"
          )
          .join(" ")
      )
      .join(" ");
  };

  const exportCSV = () => {
    if (!cpiData) return;
    const header = "State,Year,Month,Index AL,Index RL,Inflation AL,Inflation RL\n";
    const rows = cpiData
      .filter((r: any) => r.year === year && r.month === month && r.state !== "All India")
      .map(
        (r: any) =>
          `${r.state},${r.year},${r.month},${r.indexAL},${r.indexRL},${r.inflationAL ?? ""},${r.inflationRL ?? ""}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cpi-alrl-${year}-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (isLoading || !geoData) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6 flex items-center justify-center">
        <Skeleton className="h-[560px] w-full max-w-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-pattern p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                CPI-AL/RL India Map
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Consumer Price Index — Agricultural & Rural Labourers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-stable animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">LIVE</span>
            <span className="text-muted-foreground">—</span>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={labourType}
            onChange={(e) => setLabourType(e.target.value as "AL" | "RL")}
            className="px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono"
          >
            <option value="AL">Agricultural Labourers</option>
            <option value="RL">Rural Labourers</option>
          </select>
          {years.length > 0 && (
            <select
              value={year}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth("");
              }}
              className="px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {months.length > 0 && (
            <select
              value={month}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative w-full flex justify-center">
          <svg
            viewBox="0 0 500 560"
            className="w-full max-w-[600px] h-auto"
            style={{ filter: "drop-shadow(0 0 40px rgba(250, 204, 21, 0.08))" }}
          >
            {geoData.features.map((feature: any, idx: number) => {
              const geoName = feature.properties.ST_NM || feature.properties.NAME_1 || feature.properties.name || "";
              const csvState = resolveGeoStateName(geoName);
              const stateInfo = csvState ? stateMap.get(csvState) : undefined;
              const fc = csvState ? forecasts.find((f) => f.state === csvState) : undefined;
              const id = csvState || `geo-${idx}`;
              const isHovered = hoveredId === id;

              let fill = "#1a2332";
              if (fc?.forecastValues?.length) {
                const lastFc = fc.forecastValues[fc.forecastValues.length - 1];
                fill = getCPIMapColor(lastFc.value, detectedBase);
              } else if (stateInfo) {
                fill = getCPIMapColor(stateInfo.index, detectedBase);
              }

              return (
                <path
                  key={id + idx}
                  d={featureToPath(feature)}
                  fill={fill}
                  stroke={isHovered ? "#facc15" : "rgba(100, 150, 200, 0.25)"}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  opacity={isHovered ? 1 : 0.85}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredId(id);
                    if (csvState && stateInfo) {
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        state: csvState,
                        index: stateInfo.index,
                        inflation: stateInfo.inflation,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (csvState && stateInfo && tooltip) {
                      setTooltip({
                        ...tooltip,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredId(null);
                    setTooltip(null);
                  }}
                  onClick={() => {
                    if (csvState) setSelectedState(csvState);
                  }}
                />
              );
            })}
          </svg>

          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="fixed z-50 pointer-events-none min-w-[200px]"
                style={{
                  left: tooltip.x + 15,
                  top: tooltip.y - 10,
                  background: "rgba(10, 15, 30, 0.92)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(250, 204, 21, 0.2)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                }}
              >
                <div className="font-semibold text-foreground text-sm mb-2">{tooltip.state}</div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">CPI Index</span>
                    <span className="text-warning font-bold">{tooltip.index.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">Inflation YoY</span>
                    <span
                      className={
                        tooltip.inflation != null && tooltip.inflation > 5
                          ? "text-critical"
                          : "text-foreground"
                      }
                    >
                      {tooltip.inflation != null ? `${tooltip.inflation.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">Risk</span>
                    <span
                      className={
                        getRiskLevelFromInflation(tooltip.inflation) === "Critical"
                          ? "text-critical"
                          : getRiskLevelFromInflation(tooltip.inflation) === "High"
                          ? "text-stress"
                          : getRiskLevelFromInflation(tooltip.inflation) === "Moderate"
                          ? "text-moderate"
                          : "text-stable"
                      }
                    >
                      {getRiskLevelFromInflation(tooltip.inflation)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground font-mono">
          CPI-AL/RL Intelligence — {month} {year} — {labourType === "AL" ? "Agricultural Labourers" : "Rural Labourers"}
        </p>
      </div>
    </div>
  );
};

export default CPIMap;
