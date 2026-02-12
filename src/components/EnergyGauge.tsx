import { motion } from "framer-motion";
import { getScoreColor } from "@/data/statesData";

interface EnergyGaugeProps {
  eps: number;
  ebr: number;
  size?: number;
}

const EnergyGauge = ({ eps, ebr, size = 200 }: EnergyGaugeProps) => {
  const maxEps = 150;
  const angle = Math.min((eps / maxEps) * 180, 180);
  const radius = size * 0.4;
  const cx = size / 2;
  const cy = size * 0.55;

  const getLabel = (eps: number) => {
    if (eps >= 120) return "Energy Exporter";
    if (eps >= 100) return "Balanced";
    if (eps >= 80) return "Mild Deficit";
    if (eps >= 60) return "Stress";
    return "Critical";
  };

  const arcPath = (startAngle: number, endAngle: number) => {
    const startRad = ((180 + startAngle) * Math.PI) / 180;
    const endRad = ((180 + endAngle) * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleRad = ((180 + angle) * Math.PI) / 180;
  const needleLen = radius * 0.85;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-card p-6 flex flex-col items-center"
    >
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">Energy Token Score</h3>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc segments */}
        <path d={arcPath(0, 36)} fill="none" stroke="hsl(0 72% 55% / 0.3)" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(36, 72)} fill="none" stroke="hsl(25 95% 55% / 0.3)" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(72, 108)} fill="none" stroke="hsl(45 93% 50% / 0.3)" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(108, 144)} fill="none" stroke="hsl(160 60% 45% / 0.3)" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(144, 180)} fill="none" stroke="hsl(160 84% 40% / 0.3)" strokeWidth="12" strokeLinecap="round" />

        {/* Active arc */}
        <motion.path
          d={arcPath(0, angle)}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />

        {/* Needle */}
        <motion.line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        />
        <circle cx={cx} cy={cy} r="4" fill="hsl(var(--primary))" />

        {/* Labels */}
        <text x={cx - radius - 5} y={cy + 15} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">0</text>
        <text x={cx + radius + 5} y={cy + 15} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="start" fontFamily="JetBrains Mono">150</text>
      </svg>

      <div className="text-center -mt-2">
        <span className={`text-4xl font-mono font-bold ${getScoreColor(eps)}`}>{eps}</span>
        <span className="text-muted-foreground text-sm ml-1">EPS</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 font-mono">EBR: {ebr}</div>
      <div className={`text-sm font-semibold mt-2 ${getScoreColor(eps)}`}>{getLabel(eps)}</div>
    </motion.div>
  );
};

export default EnergyGauge;
