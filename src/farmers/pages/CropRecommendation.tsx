import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf } from "lucide-react";
import { FARMER_STATES } from "../data/cropStatsByState";
import { SOIL_TYPES } from "../data/soilTypes";
import { getRecommendedCrops, MONTH_OPTIONS, WATER_OPTIONS, type RecommendedCrop } from "../data/cropRecommendations";

export default function CropRecommendation() {
  const [stateId, setStateId] = useState("haryana");
  const [month, setMonth] = useState(6);
  const [soilType, setSoilType] = useState("Alluvial");
  const [waterAvailability, setWaterAvailability] = useState("Medium");
  const [landAcres, setLandAcres] = useState(2);

  const recommendations = useMemo(
    () => getRecommendedCrops(stateId, month, soilType, waterAvailability, landAcres),
    [stateId, month, soilType, waterAvailability, landAcres]
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-400" />
          Smart crop recommendation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get crop suggestions by state, month, soil type, and water availability.
        </p>
      </div>

      <Card className="border-emerald-900/40 bg-card">
        <CardHeader>
          <CardTitle className="text-base">Your conditions</CardTitle>
          <CardDescription>Select state, month, soil, water, and land size.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="border-border bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Soil type</Label>
            <Select value={soilType} onValueChange={setSoilType}>
              <SelectTrigger className="border-border bg-background/50">
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
              <SelectTrigger className="border-border bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WATER_OPTIONS.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Land size (acres)</Label>
            <Input
              type="number"
              min={0.1}
              step={0.5}
              value={landAcres}
              onChange={(e) => setLandAcres(parseFloat(e.target.value) || 1)}
              className="bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-emerald-400 mb-3">Recommended crops</h2>
        {recommendations.length === 0 ? (
          <Card className="border-emerald-900/40 bg-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              No crops match your current selection. Try a different month or water availability.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendations.map((crop) => (
              <CropCard key={crop.cropId} crop={crop} landAcres={landAcres} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CropCard({ crop, landAcres }: { crop: RecommendedCrop; landAcres: number }) {
  return (
    <Card className="border-emerald-900/40 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">{crop.name}</CardTitle>
        <CardDescription>
          Expected yield: {crop.yieldPerAcre.toFixed(2)} tons/acre × {landAcres} acres
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Water requirement:</span> {crop.waterReq}</p>
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Market demand:</span> {crop.marketDemand}</p>
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1">Cultivation steps</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
            {crop.cultivationSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm font-mono font-semibold text-emerald-400">
          Revenue estimation: ₹ {crop.estimatedRevenue.toLocaleString("en-IN")}
        </p>
      </CardContent>
    </Card>
  );
}
