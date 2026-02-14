import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FARMER_STATES } from "../data/cropStatsByState";
import { getDistrictsForState } from "../data/statesDistricts";
import { SOIL_TYPES } from "../data/soilTypes";
import { IRRIGATION_TYPES } from "../data/irrigationTypes";
import type { FarmProfile } from "../types";

interface FarmProfileFormProps {
  initial?: FarmProfile | null;
  onSave: (profile: FarmProfile) => Promise<void>;
  saving?: boolean;
}

export function FarmProfileForm({ initial, onSave, saving }: FarmProfileFormProps) {
  const [state, setState] = useState(initial?.state ?? "haryana");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [landSizeAcres, setLandSizeAcres] = useState(initial?.landSizeAcres?.toString() ?? "");
  const [soilType, setSoilType] = useState(initial?.soilType ?? "");
  const [irrigationType, setIrrigationType] = useState<FarmProfile["irrigationType"]>(initial?.irrigationType ?? "electric");
  const [cropHistory, setCropHistory] = useState(initial?.cropHistory ?? []);
  const [newCrop, setNewCrop] = useState("");
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());

  const districts = getDistrictsForState(state);
  useEffect(() => {
    if (state && !districts.includes(district)) setDistrict(districts[0] ?? "");
  }, [state, districts, district]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const acres = parseFloat(landSizeAcres);
    if (Number.isNaN(acres) || acres <= 0) return;
    await onSave({
      state,
      district: district || (districts[0] ?? ""),
      landSizeAcres: acres,
      soilType: soilType || SOIL_TYPES[0],
      irrigationType,
      cropHistory,
    });
  };

  const addCrop = () => {
    if (!newCrop.trim()) return;
    const year = parseInt(newYear, 10);
    if (Number.isNaN(year)) return;
    setCropHistory((prev) => [...prev, { crop: newCrop.trim(), year }].slice(-10));
    setNewCrop("");
  };

  const removeCrop = (index: number) => {
    setCropHistory((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="rounded-xl border-emerald-900/40 bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-400">Farm details</CardTitle>
          <CardDescription>Location, land, soil and irrigation. Saved locally until you sign in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="border-border bg-background/50">
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
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="border-border bg-background/50">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Land size (acres)</Label>
              <Input type="number" min={0.1} step={0.5} value={landSizeAcres} onChange={(e) => setLandSizeAcres(e.target.value)} className="bg-background/50" required />
            </div>
            <div className="space-y-2">
              <Label>Soil type</Label>
              <Select value={soilType || SOIL_TYPES[0]} onValueChange={setSoilType}>
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
          </div>
          <div className="space-y-2">
            <Label>Irrigation type</Label>
            <Select value={irrigationType} onValueChange={(v) => setIrrigationType(v as FarmProfile["irrigationType"])}>
              <SelectTrigger className="border-border bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IRRIGATION_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Crop history (optional)</Label>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Crop name" value={newCrop} onChange={(e) => setNewCrop(e.target.value)} className="w-32 bg-background/50" />
              <Input type="number" placeholder="Year" value={newYear} onChange={(e) => setNewYear(e.target.value)} className="w-24 bg-background/50" />
              <Button type="button" variant="outline" size="sm" onClick={addCrop}>Add</Button>
            </div>
            {cropHistory.length > 0 && (
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                {cropHistory.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {c.crop} ({c.year})
                    <Button type="button" variant="ghost" size="sm" className="h-6 text-destructive" onClick={() => removeCrop(i)}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
