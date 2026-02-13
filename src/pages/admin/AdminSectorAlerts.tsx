import { useState, useRef, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSectorAlertsLog,
  fetchAdminDecisions,
  runSectorAlertsNow,
  type SectorAlertLogRow,
  type SectorAlertsLogResponse,
  type AdminDecisionRow,
} from "@/services/adminApi";

function formatAlertType(alert_type: string) {
  if (alert_type === "projected_deficit") return "Projected deficit";
  if (alert_type === "risk_threshold") return "Risk threshold";
  return alert_type;
}

function formatDecisionStatus(status: string) {
  if (status === "approved") return "Approved for LinkedIn";
  if (status === "rejected") return "Declined";
  return "Awaiting response";
}

export default function AdminSectorAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commodityFilter, setCommodityFilter] = useState<string>("");
  const [sinceFilter, setSinceFilter] = useState<string>("all");
  const [running, setRunning] = useState(false);
  const hasAutoRun = useRef(false);

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

  const { data: decisionsData, refetch: refetchDecisions, isFetching: isFetchingDecisions } = useQuery({
    queryKey: ["admin_decisions"],
    queryFn: () => fetchAdminDecisions({ limit: 100 }),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const decisions = decisionsData?.items ?? [];

  useEffect(() => {
    if (hasAutoRun.current) return;
    hasAutoRun.current = true;
    handleRunNow();
  }, []);

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
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{summary.totalLast7Days}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total in list</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{data?.total ?? items.length}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">By commodity (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[160px]" />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Alert history</CardTitle>
          <CardDescription>Sent at, commodity, sector, risk score, alert type, recipients, and delivery status</CardDescription>
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
                    <TableHead>Sent to administrators</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
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
                  <TableHead>Sent to administrators</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground" title="Alert email delivered to sector recipients">
                      {row.recipient_count > 0
                        ? `Delivered to ${row.recipient_count} administrator(s)`
                        : "Not sent"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base">LinkedIn post approval status</CardTitle>
            <CardDescription>
              Confirmation emails sent to administrators with Yes/No for posting to LinkedIn. Status reflects their response.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin_decisions"] })}
            disabled={isFetchingDecisions}
          >
            {isFetchingDecisions ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No LinkedIn confirmation requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Sent at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responded at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((row: AdminDecisionRow) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.commodity ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      {row.status === "approved" ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                          {formatDecisionStatus(row.status)}
                        </Badge>
                      ) : row.status === "rejected" ? (
                        <Badge variant="secondary">{formatDecisionStatus(row.status)}</Badge>
                      ) : (
                        <Badge variant="outline">{formatDecisionStatus(row.status)}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {row.responded_at ? new Date(row.responded_at).toLocaleString() : "—"}
                    </TableCell>
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
