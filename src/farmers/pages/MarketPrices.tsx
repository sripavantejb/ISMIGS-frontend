import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FARMER_STATES } from "../data/cropStatsByState";
import { getMspMandiMock, getMspMandiChartMock } from "../data/mspMandiMock";

const CROP_OPTIONS = [
  { id: "rice", name: "Rice" },
  { id: "wheat", name: "Wheat" },
  { id: "cotton", name: "Cotton" },
  { id: "sugarcane", name: "Sugarcane" },
  { id: "maize", name: "Maize" },
  { id: "bajra", name: "Bajra" },
];

export default function MarketPrices() {
  const [cropId, setCropId] = useState("rice");
  const [stateId, setStateId] = useState("haryana");

  const priceRow = useMemo(() => getMspMandiMock(cropId, stateId), [cropId, stateId]);
  const chartData = useMemo(() => getMspMandiChartMock(cropId, stateId), [cropId, stateId]);
  const stateName = FARMER_STATES.find((s) => s.id === stateId)?.name ?? stateId;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">MSP & live market prices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Minimum support price and mandi prices by crop and state (indicative).
        </p>
      </div>

      <Card className="border-emerald-900/40 bg-card">
        <CardHeader>
          <CardTitle className="text-base">Select crop and state</CardTitle>
          <CardDescription>Prices in ₹/quintal (100 kg).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Crop</Label>
            <Select value={cropId} onValueChange={setCropId}>
              <SelectTrigger className="w-[160px] border-border bg-background/50">
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
              <SelectTrigger className="w-[180px] border-border bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FARMER_STATES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-900/40 bg-card">
            <CardHeader>
              <CardTitle className="text-base">Current prices</CardTitle>
              <CardDescription>{priceRow.cropName} in {stateName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><span className="text-muted-foreground">MSP (₹/q):</span> <span className="font-mono font-medium">₹ {priceRow.msp.toLocaleString("en-IN")}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Today’s mandi:</span> <span className="font-mono font-medium">₹ {priceRow.today.toLocaleString("en-IN")}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Yesterday:</span> <span className="font-mono">₹ {priceRow.yesterday.toLocaleString("en-IN")}</span></p>
              <p className="text-sm flex items-center gap-1">
                <span className="text-muted-foreground">Price trend:</span>
                {priceRow.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                {priceRow.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                {priceRow.trend === "flat" && <Minus className="h-4 w-4 text-muted-foreground" />}
                <span className={priceRow.trend === "up" ? "text-emerald-400" : priceRow.trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                  {priceRow.trendPct >= 0 ? "+" : ""}{priceRow.trendPct.toFixed(1)}%
                </span>
              </p>
              <Button variant="outline" size="sm" className="mt-2 border-emerald-900/40" asChild>
                <a href="https://agmarknet.gov.in/" target="_blank" rel="noopener noreferrer" title="AGMARKNET mandi portal">
                  Sell Now / View mandi portal <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>

      <Card className="border-emerald-900/40 bg-card">
            <CardHeader>
              <CardTitle className="text-base">Market comparison (MSP vs mandi)</CardTitle>
              <CardDescription>Mock monthly trend; use AGMARKNET for actual data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`₹ ${v.toLocaleString("en-IN")}`, ""]} contentStyle={{ backgroundColor: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 22%)", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend />
                    <Bar dataKey="msp" name="MSP" fill="hsl(160 84% 39%)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="mandi" name="Mandi" fill="hsl(222 47% 50%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
    </div>
  );
}
