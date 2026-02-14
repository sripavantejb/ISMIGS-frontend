import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TrendingUp } from "lucide-react";
import { CropSelector, CROP_CHOICES } from "../components/CropSelector";
import { ProfitProjection } from "../components/ProfitProjection";
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
    dieselPctChange,
    setDieselPctChange,
    projections,
    bestCrop,
    cropKey,
    defaultPrices,
  } = useCropProfitability(stateId, costInputs, areaAcresOverride);

  const cropName = CROP_CHOICES.find((c) => c.id === selectedCropId)?.name ?? "Crop";

  const totalYield = yieldPerAcre * areaAcres;
  const grossRevenue = totalYield * pricePerTon;
  let totalInvestment = 0;
  if (costInputs) {
    totalInvestment =
      (costInputs.seedCostPerAcre + costInputs.fertilizerCostPerAcre + costInputs.labourCostPerAcre + costInputs.irrigationCostPerAcre + costInputs.otherCostPerAcre) * areaAcres;
  }
  const netProfit = grossRevenue - totalInvestment;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-semibold text-foreground">Crop Profitability</h1>
        </div>
        <p className="text-sm text-muted-foreground">Compare crop returns by state and cultivation cost; see profit projections.</p>
      </div>

      <Card className="rounded-xl border-emerald-900/40 bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-400">Assumptions</CardTitle>
          <CardDescription>Select state and crop. Add cultivation cost from <Link to="/farmers/costs" className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Input Costs</Link> for accurate profit.</CardDescription>
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
          <p className="text-xs text-muted-foreground">To use full cost breakdown, go to <Link to="/farmers/costs" className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Input Costs</Link> and enter your figures there.</p>
        </CardContent>
      </Card>

      <ProfitProjection
        cropName={cropName}
        yieldPerAcre={yieldPerAcre}
        areaAcres={areaAcres}
        pricePerTon={pricePerTon}
        costInputs={costInputs}
      />

      <Card className="rounded-xl border-emerald-900/40 bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-400">Income & profit — Cost vs revenue</CardTitle>
          <CardDescription>Total investment, gross revenue, and net profit for selected crop and area.</CardDescription>
        </CardHeader>
        <CardContent>
          <CostRevenueChart totalInvestment={totalInvestment} grossRevenue={grossRevenue} netProfit={netProfit} />
        </CardContent>
      </Card>

      <Card className="rounded-xl border-emerald-900/40 bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-400">Sensitivity: What if diesel +10%?</CardTitle>
          <CardDescription>Adjust slider to see impact on irrigation cost and profit.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Diesel change: {dieselPctChange}%</Label>
          <Slider value={[dieselPctChange]} onValueChange={([v]) => setDieselPctChange(v ?? 0)} min={-20} max={20} step={5} className="mt-2" />
          <ProfitProjection cropName={cropName} yieldPerAcre={yieldPerAcre} areaAcres={areaAcres} pricePerTon={pricePerTon} costInputs={costInputs} dieselPctChange={dieselPctChange} />
        </CardContent>
      </Card>

      <section>
        <h2 className="text-sm font-medium text-emerald-400 mb-2">Profit comparison</h2>
        <div className="flex flex-wrap gap-4">
          {projections.map((p) => (
            <Card key={p.crop} className="rounded-xl border-emerald-900/40 bg-card flex-1 min-w-[140px]">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-foreground">{p.crop}</p>
                <p className={`font-mono font-semibold ${p.netProfit >= 0 ? "text-emerald-400" : "text-destructive"}`}>₹ {p.netProfit.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">Margin {p.margin.toFixed(0)}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {bestCrop && <p className="text-sm text-muted-foreground mt-2">Best crop for your inputs: <span className="text-emerald-400 font-medium">{bestCrop.crop}</span></p>}
      </section>
    </div>
  );
}
