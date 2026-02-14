import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/config/api";
import type { AlertPreference } from "../types";

const DEFAULT_ALERTS: AlertPreference[] = [
  { id: "fertilizer-spike", label: "Fertilizer price spike", email: true, sms: false, whatsapp: false },
  { id: "diesel-spike", label: "Diesel price spike", email: true, sms: false, whatsapp: false },
  { id: "tariff-change", label: "Electricity tariff change", email: true, sms: false, whatsapp: false },
  { id: "crop-price-crash", label: "Crop price crash", email: true, sms: false, whatsapp: false },
  { id: "high-demand", label: "High-demand opportunity", email: true, sms: false, whatsapp: false },
  { id: "weather-energy", label: "Weather + energy risk", email: true, sms: false, whatsapp: false },
];

export function AlertPreferences() {
  const [prefs, setPrefs] = useState<AlertPreference[]>(DEFAULT_ALERTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("ismigs-farmer-token");
    if (token) {
      fetch(`${API_BASE}/api/farmers/alert-preferences`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data?.preferences?.length) setPrefs(data.preferences);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      const raw = localStorage.getItem("ismigs-alert-preferences");
      if (raw) try { setPrefs(JSON.parse(raw)); } catch { /* ignore */ }
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  const update = (id: string, channel: "email" | "sms" | "whatsapp", value: boolean) => {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: value } : p)));
  };

  const save = async () => {
    localStorage.setItem("ismigs-alert-preferences", JSON.stringify(prefs));
    const token = localStorage.getItem("ismigs-farmer-token");
    if (token) {
      await fetch(`${API_BASE}/api/farmers/alert-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: prefs }),
      });
    }
  };

  if (loading) {
    return (
      <Card className="agri-card w-full max-w-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-md mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
              <Skeleton className="h-4 w-36" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-6 w-11 rounded-full" />
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-6 w-11 rounded-full" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          ))}
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="agri-card w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg agri-icon">Alert preferences</CardTitle>
        <CardDescription>Choose which alerts you want and how (email, SMS, WhatsApp). Saving stores locally; sign in to sync.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prefs.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
            <Label className="font-medium text-foreground">{p.label}</Label>
            <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 sm:gap-4">
              <span className="text-xs text-muted-foreground">Email</span>
              <Switch checked={p.email} onCheckedChange={(v) => update(p.id, "email", v)} />
              <span className="text-xs text-muted-foreground">SMS</span>
              <Switch checked={p.sms} onCheckedChange={(v) => update(p.id, "sms", v)} />
              <span className="text-xs text-muted-foreground">WhatsApp</span>
              <Switch checked={p.whatsapp} onCheckedChange={(v) => update(p.id, "whatsapp", v)} />
            </div>
          </div>
        ))}
        <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={save}>Save preferences</Button>
      </CardContent>
    </Card>
  );
}
