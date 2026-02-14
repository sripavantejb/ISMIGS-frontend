import { useState, useEffect, useCallback } from "react";
import {
  Mic, Camera, Video, Sun, Leaf, Package, RefreshCw, MapPin, Droplets, Wind, CloudSun, CloudRain,
  Loader2, Upload, ImagePlus, AlertCircle, LayoutDashboard, User, Calculator, TrendingUp, Zap, Bell, Map, ChevronDown, ChevronUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetchWeatherByCity, weatherCodeToLabel, analyzeDisease, type WeatherForecast, type DiagnosisResponse } from "../services/farmersApi";
import { FARMER_STATES, getCropStatsForState, getStatewiseProduction, type CropStat } from "../data/cropStatsByState";
import { getRecommendedCrops } from "../data/cropRecommendations";

const CHATBOT_OPEN_EVENT = "ismigs-open-chatbot";
const DEFAULT_CITY = "Serilingampalle";
const chartTooltipStyle = { backgroundColor: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 22%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "12px" };
const PER_ACRE_LIMIT_LAKHS = 1.6;
const RAIN_WEATHER_CODES = [51, 61, 63, 80, 81, 82, 95, 96];

function getCropWeatherAdvice(temp: number, hasRain: boolean): string {
  if (hasRain) return "Rain expected — avoid spraying; postpone fertilizer application if heavy rain forecast.";
  if (temp >= 35) return "Hot — suitable for drying; irrigate in evening; avoid midday spraying.";
  if (temp >= 25 && temp < 35) return "Good conditions for field work and sowing.";
  if (temp >= 15 && temp < 25) return "Cool — suitable for rabi operations and spraying.";
  if (temp < 15) return "Cold — protect sensitive crops; delay irrigation if frost risk.";
  return "Check local advisory for crop-specific advice.";
}

/** Indicative KCC/agri loan rates (reference only; actual rates from banks). */
const LOAN_BANKS_AND_RATES: { bank: string; scheme: string; ratePct: number; notes?: string }[] = [
  { bank: "SBI", scheme: "KCC (crop loan)", ratePct: 7, notes: "With interest subvention" },
  { bank: "SBI", scheme: "KCC (beyond subvention)", ratePct: 9.5 },
  { bank: "HDFC Bank", scheme: "Kisan Credit Card", ratePct: 8.5 },
  { bank: "ICICI Bank", scheme: "KCC / Agri term", ratePct: 9 },
  { bank: "Bank of Baroda", scheme: "KCC", ratePct: 7 },
  { bank: "PNB", scheme: "KCC", ratePct: 7 },
  { bank: "Canara Bank", scheme: "KCC", ratePct: 7 },
  { bank: "Union Bank", scheme: "KCC", ratePct: 7 },
  { bank: "NABARD (via banks)", scheme: "Refinance-backed crop loans", ratePct: 7 },
  { bank: "Regional Rural Banks", scheme: "KCC / short-term crop", ratePct: 7 },
];

function openVoiceAssistant() {
  window.dispatchEvent(new CustomEvent(CHATBOT_OPEN_EVENT));
}

/** Resize/compress image so request stays under Vercel payload limit (~4.5 MB). Returns data URL. */
async function compressImageForDiseaseDetection(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Failed to load image"));
      i.src = url;
    });
    const maxSize = 1024;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxSize || h > maxSize) {
      if (w > h) {
        h = Math.round((h * maxSize) / w);
        w = maxSize;
      } else {
        w = Math.round((w * maxSize) / h);
        h = maxSize;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const quickLinks = [
  { to: "/farmers/profile", label: "Farm Profile", icon: User },
  { to: "/farmers/costs", label: "Input Costs", icon: Calculator },
  { to: "/farmers/profitability", label: "Crop Profitability", icon: TrendingUp },
  { to: "/farmers/energy", label: "Energy Impact", icon: Zap },
  { to: "/farmers/alerts", label: "Alerts", icon: Bell },
  { to: "/farmers/rural-prices", label: "Rural prices map", icon: Map },
];

export default function FarmersDashboard() {
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherCity, setWeatherCity] = useState(DEFAULT_CITY);
  const [selectedStateId, setSelectedStateId] = useState("haryana");
  const [acres, setAcres] = useState("");
  const [diseaseModalOpen, setDiseaseModalOpen] = useState(false);
  const [diseaseStep, setDiseaseStep] = useState<"upload" | "loading" | "result" | "error">("upload");
  const [diseaseFile, setDiseaseFile] = useState<File | null>(null);
  const [diseasePreviewUrl, setDiseasePreviewUrl] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DiagnosisResponse | null>(null);
  const [diseaseError, setDiseaseError] = useState<string | null>(null);
  const [banksOpen, setBanksOpen] = useState(false);

  const cropStats = getCropStatsForState(selectedStateId);
  const statewiseData = getStatewiseProduction();

  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchWeatherByCity(weatherCity);
      setWeather(data);
    } catch (e) {
      setWeatherError(e instanceof Error ? e.message : "Failed to load weather");
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, [weatherCity]);

  useEffect(() => { loadWeather(); }, [loadWeather]);
  useEffect(() => {
    if (diseaseModalOpen) {
      setDiseaseStep("upload");
      setDiseaseFile(null);
      setDiseasePreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      setDiseaseResult(null);
      setDiseaseError(null);
    }
  }, [diseaseModalOpen]);

  const MAX_DISEASE_IMAGE_MB = 8;
  const handleDiseaseFile = (file: File | null) => {
    if (diseasePreviewUrl) URL.revokeObjectURL(diseasePreviewUrl);
    setDiseasePreviewUrl(null);
    setDiseaseFile(null);
    setDiseaseError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) { setDiseaseError("Please select an image file (JPEG, PNG, etc.)."); return; }
    if (file.size > MAX_DISEASE_IMAGE_MB * 1024 * 1024) { setDiseaseError(`Image must be under ${MAX_DISEASE_IMAGE_MB} MB.`); return; }
    setDiseaseError(null);
    setDiseaseFile(file);
    setDiseasePreviewUrl(URL.createObjectURL(file));
  };

  const runDiseaseAnalysis = async () => {
    if (!diseaseFile) return;
    setDiseaseStep("loading");
    setDiseaseError(null);
    setDiseaseResult(null);
    try {
      const base64 = await compressImageForDiseaseDetection(diseaseFile);
      const response = await analyzeDisease(base64);
      setDiseaseResult(response);
      setDiseaseStep("result");
    } catch (e) {
      setDiseaseError(e instanceof Error ? e.message : "Analysis failed.");
      setDiseaseStep("error");
    }
  };

  const resetDiseaseToUpload = () => {
    setDiseaseStep("upload");
    if (diseasePreviewUrl) URL.revokeObjectURL(diseasePreviewUrl);
    setDiseasePreviewUrl(null);
    setDiseaseFile(null);
    setDiseaseResult(null);
    setDiseaseError(null);
  };

  const loanEstimate = acres !== "" && !Number.isNaN(Number(acres)) && Number(acres) >= 0 ? Number(acres) * PER_ACRE_LIMIT_LAKHS : null;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 bg-background">
      <p className="text-sm text-muted-foreground">Your farming dashboard: weather, tools, and quick estimates.</p>

      {/* Jump to shortcuts */}
      <section className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs text-muted-foreground mr-1">Jump to:</span>
        {quickLinks.map(({ to, label }, i) => (
          <span key={to} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground/60">|</span>}
            <Link to={to} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              {label}
            </Link>
          </span>
        ))}
      </section>

      {/* Quick tools */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-1">Quick tools</h2>
        <p className="text-xs text-muted-foreground mb-3">Ask questions, scan crop diseases, or find expert support.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border-emerald-900/40 bg-card hover:border-accent/40 transition-colors cursor-pointer" onClick={openVoiceAssistant}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><Mic className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Voice Assistant</CardTitle>
                <CardDescription className="text-xs">Ask farming questions</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-xl border-emerald-900/40 bg-card hover:border-accent/40 transition-colors cursor-pointer" onClick={() => setDiseaseModalOpen(true)}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><Camera className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Disease Detection</CardTitle>
                <CardDescription className="text-xs">Scan crop diseases</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-xl border-emerald-900/40 bg-card hover:border-accent/40 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><Video className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Expert Call</CardTitle>
                <CardDescription className="text-xs">Talk to experts. Coming soon — contact your state agriculture department.</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        </div>
      </section>

      {/* Your area at a glance */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-1">Your area at a glance</h2>
        <p className="text-xs text-muted-foreground mb-3">Weather and crop stats for your state.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl border-emerald-900/40 bg-card">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-lg">Today&apos;s Weather</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-400" onClick={loadWeather} disabled={weatherLoading}>
                <RefreshCw className={weatherLoading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
              </Button>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {weatherLoading && (<><Skeleton className="h-16 w-full rounded-lg" /><Skeleton className="h-24 w-full rounded-lg" /></>)}
            {weatherError && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{weatherError}</p>
                <Button variant="outline" size="sm" onClick={loadWeather} className="border-accent/50 text-accent hover:bg-accent/10">Retry</Button>
              </div>
            )}
            {!weatherLoading && weather && (
              <>
                <p className="text-xs text-muted-foreground">{weather.location}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-semibold text-foreground">{Math.round(weather.current.temp)}°C</span>
                  <span className="text-sm text-muted-foreground">{weatherCodeToLabel(weather.current.weatherCode)}</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Droplets className="h-4 w-4" /> Humidity: {weather.current.humidity}%</span>
                  <span className="flex items-center gap-1"><Wind className="h-4 w-4" /> Wind: {weather.current.windSpeed} km/h</span>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Next 2 days</p>
                  <div className="flex gap-4">
                    {weather.daily.slice(1, 3).map((d) => (
                      <div key={d.date} className="flex items-center gap-2">
                        {d.weatherCode <= 2 ? <Sun className="h-4 w-4 text-emerald-400" /> : RAIN_WEATHER_CODES.includes(d.weatherCode) ? <CloudRain className="h-4 w-4 text-blue-400" /> : <CloudSun className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                        <span className="font-mono text-sm text-foreground">{Math.round(d.tempMax)}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
                {weather.daily.some((d) => RAIN_WEATHER_CODES.includes(d.weatherCode)) && (
                  <p className="text-xs flex items-center gap-1 text-blue-400 pt-1">
                    <CloudRain className="h-3.5 w-3.5 shrink-0" /> Rain expected in the forecast
                  </p>
                )}
                <div className="rounded-lg border border-emerald-900/40 bg-background/40 p-2 mt-2">
                  <p className="text-xs font-medium text-emerald-400 mb-0.5">Crop weather advice</p>
                  <p className="text-xs text-muted-foreground">{getCropWeatherAdvice(weather.current.temp, weather.daily.some((d) => RAIN_WEATHER_CODES.includes(d.weatherCode)))}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl border-emerald-900/40 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-lg">Crop Statistics</CardTitle>
            </div>
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">Select State</Label>
              <Select value={selectedStateId} onValueChange={setSelectedStateId}>
                <SelectTrigger className="mt-1 border-border bg-background/50 text-foreground">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {FARMER_STATES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cropStats ? (
              <>
                <CropBlock label="Rice" stat={cropStats.rice} />
                <CropBlock label="Wheat" stat={cropStats.wheat} />
                <p className="text-[10px] text-muted-foreground pt-1">Source: {cropStats.source}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a state to view crop statistics.</p>
            )}
          </CardContent>
        </Card>
        </div>
      </section>

      {/* Analytics */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-1">Analytics</h2>
        <p className="text-xs text-muted-foreground mb-3">Recommended crop, seasonal income estimate, and price alerts.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const landAcresNum = parseFloat(acres) || 2;
            const currentMonth = new Date().getMonth() + 1;
            const recommended = getRecommendedCrops(selectedStateId, currentMonth, "Alluvial", "Medium", landAcresNum);
            const bestCrop = recommended[0];
            const priceAlerts = [
              { text: "Wheat price up 5% in your region", trend: "up" as const },
              { text: "Rice MSP unchanged for 2024-25", trend: "flat" as const },
              { text: "Cotton mandi price above MSP", trend: "up" as const },
            ];
            return (
              <>
                <Card className="rounded-xl border-emerald-900/40 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-emerald-400">Recommended crop this season</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bestCrop ? (
                      <>
                        <p className="font-semibold text-foreground">{bestCrop.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Est. revenue: ₹ {bestCrop.estimatedRevenue.toLocaleString("en-IN")}</p>
                        <Link to="/farmers/crop-recommendation" className="text-xs text-emerald-400 hover:underline mt-1 inline-block">View all recommendations</Link>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No crop match for current month. <Link to="/farmers/crop-recommendation" className="text-emerald-400 hover:underline">Check crop recommendation</Link></p>
                    )}
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-emerald-900/40 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-emerald-400">Estimated seasonal income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bestCrop ? (
                      <>
                        <p className="font-mono font-semibold text-foreground">₹ {bestCrop.estimatedRevenue.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground mt-1">Based on {bestCrop.name} for {landAcresNum} acres in {FARMER_STATES.find((s) => s.id === selectedStateId)?.name ?? selectedStateId}</p>
                        <Link to="/farmers/profitability" className="text-xs text-emerald-400 hover:underline mt-1 inline-block">Refine in Profitability</Link>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Set state and area above; use <Link to="/farmers/profitability" className="text-emerald-400 hover:underline">Crop Profitability</Link> for details.</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-emerald-900/40 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-emerald-400">Market price alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {priceAlerts.map((a, i) => (
                        <li key={i}>{a.text}</li>
                      ))}
                    </ul>
                    <Link to="/farmers/alerts" className="text-xs text-emerald-400 hover:underline mt-2 inline-block">Manage alerts</Link>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      </section>

      {/* Loan estimate */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-1">Loan estimate</h2>
        <p className="text-xs text-muted-foreground mb-3">Indicative limit by land area (KCC-style). For full bank list and rates, expand below or contact your bank.</p>
        <Card className="rounded-xl border-emerald-900/40 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Loan Estimator</CardTitle>
          </div>
          <CardDescription className="text-xs">Indicative estimate based on land area (KCC-style norms). Not a commitment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="acres" className="text-xs">Land Area (acres)</Label>
              <Input id="acres" type="number" min={0} step={0.5} placeholder="e.g. 2.5" value={acres} onChange={(e) => setAcres(e.target.value)} className="w-40 font-mono bg-background/50 border-border" />
            </div>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground" onClick={() => setAcres("")}>Reset</Button>
            {loanEstimate !== null && (
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Est. limit (approx.):</span>
                <span className="font-mono font-semibold text-accent">₹ {(loanEstimate * 100000).toLocaleString("en-IN")} ({loanEstimate.toFixed(1)} lakh)</span>
              </div>
            )}
          </div>
          <Collapsible open={banksOpen} onOpenChange={setBanksOpen} className="border-t border-border/60 pt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                {banksOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                See banks and rates
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-3 space-y-2">
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Bank</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Scheme</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Interest (p.a.)</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LOAN_BANKS_AND_RATES.map((row, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-2 px-3 font-medium">{row.bank}</td>
                          <td className="py-2 px-3 text-muted-foreground">{row.scheme}</td>
                          <td className="py-2 px-3 text-right font-mono text-accent">{row.ratePct}%</td>
                          <td className="py-2 px-3 text-muted-foreground">{row.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground">Rates are indicative and may vary. Subvention may apply for timely repayment. Confirm with the bank.</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
        <p className="text-[10px] text-muted-foreground px-6 pb-4">For exact eligibility and current rates, contact your bank or nearest agriculture office. Terms apply.</p>
        </Card>
      </section>

      {/* Production data */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-1">Production data</h2>
        <p className="text-xs text-muted-foreground mb-3">Rice production by state (reference).</p>
        <Card className="rounded-xl border-emerald-900/40 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Statewise Production Comparison</CardTitle>
          </div>
          <CardDescription className="text-xs">Rice production (million tonnes) by state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statewiseData} margin={{ top: 12, right: 12, bottom: 60, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="state" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis label={{ value: "Production (million t)", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 } }} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => String(v)} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`${value} million t`, "Production"]} labelFormatter={(label) => label} />
                <Bar dataKey="production" name="Production" radius={[4, 4, 0, 0]}>
                  {statewiseData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "hsl(var(--accent))" : "hsl(var(--success))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground pt-2">Source: Ministry of Agriculture, 3rd Adv. Est. 2022-23</p>
        </CardContent>
        </Card>
      </section>

      {/* Disease Detection modal */}
      <Dialog open={diseaseModalOpen} onOpenChange={setDiseaseModalOpen}>
        <DialogContent className="rounded-xl border-emerald-900/40 bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-400" />
              Disease Detection
            </DialogTitle>
            <DialogDescription>Upload a photo of the affected crop leaf or plant for AI-assisted disease identification.</DialogDescription>
          </DialogHeader>
          {diseaseStep === "upload" && (
            <div className="space-y-4 py-2">
              <div className="border border-dashed border-emerald-900/50 rounded-xl p-6 text-center bg-background/40 hover:border-emerald-500/40 transition-colors cursor-pointer" onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleDiseaseFile(f); }} onClick={() => document.getElementById("disease-file-input")?.click()}>
                <input id="disease-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleDiseaseFile(e.target.files?.[0] ?? null)} />
                {diseasePreviewUrl ? (
                  <div className="space-y-2">
                    <img src={diseasePreviewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    <p className="text-xs text-muted-foreground">{diseaseFile?.name}</p>
                    <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleDiseaseFile(null); }}>Remove</Button>
                  </div>
                ) : (
                  <><Upload className="h-10 w-10 mx-auto text-emerald-400 mb-2" /><p className="text-sm text-foreground">Drag and drop an image, or click to browse</p><p className="text-xs text-muted-foreground mt-1">JPEG, PNG up to {MAX_DISEASE_IMAGE_MB} MB</p></>
                )}
              </div>
              {diseaseError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4 shrink-0" /> {diseaseError}</p>}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0" disabled={!diseaseFile} onClick={runDiseaseAnalysis}><ImagePlus className="h-4 w-4 mr-2" />Analyze</Button>
            </div>
          )}
          {diseaseStep === "loading" && (
            <div className="py-8 flex flex-col items-center justify-center gap-4 text-muted-foreground" aria-live="polite">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
              <p className="text-sm">Analyzing image...</p>
            </div>
          )}
          {diseaseStep === "result" && diseaseResult?.diagnosis && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-emerald-900/40 bg-background/40 p-4">
                <p className="text-xs font-medium text-emerald-400 mb-1">Primary diagnosis</p>
                <p className="text-lg font-semibold text-foreground">{diseaseResult.diagnosis.primary.name}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Confidence</span><span>{Math.round((diseaseResult.diagnosis.primary.confidence ?? 0) * 100)}%</span></div>
                  <Progress value={(diseaseResult.diagnosis.primary.confidence ?? 0) * 100} className="h-2 [&>div]:bg-emerald-500" />
                </div>
                {diseaseResult.diagnosis.primary.description && <p className="text-sm text-muted-foreground mt-2">{diseaseResult.diagnosis.primary.description}</p>}
              </div>
              {diseaseResult.diagnosis.alternatives?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-2">Other possibilities</p>
                  <ul className="text-sm text-muted-foreground space-y-1">{diseaseResult.diagnosis.alternatives.map((alt, i) => <li key={i}>{alt.name} ({Math.round(alt.confidence * 100)}%)</li>)}</ul>
                </div>
              )}
              {diseaseResult.diagnosis.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-2">Recommendations</p>
                  <ul className="text-sm text-foreground list-disc list-inside space-y-1">{diseaseResult.diagnosis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
                </div>
              )}
              {(diseaseResult.diagnosis.treatmentSuggestions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-2">Treatment suggestions</p>
                  <ul className="text-sm text-foreground list-disc list-inside space-y-1">{diseaseResult.diagnosis.treatmentSuggestions!.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              )}
              {(diseaseResult.diagnosis.fertilizersOrPesticides?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-2">Recommended fertilizers / pesticides</p>
                  <ul className="text-sm text-muted-foreground space-y-1">{diseaseResult.diagnosis.fertilizersOrPesticides!.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
              {diseaseResult.disclaimer && <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">{diseaseResult.disclaimer}</p>}
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full border-emerald-900/40 text-foreground" asChild>
                  <Link to="/farmers/experts" onClick={() => setDiseaseModalOpen(false)}>Consult expert</Link>
                </Button>
                <Button variant="outline" className="w-full border-emerald-900/40 text-foreground" onClick={resetDiseaseToUpload}>Upload new image</Button>
              </div>
            </div>
          )}
          {diseaseStep === "error" && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /> {diseaseError}</p>
              <Button variant="outline" className="w-full border-emerald-900/40" onClick={resetDiseaseToUpload}>Try again</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CropBlock({ label, stat }: { label: string; stat: CropStat }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <p className="text-xs font-medium text-emerald-400 mb-2">{label}</p>
      <p className="text-sm text-foreground font-mono">Avg Yield: {stat.avgYield}</p>
      <p className="text-sm text-foreground font-mono">Production: {stat.production}</p>
    </div>
  );
}
