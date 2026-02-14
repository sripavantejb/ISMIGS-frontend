import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { PriceTracker } from "../components/PriceTracker";
import { CostCalculator } from "../components/CostCalculator";
import { useInputCosts } from "../hooks/useInputCosts";

export default function InputCosts() {
  const { prices, loading, riskScore } = useInputCosts();
  const risk = riskScore();
  const riskLabel = risk === "high" ? "High" : risk === "medium" ? "Medium" : "Low";

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-semibold text-foreground">Input Cost Intelligence</h1>
        </div>
        <p className="text-sm text-muted-foreground">Track fertilizer, diesel, and input prices; see risk and run cost scenarios.</p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-emerald-400 mb-2">Current prices (indicative)</h2>
        <PriceTracker prices={prices} loading={loading} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-emerald-400 mb-2">Input cost risk</h2>
        <Card className="rounded-xl border-emerald-900/40 bg-card max-w-xs">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Risk score</p>
            <p className={`text-lg font-semibold ${risk === "high" ? "text-destructive" : risk === "medium" ? "text-yellow-500" : "text-emerald-400"}`}>{riskLabel}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Based on current price trends. High = multiple inputs rising.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <CostCalculator />
      </section>
    </div>
  );
}
