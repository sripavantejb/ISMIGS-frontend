import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { GOVERNMENT_SCHEMES, type GovernmentScheme } from "../data/governmentSchemes";
import { FARMER_STATES } from "../data/cropStatsByState";

export default function GovernmentSchemes() {
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return GOVERNMENT_SCHEMES.filter((s) => {
      if (levelFilter !== "all" && s.level !== levelFilter) return false;
      if (stateFilter !== "all" && s.level === "State" && s.state !== stateFilter) return false;
      return true;
    });
  }, [levelFilter, stateFilter]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl w-full min-w-0">
      <Card className="agri-card">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter by level and state.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-[140px] border-border bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Central">Central</SelectItem>
                <SelectItem value="State">State</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>State (for State schemes)</Label>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-[180px] border-border bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {FARMER_STATES.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <Card className="agri-card col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">No schemes match the selected filters.</CardContent>
          </Card>
        ) : (
          filtered.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))
        )}
      </div>
    </div>
  );
}

function SchemeCard({ scheme }: { scheme: GovernmentScheme }) {
  return (
    <Card className="agri-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base text-foreground">{scheme.name}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {scheme.level}
            {scheme.state ? ` · ${scheme.state}` : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Eligibility:</span> {scheme.eligibility}</p>
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Documents:</span> {scheme.documents}</p>
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Benefit:</span> {scheme.benefitAmount}</p>
        <Button variant="outline" size="sm" className="mt-2 border-emerald-900/40 text-foreground" asChild>
          <a href={scheme.applicationLink} target="_blank" rel="noopener noreferrer">
            Application link <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
