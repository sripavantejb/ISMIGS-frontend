import { Badge } from "@/components/ui/badge";

interface Metric {
  label: string;
  value: string | number;
}

interface PredictionCardProps {
  title: string;
  status?: "pressure" | "elevated" | "stable";
  metrics?: Metric[];
  children?: React.ReactNode;
  className?: string;
}

export function PredictionCard({ title, status, metrics, children, className = "" }: PredictionCardProps) {
  const statusLabel =
    status === "pressure"
      ? "Moderate pressure"
      : status === "elevated"
      ? "Elevated"
      : "Stable";

  const statusVariant =
    status === "pressure"
      ? "warning"
      : status === "elevated"
      ? "destructive"
      : "default";

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex justify-between items-baseline mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {status && (
          <Badge variant={statusVariant === "warning" ? "secondary" : statusVariant} className="text-xs">
            {statusLabel}
          </Badge>
        )}
      </div>

      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="font-mono font-bold text-foreground">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
