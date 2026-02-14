import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface CostSimulationProps {
  dieselPct: number;
  electricityPct: number;
  onDieselChange: (v: number) => void;
  onElectricityChange: (v: number) => void;
  estimatedImpact?: string;
}

export function CostSimulation({
  dieselPct,
  electricityPct,
  onDieselChange,
  onElectricityChange,
  estimatedImpact,
}: CostSimulationProps) {
  return (
    <Card className="rounded-xl border-emerald-900/40 bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-emerald-400">Cost increase simulation</CardTitle>
        <CardDescription>See how fuel and tariff changes affect your costs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Diesel price change: {dieselPct}%</Label>
          <Slider value={[dieselPct]} onValueChange={([v]) => onDieselChange(v ?? 0)} min={-20} max={30} step={5} />
        </div>
        <div className="space-y-2">
          <Label>Electricity tariff change: {electricityPct}%</Label>
          <Slider value={[electricityPct]} onValueChange={([v]) => onElectricityChange(v ?? 0)} min={-20} max={30} step={5} />
        </div>
        {estimatedImpact && <p className="text-sm text-muted-foreground">{estimatedImpact}</p>}
      </CardContent>
    </Card>
  );
}
