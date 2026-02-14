import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterOption[];
  onApply: () => void;
  onReset: () => void;
  applyButtonClassName?: string;
}

export function FilterBar({ filters, onApply, onReset, applyButtonClassName = "" }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 glass-card rounded-lg">
      {filters.map((f) => (
        <div key={f.label} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{f.label}:</span>
          <Select value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs text-foreground hover:bg-background focus:bg-background focus:ring-1 focus:ring-border">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs focus:bg-muted focus:text-foreground">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <Button size="sm" onClick={onApply} className={`h-8 text-xs ${applyButtonClassName}`}>
        Apply
      </Button>
      <Button size="sm" variant="outline" onClick={onReset} className="h-8 text-xs hover:bg-muted hover:text-foreground hover:border-border">
        Reset
      </Button>
    </div>
  );
}
