import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { statesData, getMapColor, StateData } from "@/data/statesData";

const INDIA_TOPO_URL = "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson";

interface IndiaMapProps {
  onStateSelect: (state: StateData) => void;
}

const IndiaMap = ({ onStateSelect }: IndiaMapProps) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; state: StateData } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch(INDIA_TOPO_URL)
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  const stateNameMap = useMemo(() => {
    const map: Record<string, StateData> = {};
    statesData.forEach((s) => {
      map[s.name.toLowerCase()] = s;
      map[s.code.toLowerCase()] = s;
    });
    // Alternate names from GeoJSON
    const aliases: Record<string, string> = {
      "nct of delhi": "DL",
      "delhi": "DL",
      "jammu & kashmir": "JK",
      "jammu and kashmir": "JK",
      "orissa": "OD",
      "uttaranchal": "UK",
      "pondicherry": "GA",
      "andaman and nicobar islands": "AP",
      "dadra and nagar haveli": "GJ",
      "daman and diu": "GJ",
      "lakshadweep": "KL",
      "chandigarh": "PB",
      "puducherry": "TN",
      "ladakh": "JK",
      "andaman and nicobar": "AP",
      "dadra and nagar haveli and daman and diu": "GJ",
    };
    Object.entries(aliases).forEach(([k, v]) => {
      const st = statesData.find((s) => s.code === v);
      if (st) map[k] = st;
    });
    return map;
  }, []);

  const findState = (name: string): StateData | undefined => {
    return stateNameMap[name.toLowerCase().trim()];
  };

  // Simple Mercator projection for India
  const project = (lon: number, lat: number, width: number, height: number): [number, number] => {
    const lonMin = 68, lonMax = 98, latMin = 6, latMax = 37;
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

  const WIDTH = 500;
  const HEIGHT = 560;

  const featureToPath = (feature: any): string => {
    const coords = feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates; // MultiPolygon

    return coords
      .map((polygon: number[][][]) =>
        polygon
          .map((ring: number[][]) =>
            ring
              .map((coord: number[], i: number) => {
                const [x, y] = project(coord[0], coord[1], WIDTH, HEIGHT);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ") + " Z"
          )
          .join(" ")
      )
      .join(" ");
  };

  if (!geoData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-mono">Loading Map Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-full max-w-[600px] max-h-[680px]"
        style={{ filter: "drop-shadow(0 0 40px rgba(0, 200, 255, 0.08))" }}
      >
        {geoData.features.map((feature: any, idx: number) => {
          const name = feature.properties.ST_NM || feature.properties.NAME_1 || feature.properties.name || "";
          const stateData = findState(name);
          const fill = stateData ? getMapColor(stateData.eps) : "#1a2332";
          const id = stateData?.code || `geo-${idx}`;
          const isHovered = hoveredId === id;

          return (
            <path
              key={id + idx}
              d={featureToPath(feature)}
              fill={fill}
              stroke={isHovered ? "#00d4ff" : "rgba(100, 150, 200, 0.25)"}
              strokeWidth={isHovered ? 1.5 : 0.5}
              opacity={isHovered ? 1 : 0.85}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredId(id);
                if (stateData) setTooltip({ x: e.clientX, y: e.clientY, state: stateData });
              }}
              onMouseMove={(e) => {
                if (stateData) setTooltip({ x: e.clientX, y: e.clientY, state: stateData });
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                setTooltip(null);
              }}
              onClick={() => {
                if (stateData) onStateSelect(stateData);
              }}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
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
              border: "1px solid rgba(0, 200, 255, 0.2)",
              borderRadius: "10px",
              padding: "14px 16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="font-semibold text-foreground text-sm mb-2">{tooltip.state.name}</div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Energy Score</span>
                <span className="text-primary font-bold">{tooltip.state.eps}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Composite</span>
                <span className="text-foreground">{tooltip.state.compositeScore}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Risk Level</span>
                <span
                  className={
                    tooltip.state.riskLevel === "Critical" || tooltip.state.riskLevel === "Stress"
                      ? "text-critical"
                      : tooltip.state.riskLevel === "Moderate"
                      ? "text-moderate"
                      : "text-stable"
                  }
                >
                  {tooltip.state.riskLevel}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Import Dep.</span>
                <span className="text-foreground">{tooltip.state.importDependency}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndiaMap;
