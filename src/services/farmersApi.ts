/**
 * Farmers dashboard API: Open-Meteo weather (geocoding + forecast), disease detection (backend proxy).
 */
import { API_BASE } from "@/config/api";

const GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const TZ = "Asia/Kolkata";

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  admin1?: string;
}

export interface WeatherForecast {
  location: string;
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
  };
  daily: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
  }>;
}

const WMO_CODES: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  80: "Slight Rain Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
};

export function weatherCodeToLabel(code: number): string {
  return WMO_CODES[code] ?? "Unknown";
}

export async function fetchGeocode(cityName: string): Promise<GeocodeResult | null> {
  const url = `${GEOCODE_BASE}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const json = await res.json();
  const results = json.results;
  if (!results || results.length === 0) return null;
  const r = results[0];
  return {
    name: r.name ?? cityName,
    latitude: r.latitude,
    longitude: r.longitude,
    country_code: r.country_code ?? "IN",
    admin1: r.admin1,
  };
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<Omit<WeatherForecast, "location">> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: TZ,
    forecast_days: "3",
  });
  const res = await fetch(`${FORECAST_BASE}?${params}`);
  if (!res.ok) throw new Error(`Weather failed: ${res.status}`);
  const data = await res.json();

  const current = data.current;
  const daily = data.daily;
  const dailyList: WeatherForecast["daily"] = (daily?.time ?? []).slice(0, 3).map((_: string, i: number) => ({
    date: daily.time[i],
    tempMax: daily.temperature_2m_max?.[i] ?? 0,
    tempMin: daily.temperature_2m_min?.[i] ?? 0,
    weatherCode: daily.weather_code?.[i] ?? 0,
  }));

  return {
    current: {
      temp: current?.temperature_2m ?? 0,
      humidity: current?.relative_humidity_2m ?? 0,
      windSpeed: current?.wind_speed_10m ?? 0,
      weatherCode: current?.weather_code ?? 0,
    },
    daily: dailyList,
  };
}

export async function fetchWeatherByCity(cityName: string): Promise<WeatherForecast> {
  const geo = await fetchGeocode(cityName);
  if (!geo) throw new Error(`Location not found: ${cityName}`);
  const forecast = await fetchWeatherByCoords(geo.latitude, geo.longitude);
  const location = [geo.name, geo.admin1, geo.country_code].filter(Boolean).join(", ");
  return { location, ...forecast };
}

// Disease detection (backend proxy)
export interface DiagnosisItem {
  name: string;
  confidence: number;
  description?: string | null;
}

export interface DiagnosisResponse {
  success: boolean;
  diagnosis?: {
    primary: DiagnosisItem;
    alternatives: Array<{ name: string; confidence: number }>;
    recommendations: string[];
  };
  disclaimer?: string;
  error?: string;
}

export async function analyzeDisease(imageBase64: string): Promise<DiagnosisResponse> {
  const res = await fetch(`${API_BASE}/api/farmers/disease-detection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });
  const data: DiagnosisResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}
