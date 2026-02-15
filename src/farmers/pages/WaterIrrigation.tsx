import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplets, CloudRain, AlertTriangle, Sun, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CROP_OPTIONS } from "../data/crops";
import { getWaterRequirement, dailyWaterLitersPerAcre } from "../data/waterRequirementByCrop";
import { SOIL_TYPES } from "../data/soilTypes";
import { fetchWeatherByCity, type WeatherForecast } from "../services/farmersApi";

const RAIN_CODES = [51, 61, 63, 80, 81, 82, 95, 96];

const DEFAULT_CITY = "Serilingampalle";

/** Build irrigation suggestions from current weather and 3-day forecast. */
function getWeatherBasedSuggestions(weather: WeatherForecast): string[] {
  const suggestions: string[] = [];
  const { current, daily } = weather;
  const temp = current.temp;
  const humidity = current.humidity;
  const windSpeed = current.windSpeed;
  const rainToday = daily?.length > 0 && RAIN_CODES.includes(daily[0].weatherCode);
  const rainInForecast = daily?.some((d) => RAIN_CODES.includes(d.weatherCode));
  const isRainingNow = RAIN_CODES.includes(current.weatherCode);
  const minTempNext = daily?.length ? Math.min(...daily.map((d) => d.tempMin)) : temp;

  if (isRainingNow) {
    suggestions.push("It's raining now — no need to irrigate. Let rainfall supplement soil moisture.");
  } else if (rainToday) {
    suggestions.push("Rain is expected today — skip or reduce irrigation to avoid overwatering.");
  } else if (rainInForecast) {
    suggestions.push("Rain in the next few days — you can reduce irrigation and rely on forecast rain on those days.");
  }

  if (temp >= 35) {
    suggestions.push("Hot day — irrigate early morning or evening to reduce evaporation and stress on plants.");
  } else if (temp >= 28 && temp < 35) {
    suggestions.push("Warm day — morning irrigation is ideal to avoid midday heat and evaporation.");
  } else if (temp < 15 && !isRainingNow) {
    suggestions.push("Cool conditions — avoid over-irrigation; soil dries slowly and waterlogging risk is higher.");
  }
  if (minTempNext < 5 && !suggestions.some((s) => s.includes("frost"))) {
    suggestions.push("Cold nights in forecast — delay irrigation if frost is expected to avoid ice damage.");
  }

  if (humidity < 40 && !isRainingNow) {
    suggestions.push("Low humidity — soil may dry faster; stick to schedule or use mulch to retain moisture.");
  } else if (humidity > 75 && temp < 30) {
    suggestions.push("High humidity — you can slightly reduce irrigation amount; less evaporation expected.");
  }

  if (windSpeed > 25) {
    suggestions.push("Windy — avoid sprinklers; use drip or flood irrigation to reduce evaporation and drift.");
  }

  if (suggestions.length === 0) {
    suggestions.push("No rain in forecast — follow your normal irrigation schedule for your crop and soil.");
  }

  return suggestions;
}

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

  const weatherSuggestions = useMemo(() => {
    if (!weather) return [];
    return getWeatherBasedSuggestions(weather);
  }, [weather]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl w-full min-w-0">
      <Card className="agri-card">
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
        <Card className="agri-card">
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

      <Card className="agri-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-emerald-400" />
            Rain prediction (next 3 days)
          </CardTitle>
          <CardDescription>From Open-Meteo for your location.</CardDescription>
        </CardHeader>
        <CardContent>
          {weatherLoading && (
            <ul className="text-sm space-y-1">
              <li><Skeleton className="h-4 w-full" /></li>
              <li><Skeleton className="h-4 w-full" /></li>
              <li><Skeleton className="h-4 w-4/5" /></li>
            </ul>
          )}
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

      <Card className="agri-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4 text-emerald-400" />
            Suggestions based on weather now
          </CardTitle>
          <CardDescription>Irrigation tips from current conditions and forecast for {weatherCity}.</CardDescription>
        </CardHeader>
        <CardContent>
          {weatherLoading && (
            <ul className="text-sm space-y-2">
              <li><Skeleton className="h-4 w-full" /></li>
              <li><Skeleton className="h-4 w-4/5" /></li>
              <li><Skeleton className="h-4 w-3/4" /></li>
            </ul>
          )}
          {!weatherLoading && weather && weatherSuggestions.length > 0 && (
            <ul className="text-sm text-muted-foreground space-y-2 list-none pl-0">
              {weatherSuggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 text-emerald-400/80 mt-0.5" />
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ul>
          )}
          {!weatherLoading && (!weather || weatherSuggestions.length === 0) && (
            <p className="text-sm text-muted-foreground">Enter a location above to get weather-based irrigation suggestions.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
