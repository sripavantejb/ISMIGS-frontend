import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings } from "lucide-react";
import { AlertPreferences } from "../components/AlertPreferences";
import { AgricultureUpdatesFeed } from "../components/AgricultureUpdatesFeed";

export default function Alerts() {
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background max-w-4xl w-full min-w-0">
      <section>
        <h2 className="agri-section-header">Agriculture updates</h2>
        <p className="text-sm text-muted-foreground mb-4">Schemes, market prices, input costs, and alerts in one place.</p>
        <AgricultureUpdatesFeed />
      </section>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground group">
            <Settings className="h-4 w-4" />
            Manage notification channels
            <ChevronDown className="h-4 w-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4">
            <AlertPreferences />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
