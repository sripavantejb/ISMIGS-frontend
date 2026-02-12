import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { StateData, getScoreColor } from "@/data/statesData";

// Re-export helper
function computeRiskLevel(eps: number): StateData["riskLevel"] {
  if (eps >= 120) return "Strong";
  if (eps >= 100) return "Stable";
  if (eps >= 80) return "Moderate";
  if (eps >= 60) return "Stress";
  return "Critical";
}

interface ShockSimulatorProps {
  state: StateData;
}

const ShockSimulator = ({ state }: ShockSimulatorProps) => {
  const [importDrop, setImportDrop] = useState(0);

  const adjustedImports = Math.round(state.imports * (1 - importDrop / 100));
  const adjustedSupply = state.production + adjustedImports - state.exports + state.stockChanges;
  const adjustedEBR = +(adjustedSupply / state.finalConsumption).toFixed(2);
  const adjustedEPS = Math.round(adjustedEBR * 100);
  const adjustedRisk = computeRiskLevel(adjustedEPS);

  const metrics = [
    { label: "Adjusted Supply", value: adjustedSupply.toLocaleString(), original: state.totalSupply.toLocaleString() },
    { label: "Adjusted EBR", value: adjustedEBR.toString(), original: state.ebr.toString() },
    { label: "Adjusted EPS", value: adjustedEPS.toString(), original: state.eps.toString(), color: getScoreColor(adjustedEPS) },
    { label: "Risk Level", value: adjustedRisk, original: state.riskLevel },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6"
    >
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-medium">⚡ Shock Simulation Engine</h3>
      <p className="text-muted-foreground text-xs mb-5">Simulate the impact of import disruptions on energy metrics</p>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-foreground">Import Reduction</span>
          <span className="font-mono text-primary font-bold text-lg">{importDrop}%</span>
        </div>
        <Slider
          value={[importDrop]}
          onValueChange={(v) => setImportDrop(v[0])}
          max={80}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
          <span>0%</span>
          <span>80%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-secondary/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
            <div className={`font-mono font-bold text-lg ${m.color || "text-foreground"}`}>{m.value}</div>
            {importDrop > 0 && (
              <div className="text-xs text-muted-foreground font-mono mt-1">
                was: {m.original}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ShockSimulator;
