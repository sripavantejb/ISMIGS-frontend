import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CultivationCostInputs } from "../types";

interface CostCalculatorProps {
  defaultArea?: number;
  defaultIrrigationPerAcre?: number;
  onCalculate?: (inputs: CultivationCostInputs, total: number, perAcre: number) => void;
}

export function CostCalculator({
  defaultArea = 2,
  defaultIrrigationPerAcre = 4000,
  onCalculate,
}: CostCalculatorProps) {
  const [areaAcres, setAreaAcres] = useState(defaultArea.toString());
  const [seedCostPerAcre, setSeedCostPerAcre] = useState("2500");
  const [fertilizerCostPerAcre, setFertilizerCostPerAcre] = useState("6000");
  const [labourCostPerAcre, setLabourCostPerAcre] = useState("8000");
  const [irrigationCostPerAcre, setIrrigationCostPerAcre] = useState(defaultIrrigationPerAcre.toString());
  const [otherCostPerAcre, setOtherCostPerAcre] = useState("2000");

  const area = parseFloat(areaAcres) || 0;
  const seed = parseFloat(seedCostPerAcre) || 0;
  const fert = parseFloat(fertilizerCostPerAcre) || 0;
  const labour = parseFloat(labourCostPerAcre) || 0;
  const irrig = parseFloat(irrigationCostPerAcre) || 0;
  const other = parseFloat(otherCostPerAcre) || 0;
  const perAcre = seed + fert + labour + irrig + other;
  const total = perAcre * area;

  const inputs: CultivationCostInputs = {
    areaAcres: area,
    seedCostPerAcre: seed,
    fertilizerCostPerAcre: fert,
    labourCostPerAcre: labour,
    irrigationCostPerAcre: irrig,
    otherCostPerAcre: other,
  };

  return (
    <Card className="rounded-xl border-emerald-900/40 bg-card max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg text-emerald-400">Cultivation cost calculator</CardTitle>
        <CardDescription>Enter cost per acre. Total and per-acre breakdown below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Area (acres)</Label>
            <Input type="number" min={0.1} step={0.5} value={areaAcres} onChange={(e) => setAreaAcres(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Seed (₹/acre)</Label>
            <Input type="number" min={0} value={seedCostPerAcre} onChange={(e) => setSeedCostPerAcre(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Fertilizer (₹/acre)</Label>
            <Input type="number" min={0} value={fertilizerCostPerAcre} onChange={(e) => setFertilizerCostPerAcre(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Labour (₹/acre)</Label>
            <Input type="number" min={0} value={labourCostPerAcre} onChange={(e) => setLabourCostPerAcre(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Irrigation (₹/acre)</Label>
            <Input type="number" min={0} value={irrigationCostPerAcre} onChange={(e) => setIrrigationCostPerAcre(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Other (₹/acre)</Label>
            <Input type="number" min={0} value={otherCostPerAcre} onChange={(e) => setOtherCostPerAcre(e.target.value)} className="bg-background/50" />
          </div>
        </div>
        <div className="pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">Total cultivation cost (approx.)</p>
          <p className="text-2xl font-mono font-semibold text-emerald-400">₹ {total.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-1">Per acre: ₹ {perAcre.toLocaleString("en-IN")}</p>
        </div>
        {onCalculate && (
          <Button type="button" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => onCalculate(inputs, total, perAcre)}>
            Use in profitability
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
