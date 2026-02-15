import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CROP_OPTIONS } from "../data/crops";
import type { CropChoice } from "../types";

/** CropChoice for CropSelector and useCropProfitability; cropKey only for rice/wheat. */
export const CROP_CHOICES: CropChoice[] = CROP_OPTIONS.map((c) => ({
  id: c.id,
  name: c.name,
  cropKey: c.cropKey,
}));

interface CropSelectorProps {
  value: string;
  onValueChange: (v: string) => void;
  label?: string;
}

export function CropSelector({ value, onValueChange, label = "Crop" }: CropSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border-border bg-background/50">
          <SelectValue placeholder="Select crop" />
        </SelectTrigger>
        <SelectContent>
          {CROP_CHOICES.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
