import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FARMER_STATES } from "../data/cropStatsByState";
import { SOIL_TYPES } from "../data/soilTypes";
import { getRecommendedCrops, MONTH_OPTIONS, WATER_OPTIONS, type RecommendedCrop } from "../data/cropRecommendations";

export default function CropRecommendation() {
  const [stateId, setStateId] = useState("haryana");
  const [month, setMonth] = useState(6);
  const [soilType, setSoilType] = useState("Alluvial");
  const [waterAvailability, setWaterAvailability] = useState("Medium");
  const [landAcres, setLandAcres] = useState(2);
  const [loading, setLoading] = useState(false);

  const recommendations = useMemo(
    () => getRecommendedCrops(stateId, month, soilType, waterAvailability, landAcres),
    [stateId, month, soilType, waterAvailability, landAcres]
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(timer);
  }, [stateId, month, soilType, waterAvailability, landAcres]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl w-full min-w-0 text-left">
      <Card className="agri-card">
        <CardHeader className="text-left">
          <CardTitle className="text-base">Your conditions</CardTitle>
          <CardDescription className="text-left">Select state, month, soil, water, and land size.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start text-left">
          <div className="space-y-2">
            <Label>State</Label>
            <Select value={stateId} onValueChange={(v) => { setLoading(true); setStateId(v); }}>
              <SelectTrigger className="w-full border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
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
            <Select value={String(month)} onValueChange={(v) => { setLoading(true); setMonth(Number(v)); }}>
              <SelectTrigger className="w-full border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
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
            <Select value={soilType} onValueChange={(v) => { setLoading(true); setSoilType(v); }}>
              <SelectTrigger className="w-full border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
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
            <Select value={waterAvailability} onValueChange={(v) => { setLoading(true); setWaterAvailability(v); }}>
              <SelectTrigger className="w-full border-border bg-background/50 text-left [&>span]:text-left justify-start [&>svg]:ml-auto">
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
              onChange={(e) => { setLoading(true); setLandAcres(parseFloat(e.target.value) || 1); }}
              className="w-full bg-background/50 text-left"
            />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4 text-left w-full min-w-0">
        <h2 className="agri-section-header">Recommended crops</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0 items-stretch">
            <CropCardSkeleton />
            <CropCardSkeleton />
          </div>
        ) : recommendations.length === 0 ? (
          <Card className="agri-card">
            <CardContent className="py-8 text-left text-muted-foreground">
              No crops match your current selection. Try a different month or water availability.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0 items-stretch">
            {recommendations.map((crop) => (
              <CropCard key={crop.cropId} crop={crop} landAcres={landAcres} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CropCardSkeleton() {
  return (
    <Card className="agri-card text-left w-full min-w-0 flex flex-col h-full">
      <CardHeader className="pb-2 text-left">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3 text-left flex-1 flex flex-col">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div>
          <Skeleton className="h-3 w-28 mb-2" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-32 mt-auto" />
      </CardContent>
    </Card>
  );
}

function CropCard({ crop, landAcres }: { crop: RecommendedCrop; landAcres: number }) {
  return (
    <Card className="agri-card text-left w-full min-w-0 flex flex-col h-full">
      <CardHeader className="pb-2 text-left">
        <CardTitle className="text-base text-foreground">{crop.name}</CardTitle>
        <CardDescription className="text-left">
          Expected yield: {crop.yieldPerAcre.toFixed(2)} tons/acre × {landAcres} acres
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-left flex-1 flex flex-col">
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
        <p className="mt-auto text-sm font-mono font-semibold text-emerald-400">
          Revenue estimation: ₹ {crop.estimatedRevenue.toLocaleString("en-IN")}
        </p>
      </CardContent>
    </Card>
  );
}
