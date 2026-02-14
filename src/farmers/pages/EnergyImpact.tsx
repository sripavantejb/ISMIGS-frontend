import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { EnergyRiskCard } from "../components/EnergyRiskCard";
import { CostSimulation } from "../components/CostSimulation";
import { useEnergyImpact } from "../hooks/useEnergyImpact";
import { useFarmProfile } from "../hooks/useFarmProfile";
import { useInputCosts } from "../hooks/useInputCosts";

export default function EnergyImpact() {
  const { profile } = useFarmProfile();
  const { prices } = useInputCosts();
  const dieselTrend = prices.find((p) => p.type === "diesel")?.trend ?? "stable";
  const electricityTrend = prices.find((p) => p.type === "electricity")?.trend ?? "stable";
  const irrigationType = profile?.irrigationType ?? "electric";
  const irrigationLabel = irrigationType === "diesel" ? "Diesel pump" : irrigationType === "solar" ? "Solar pump" : "Electric pump";

  const { score, level, dieselPct, setDieselPct, electricityPct, setElectricityPct, impactText } = useEnergyImpact(
    irrigationType,
    dieselTrend,
    electricityTrend
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-semibold text-foreground">Energy Impact Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">See how diesel and electricity costs affect your farm and run simulations. Uses your <Link to="/farmers/profile" className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Farm Profile</Link> and <Link to="/farmers/costs" className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Input Costs</Link> for context.</p>
      </div>

      <EnergyRiskCard score={score} level={level} irrigationType={irrigationLabel} />

      <section>
        <h2 className="text-sm font-medium text-emerald-400 mb-2">Energy → cost links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl border-emerald-900/40 bg-card">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-foreground">Natural gas → Fertilizer</p>
              <p className="text-xs text-muted-foreground">When natural gas rises, fertilizer cost typically increases. Track in <Link to="/farmers/costs" className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Input Costs</Link>.</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-emerald-900/40 bg-card">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-foreground">Coal → Electricity tariff</p>
              <p className="text-xs text-muted-foreground">Coal prices influence grid tariffs. Affects electric pump irrigation cost.</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-emerald-900/40 bg-card">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-foreground">Crude oil → Diesel</p>
              <p className="text-xs text-muted-foreground">Diesel follows crude. Direct impact on diesel pump and transport costs.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <CostSimulation
        dieselPct={dieselPct}
        electricityPct={electricityPct}
        onDieselChange={setDieselPct}
        onElectricityChange={setElectricityPct}
        estimatedImpact={impactText ?? undefined}
      />
    </div>
  );
}
