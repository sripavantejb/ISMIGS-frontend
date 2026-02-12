import { motion } from "framer-motion";
import { StateData, getRiskColor } from "@/data/statesData";
import { AlertTriangle, Shield, Zap, TrendingDown } from "lucide-react";

interface RiskPanelProps {
  alerts: StateData["riskAlerts"];
}

const severityIcon = {
  Low: <Shield className="w-4 h-4" />,
  Medium: <Zap className="w-4 h-4" />,
  High: <AlertTriangle className="w-4 h-4" />,
  Critical: <TrendingDown className="w-4 h-4" />,
};

const severityColor = {
  Low: "border-stable/30 bg-stable/5",
  Medium: "border-moderate/30 bg-moderate/5",
  High: "border-stress/30 bg-stress/5",
  Critical: "border-critical/30 bg-critical/5 animate-glow-pulse",
};

const severityText = {
  Low: "text-stable",
  Medium: "text-moderate",
  High: "text-stress",
  Critical: "text-critical",
};

const RiskPanel = ({ alerts }: RiskPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-6"
    >
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">🚨 Risk Detection Engine</h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className={`border rounded-lg p-4 ${severityColor[alert.severity]}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={severityText[alert.severity]}>{severityIcon[alert.severity]}</span>
              <span className={`font-semibold text-sm ${severityText[alert.severity]}`}>{alert.type}</span>
              <span className="ml-auto text-xs font-mono text-muted-foreground">{alert.confidence}% confidence</span>
            </div>
            <p className="text-sm text-foreground/80 mb-2">{alert.message}</p>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Action:</span> {alert.action}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RiskPanel;
