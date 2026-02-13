import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSectorAlertsLog,
  runSectorAlertsNow,
  type SectorAlertLogRow,
  type SectorAlertsLogResponse,
} from "@/services/adminApi";

function formatAlertType(alert_type: string) {
  if (alert_type === "projected_deficit") return "Projected deficit";
  if (alert_type === "risk_threshold") return "Risk threshold";
  return alert_type;
}

export default function AdminSectorAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commodityFilter, setCommodityFilter] = useState<string>("");
  const [sinceFilter, setSinceFilter] = useState<string>("all");
  const [running, setRunning] = useState(false);

  const { data, isLoading } = useQuery<SectorAlertsLogResponse>({
    queryKey: ["sector_alerts_log", commodityFilter, sinceFilter],
    queryFn: () =>
      fetchSectorAlertsLog({
        limit: 50,
        offset: 0,
        commodity: commodityFilter || undefined,
        since: sinceFilter && sinceFilter !== "all" ? sinceFilter : undefined,
      }),
  });

  const items = data?.items ?? [];
  const summary = data?.summary ?? { totalLast7Days: 0, byCommodity: {} };
  const commodityOptions = Array.from(
    new Set([
      ...items.map((r) => r.commodity).filter(Boolean),
      ...Object.keys(summary.byCommodity || {}),
    ])
  ).sort();

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const result = await runSectorAlertsNow();
      queryClient.invalidateQueries({ queryKey: ["sector_alerts_log"] });
      const totalSent = result.results?.reduce((acc, r) => acc + r.sent, 0) ?? 0;
      toast({
        title: "Sector alerts run complete",
        description: `${result.results?.length ?? 0} alert(s) sent to ${totalSent} recipient(s).`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Run failed",
        description: e instanceof Error ? e.message : "Failed to run sector alerts.",
      });
    } finally {
      setRunning(false);
    }
  };

  const sinceOptions = [
    { value: "all", label: "All time" },
    { value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), label: "Last 7 days" },
    { value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), label: "Last 30 days" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sector alerts</h2>
          <p className="text-sm text-muted-foreground">
            Automated critical alerts sent to sector recipients. Alerts run on schedule (e.g. every 6h) or run now.
          </p>
        </div>
        <Button onClick={handleRunNow} disabled={running} size="sm">
          {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          Run sector alerts now
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alerts sent (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <p className="text-2xl font-bold tabular-nums">{summary.totalLast7Days}</p>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total in list</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <p className="text-2xl font-bold tabular-nums">{data.total ?? items.length}</p>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">By commodity (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-sm">
                {Object.keys(summary.byCommodity).length === 0 ? (
                  <p className="text-muted-foreground">—</p>
                ) : (
                  <ul className="space-y-0.5">
                    {Object.entries(summary.byCommodity)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([name, count]) => (
                        <li key={name} className="flex justify-between gap-2">
                          <span className="truncate">{name}</span>
                          <span className="font-mono tabular-nums shrink-0">{count}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ) : (
              <Skeleton className="h-16 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={commodityFilter || "all"} onValueChange={(v) => setCommodityFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All commodities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All commodities</SelectItem>
            {commodityOptions.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sinceFilter || "all"} onValueChange={setSinceFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Since" />
          </SelectTrigger>
          <SelectContent>
            {sinceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Alert history</CardTitle>
          <CardDescription>Sent at, commodity, sector, risk score, alert type, and recipients</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-32 mb-4" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sent at</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Risk score</TableHead>
                    <TableHead>Alert type</TableHead>
                    <TableHead>Recipients</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No sector alerts logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent at</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Risk score</TableHead>
                  <TableHead>Alert type</TableHead>
                  <TableHead>Recipients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row: SectorAlertLogRow) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {row.sent_at ? new Date(row.sent_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{row.commodity}</TableCell>
                    <TableCell>{row.sector}</TableCell>
                    <TableCell className="font-mono tabular-nums">{row.risk_score}</TableCell>
                    <TableCell>{formatAlertType(row.alert_type)}</TableCell>
                    <TableCell className="tabular-nums">{row.recipient_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
