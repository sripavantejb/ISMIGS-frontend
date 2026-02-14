import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CropChoice } from "../types";

const CROP_CHOICES: CropChoice[] = [
  { id: "rice", name: "Rice", cropKey: "rice" },
  { id: "wheat", name: "Wheat", cropKey: "wheat" },
];

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

export { CROP_CHOICES };
