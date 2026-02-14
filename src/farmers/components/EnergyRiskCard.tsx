import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap } from "lucide-react";
import type { EnergyRiskLevel } from "../types";

interface EnergyRiskCardProps {
  score: number;
  level: EnergyRiskLevel;
  irrigationType: string;
}

export function EnergyRiskCard({ score, level, irrigationType }: EnergyRiskCardProps) {
  const color = level === "high" ? "text-destructive" : level === "medium" ? "text-yellow-500" : "text-emerald-400";
  return (
    <Card className="rounded-xl border-emerald-900/40 bg-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
          <Zap className="h-5 w-5" />
          Energy Risk Score
        </CardTitle>
        <CardDescription>Based on your irrigation type and current energy price trends.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-mono font-semibold"><span className={color}>{score}</span><span className="text-muted-foreground">/10</span></p>
        <p className="text-sm text-muted-foreground mt-1">Level: <span className={color}>{level}</span></p>
        <p className="text-xs text-muted-foreground mt-1">Irrigation: {irrigationType}. Higher diesel/electricity dependence increases risk.</p>
      </CardContent>
    </Card>
  );
}
