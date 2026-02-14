import { type LucideIcon } from "lucide-react";

interface AgricultureSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
}

export function AgricultureSectionHeader({ icon: Icon, title, description }: AgricultureSectionHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-6 w-6 text-emerald-400 shrink-0" />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
