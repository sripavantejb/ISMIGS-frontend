import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FARMER_STATES } from "../data/cropStatsByState";
import { CROP_OPTIONS } from "../data/crops";
import { SOIL_TYPES } from "../data/soilTypes";
import { WATER_OPTIONS } from "../data/cropRecommendations";
import { useCultivationCostAI, type CultivationCostInputs } from "../hooks/useCultivationCostAI";

export function CultivationCostAI() {
  const [crop, setCrop] = useState("rice");
  const [stateId, setStateId] = useState("haryana");
  const [areaAcres, setAreaAcres] = useState(2);
  const [soilType, setSoilType] = useState("Alluvial");
  const [waterAvailability, setWaterAvailability] = useState("Medium");

  const { loading, error, result, calculate } = useCultivationCostAI();

  const cropName = CROP_OPTIONS.find((c) => c.id === crop)?.name ?? crop.replace(/-/g, " ");
  const stateName = FARMER_STATES.find((s) => s.id === stateId)?.name ?? stateId;

  const handleCalculate = () => {
    const inputs: CultivationCostInputs = {
      crop: cropName,
      state: stateName,
      areaAcres,
      soilType,
      waterAvailability,
    };
    calculate(inputs);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      <Card className="agri-card">
        <CardHeader className="text-left">
          <CardTitle className="text-lg agri-icon">Your inputs</CardTitle>
          <CardDescription className="text-left">Select crop, state, area, soil, and water. Click Calculate for AI estimate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Crop</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger className="border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CROP_OPTIONS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={stateId} onValueChange={setStateId}>
                <SelectTrigger className="border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FARMER_STATES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Area (acres)</Label>
              <Input
                type="number"
                min={0.1}
                step={0.5}
                value={areaAcres}
                onChange={(e) => setAreaAcres(parseFloat(e.target.value) || 1)}
                className="bg-background/50 text-left"
              />
            </div>
            <div className="space-y-2">
              <Label>Soil type</Label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger className="border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOIL_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Water availability</Label>
              <Select value={waterAvailability} onValueChange={setWaterAvailability}>
                <SelectTrigger className="border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WATER_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? "Calculating..." : "Calculate"}
          </Button>
        </CardContent>
      </Card>

      <Card className="agri-card">
        <CardHeader className="text-left">
          <CardTitle className="text-lg agri-icon">Result</CardTitle>
          <CardDescription className="text-left">Total cost, cultivation process, and expected selling price.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="space-y-1.5 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          )}
          {error && !loading && (
            <div>
              <p className="text-sm text-destructive">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleCalculate}
              >
                Retry
              </Button>
            </div>
          )}
          {result && !loading && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total cultivation cost (approx.)</p>
                <p className="text-2xl font-mono font-semibold text-emerald-400">₹ {result.totalCost.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected selling price</p>
                <p className="text-xl font-mono font-semibold text-emerald-400">₹ {result.expectedSellingPrice.toLocaleString("en-IN")}</p>
              </div>
              {result.cultivationProcess.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-1">Cultivation process</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                    {result.cultivationProcess.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.costBreakdown && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-1">Cost breakdown (₹/acre)</p>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {result.costBreakdown.seed != null && <li>Seed: ₹ {result.costBreakdown.seed.toLocaleString("en-IN")}</li>}
                    {result.costBreakdown.fertilizer != null && <li>Fertilizer: ₹ {result.costBreakdown.fertilizer.toLocaleString("en-IN")}</li>}
                    {result.costBreakdown.labour != null && <li>Labour: ₹ {result.costBreakdown.labour.toLocaleString("en-IN")}</li>}
                    {result.costBreakdown.irrigation != null && <li>Irrigation: ₹ {result.costBreakdown.irrigation.toLocaleString("en-IN")}</li>}
                    {result.costBreakdown.other != null && <li>Other: ₹ {result.costBreakdown.other.toLocaleString("en-IN")}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!result && !loading && !error && (
            <p className="text-sm text-muted-foreground">Enter your inputs and click Calculate to see the AI estimate.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
