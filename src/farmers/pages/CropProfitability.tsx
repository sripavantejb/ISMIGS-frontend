import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CropSelector } from "../components/CropSelector";
import { CostRevenueChart } from "../components/CostRevenueChart";
import { useCropProfitability } from "../hooks/useCropProfitability";
import { FARMER_STATES } from "../data/cropStatsByState";
import type { CultivationCostInputs } from "../types";

export default function CropProfitability() {
  const [stateId, setStateId] = useState("haryana");
  const [costInputs, setCostInputs] = useState<CultivationCostInputs | null>(null);
  const [areaAcresOverride, setAreaAcresOverride] = useState(2);

  const {
    selectedCropId,
    setSelectedCropId,
    pricePerTon,
    setPricePerTon,
    yieldPerAcre,
    areaAcres,
  } = useCropProfitability(stateId, costInputs, areaAcresOverride);

  const totalYield = yieldPerAcre * areaAcres;
  const grossRevenue = totalYield * pricePerTon;
  let totalInvestment = 0;
  if (costInputs) {
    totalInvestment =
      (costInputs.seedCostPerAcre + costInputs.fertilizerCostPerAcre + costInputs.labourCostPerAcre + costInputs.irrigationCostPerAcre + costInputs.otherCostPerAcre) * areaAcres;
  }
  const netProfit = grossRevenue - totalInvestment;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background max-w-4xl w-full min-w-0">
      <Card className="agri-card w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg agri-icon">Assumptions</CardTitle>
          <CardDescription>Select state and crop. Add cultivation cost from <Link to="/agriculture/costs" className="agri-link">Input Costs</Link> for accurate profit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={stateId} onValueChange={setStateId}>
                <SelectTrigger className="border-border bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FARMER_STATES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CropSelector value={selectedCropId} onValueChange={setSelectedCropId} />
          </div>
          <div className="space-y-2">
            <Label>Expected price (₹/ton)</Label>
            <Input type="number" min={0} value={pricePerTon} onChange={(e) => setPricePerTon(parseFloat(e.target.value) || 0)} className="max-w-xs bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Area (acres)</Label>
            <Input type="number" min={0.1} step={0.5} value={areaAcresOverride} onChange={(e) => setAreaAcresOverride(parseFloat(e.target.value) || 1)} className="max-w-xs bg-background/50" />
          </div>
          <p className="text-xs text-muted-foreground">To use full cost breakdown, go to <Link to="/agriculture/costs" className="agri-link">Input Costs</Link> and enter your figures there.</p>
        </CardContent>
      </Card>

      <Card className="agri-card w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg agri-icon">Income & profit — Cost vs revenue</CardTitle>
          <CardDescription>Total investment, gross revenue, and net profit for selected crop and area.</CardDescription>
        </CardHeader>
        <CardContent>
          <CostRevenueChart totalInvestment={totalInvestment} grossRevenue={grossRevenue} netProfit={netProfit} />
        </CardContent>
      </Card>
    </div>
  );
}
