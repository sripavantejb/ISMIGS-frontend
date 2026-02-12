import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  level: "danger" | "warning";
  title: string;
  message: string;
}

export function AlertBanner({ level, title, message }: AlertBannerProps) {
  const isDanger = level === "danger";
  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border ${
        isDanger
          ? "bg-critical/10 border-critical/30 text-critical"
          : "bg-warning/10 border-warning/30 text-warning"
      }`}
    >
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <strong className="font-semibold block">{title}</strong>
        <div className="text-sm mt-1 opacity-90">{message}</div>
      </div>
    </div>
  );
}
