import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplets, CloudRain, AlertTriangle } from "lucide-react";
import { getWaterRequirement, dailyWaterLitersPerAcre } from "../data/waterRequirementByCrop";
import { SOIL_TYPES } from "../data/soilTypes";
import { fetchWeatherByCity, type WeatherForecast } from "../services/farmersApi";

const CROP_OPTIONS = [
  { id: "rice", name: "Rice" },
  { id: "wheat", name: "Wheat" },
  { id: "cotton", name: "Cotton" },
  { id: "sugarcane", name: "Sugarcane" },
  { id: "maize", name: "Maize" },
  { id: "bajra", name: "Bajra" },
];

const RAIN_CODES = [51, 61, 63, 80, 81, 82, 95, 96];

const DEFAULT_CITY = "Serilingampalle";

export default function WaterIrrigation() {
  const [cropId, setCropId] = useState("wheat");
  const [landAcres, setLandAcres] = useState(2);
  const [soilType, setSoilType] = useState("Alluvial");
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherCity, setWeatherCity] = useState(DEFAULT_CITY);

  const waterReq = useMemo(() => getWaterRequirement(cropId), [cropId]);

  useEffect(() => {
    setWeatherLoading(true);
    fetchWeatherByCity(weatherCity)
      .then(setWeather)
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false));
  }, [weatherCity]);

  const rainDays = useMemo(() => {
    if (!weather?.daily) return [];
    return weather.daily.filter((d) => RAIN_CODES.includes(d.weatherCode)).map((d) => d.date);
  }, [weather]);

  const overwateringWarning = rainDays.length > 0 && waterReq != null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Droplets className="h-5 w-5 text-emerald-400" />
          Water & irrigation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daily water need, weekly schedule, rain forecast, and drip recommendation.
        </p>
      </div>

      <Card className="border-emerald-900/40 bg-card">
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
          <CardDescription>Crop, land size, soil (optional). Location for rain forecast.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Crop</Label>
            <Select value={cropId} onValueChange={setCropId}>
              <SelectTrigger className="border-border bg-background/50">
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
            <Label>Land size (acres)</Label>
            <Input type="number" min={0.1} step={0.5} value={landAcres} onChange={(e) => setLandAcres(parseFloat(e.target.value) || 1)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Soil type (optional)</Label>
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
            <Label>Location (rain)</Label>
            <Input placeholder="City name" value={weatherCity} onChange={(e) => setWeatherCity(e.target.value)} className="bg-background/50" />
          </div>
        </CardContent>
      </Card>

      {waterReq && (
        <Card className="border-emerald-900/40 bg-card">
          <CardHeader>
            <CardTitle className="text-base">{waterReq.cropName} — water & schedule</CardTitle>
            <CardDescription>Based on crop and area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">
              <span className="font-medium text-emerald-400">Daily water requirement:</span> {waterReq.dailyWaterMm} mm (≈ {dailyWaterLitersPerAcre(waterReq.dailyWaterMm).toLocaleString("en-IN")} L/acre/day). For {landAcres} acres: ≈ {(dailyWaterLitersPerAcre(waterReq.dailyWaterMm) * landAcres).toLocaleString("en-IN")} L/day.
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Weekly irrigation schedule:</span> {waterReq.irrigationFrequency}
            </p>
            {waterReq.dripRecommended && (
              <p className="text-sm text-emerald-400">
                <span className="font-medium">Drip irrigation:</span> Recommended. {waterReq.dripNote ?? "Saves water and improves efficiency."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-emerald-900/40 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-emerald-400" />
            Rain prediction (next 3 days)
          </CardTitle>
          <CardDescription>From Open-Meteo for your location.</CardDescription>
        </CardHeader>
        <CardContent>
          {weatherLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!weatherLoading && weather?.daily && (
            <ul className="text-sm text-muted-foreground space-y-1">
              {weather.daily.map((d) => (
                <li key={d.date}>
                  {d.date}: {RAIN_CODES.includes(d.weatherCode) ? "Rain expected" : "No significant rain"}
                </li>
              ))}
            </ul>
          )}
          {overwateringWarning && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <span>Rain is forecast on one or more of the next 3 days. Consider reducing or skipping irrigation to avoid overwatering.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
