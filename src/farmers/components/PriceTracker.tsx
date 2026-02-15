import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PricePoint } from "../types";

interface PriceTrackerProps {
  prices: PricePoint[];
  loading?: boolean;
}

export function PriceTracker({ prices, loading }: PriceTrackerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="agri-card">
            <CardHeader className="pb-1">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {prices.map((p) => (
        <Card key={p.type} className="agri-card">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{p.type}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-semibold text-foreground">{p.value} {p.unit}</span>
              {p.trend === "up" && <TrendingUp className="h-4 w-4 text-destructive" />}
              {p.trend === "down" && <TrendingDown className="h-4 w-4 agri-icon" />}
              {p.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Forecast: {p.trend === "up" ? "Rising with input costs" : p.trend === "down" ? "Declining" : "Stable"}. Refreshed periodically.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
