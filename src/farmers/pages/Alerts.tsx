import { Bell } from "lucide-react";
import { AlertPreferences } from "../components/AlertPreferences";

export default function Alerts() {
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-semibold text-foreground">Early Warning & Alerts</h1>
        </div>
        <p className="text-sm text-muted-foreground">Choose which early warnings and price alerts you want by channel.</p>
      </div>
      <AlertPreferences />
    </div>
  );
}
