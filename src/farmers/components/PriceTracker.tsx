import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PricePoint } from "../types";

interface PriceTrackerProps {
  prices: PricePoint[];
  loading?: boolean;
}

export function PriceTracker({ prices, loading }: PriceTrackerProps) {
  if (loading) return <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {prices.map((p) => (
        <Card key={p.type} className="rounded-xl border-emerald-900/40 bg-card">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{p.type}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-semibold text-foreground">{p.value} {p.unit}</span>
              {p.trend === "up" && <TrendingUp className="h-4 w-4 text-destructive" />}
              {p.trend === "down" && <TrendingDown className="h-4 w-4 text-emerald-400" />}
              {p.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Forecast: {p.trend === "up" ? "Rising with input costs" : p.trend === "down" ? "Declining" : "Stable"}. Refreshed periodically.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
