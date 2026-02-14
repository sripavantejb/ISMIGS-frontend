import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CultivationCostInputs } from "../types";

interface ProfitProjectionProps {
  cropName: string;
  yieldPerAcre: number;
  areaAcres: number;
  pricePerTon: number;
  costInputs: CultivationCostInputs | null;
  dieselPctChange?: number;
}

export function ProfitProjection({
  cropName,
  yieldPerAcre,
  areaAcres,
  pricePerTon,
  costInputs,
  dieselPctChange = 0,
}: ProfitProjectionProps) {
  const totalYield = yieldPerAcre * areaAcres;
  const grossRevenue = totalYield * pricePerTon;
  let totalCost = 0;
  if (costInputs) {
    const irrigAdj = dieselPctChange !== 0 ? costInputs.irrigationCostPerAcre * (1 + dieselPctChange / 100) : costInputs.irrigationCostPerAcre;
    totalCost =
      (costInputs.seedCostPerAcre + costInputs.fertilizerCostPerAcre + costInputs.labourCostPerAcre + irrigAdj + costInputs.otherCostPerAcre) * areaAcres;
  }
  const netProfit = grossRevenue - totalCost;
  const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return (
    <Card className="agri-card">
      <CardHeader>
        <CardTitle className="text-lg agri-icon">{cropName} — Projection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Expected yield: <span className="font-mono text-foreground">{totalYield.toFixed(1)} tons</span> ({yieldPerAcre} t/acre × {areaAcres} acres)</p>
        <p className="text-sm text-muted-foreground">Gross revenue: <span className="font-mono text-foreground">₹ {grossRevenue.toLocaleString("en-IN")}</span> (₹ {pricePerTon}/ton)</p>
        {costInputs && <p className="text-sm text-muted-foreground">Total cost: <span className="font-mono text-foreground">₹ {totalCost.toLocaleString("en-IN")}</span>{dieselPctChange !== 0 && " (incl. diesel sensitivity)"}</p>}
        <p className="text-base font-semibold text-foreground">Net profit: <span className={netProfit >= 0 ? "agri-icon" : "text-destructive"}>₹ {netProfit.toLocaleString("en-IN")}</span></p>
        <p className="text-xs text-muted-foreground">Margin: {margin.toFixed(1)}%</p>
      </CardContent>
    </Card>
  );
}
