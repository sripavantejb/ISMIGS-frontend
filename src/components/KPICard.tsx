import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface KPICardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: string;
  delay?: number;
}

const KPICard = ({ label, value, suffix = "", prefix = "", decimals = 0, icon, trend, color, delay = 0 }: KPICardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - delay;
        if (elapsed < 0) { requestAnimationFrame(animate); return; }
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(+(eased * value).toFixed(decimals));
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    }, delay);
    return () => clearTimeout(timer);
  }, [value, decimals, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
      className="glass-card-hover p-5 relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 gradient-primary" style={{ opacity: 0.03 }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{label}</span>
        <div className="text-primary opacity-60">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-mono font-bold tracking-tight ${color || "text-foreground"}`}>
          {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
        {trend && (
          <span className={`text-xs font-mono mb-1 ${trend === "up" ? "text-success" : trend === "down" ? "text-critical" : "text-muted-foreground"}`}>
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default KPICard;
