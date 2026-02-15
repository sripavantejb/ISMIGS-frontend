import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, Zap, CloudSun, ChevronRight } from "lucide-react";
import { API_BASE } from "@/config/api";
import { getAgricultureUpdates } from "../data/agricultureUpdates";
import type { AgricultureUpdate } from "../types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dNorm = new Date(d);
  dNorm.setHours(0, 0, 0, 0);
  if (dNorm.getTime() === today.getTime()) return "Today";
  if (dNorm.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function TypeIcon({ type }: { type: AgricultureUpdate["type"] }) {
  switch (type) {
    case "scheme":
      return <FileText className="h-4 w-4 text-emerald-500" />;
    case "price":
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case "input_cost":
      return <Zap className="h-4 w-4 text-emerald-500" />;
    case "weather":
      return <CloudSun className="h-4 w-4 text-emerald-500" />;
  }
}

function TypeBadge({ type }: { type: AgricultureUpdate["type"] }) {
  const labels: Record<AgricultureUpdate["type"], string> = {
    scheme: "Scheme",
    price: "Market price",
    input_cost: "Input cost",
    weather: "Weather",
  };
  return <Badge variant="secondary" className="text-xs font-normal">{labels[type]}</Badge>;
}

export function AgricultureUpdatesFeed() {
  const [prices, setPrices] = useState<Array<{ type: string; value: number; unit: string; trend?: string; updatedAt?: string }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/farmers/prices`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.prices) setPrices(data.prices);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const updates = useMemo(() => {
    const costs = prices?.map((p) => ({
      type: p.type as "fertilizer" | "diesel" | "electricity",
      value: p.value,
      unit: p.unit,
      trend: (p.trend === "up" || p.trend === "down" || p.trend === "stable" ? p.trend : undefined) as "up" | "down" | "stable" | undefined,
      updatedAt: p.updatedAt,
    }));
    return getAgricultureUpdates(costs);
  }, [prices]);

  if (loading) {
    return (
      <Card className="agri-card w-full">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-border/50 last:border-0">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full max-w-sm" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="agri-card w-full">
      <CardContent className="pt-6">
        <ul className="divide-y divide-border/50">
          {updates.map((u) => (
            <li key={u.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex gap-3 items-start">
                <div className="mt-0.5">
                  <TypeIcon type={u.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <TypeBadge type={u.type} />
                    <span className="text-xs text-muted-foreground">{formatDate(u.date)}</span>
                  </div>
                  <p className="font-medium text-foreground text-sm">{u.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{u.summary}</p>
                  {u.link && (
                    <Link to={u.link} className="inline-flex items-center gap-1 text-xs agri-link mt-2">
                      View details <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
