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
import {
  adminPanelCardClass,
  adminPanelCardHeaderClass,
  adminPanelCardContentClass,
  adminPanelInputClass,
  adminPanelTableWrapperClass,
  adminPanelTableRowClass,
  adminPanelTableHeadClass,
  adminPanelPageTitleClass,
  adminPanelPageSubtitleClass,
} from "@/lib/adminPanelStyles";

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
    <div className="max-w-7xl mx-auto space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={adminPanelPageTitleClass}>Sector alerts</h1>
          <p className={adminPanelPageSubtitleClass}>
            Automated critical alerts sent to sector recipients. Alerts run on schedule (e.g. every 6h) or run now.
          </p>
        </div>
        <Button onClick={handleRunNow} disabled={running} size="sm" className="rounded-lg">
          {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          Run sector alerts now
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className={adminPanelCardClass}>
          <CardHeader className={adminPanelCardHeaderClass}>
            <CardTitle className="text-sm font-medium text-zinc-400">Alerts sent (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className={adminPanelCardContentClass}>
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-zinc-800" />
            ) : (
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{summary.totalLast7Days}</p>
            )}
          </CardContent>
        </Card>
        <Card className={adminPanelCardClass}>
          <CardHeader className={adminPanelCardHeaderClass}>
            <CardTitle className="text-sm font-medium text-zinc-400">Total in list</CardTitle>
          </CardHeader>
          <CardContent className={adminPanelCardContentClass}>
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-zinc-800" />
            ) : (
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{data?.total ?? items.length}</p>
            )}
          </CardContent>
        </Card>
        <Card className={adminPanelCardClass}>
          <CardHeader className={adminPanelCardHeaderClass}>
            <CardTitle className="text-sm font-medium text-zinc-400">By commodity (7 days)</CardTitle>
          </CardHeader>
          <CardContent className={adminPanelCardContentClass}>
            {isLoading ? (
              <Skeleton className="h-16 w-full bg-zinc-800" />
            ) : (
              <div className="text-sm text-zinc-300">
                {Object.keys(summary.byCommodity).length === 0 ? (
                  <p className="text-zinc-500">—</p>
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
            <Skeleton className="h-9 w-[180px] bg-zinc-800" />
            <Skeleton className="h-9 w-[160px] bg-zinc-800" />
          </>
        ) : (
          <>
            <Select value={commodityFilter || "all"} onValueChange={(v) => setCommodityFilter(v === "all" ? "" : v)}>
              <SelectTrigger className={adminPanelInputClass + " w-full sm:w-[180px] min-w-0"}>
                <SelectValue placeholder="All commodities" />
              </SelectTrigger>
              <SelectContent className="z-[100] max-h-[280px] bg-zinc-900 border-zinc-800">
                <SelectItem value="all">All commodities</SelectItem>
                {commodityOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sinceFilter || "all"} onValueChange={setSinceFilter}>
              <SelectTrigger className={adminPanelInputClass + " w-full sm:w-[160px] min-w-0"}>
                <SelectValue placeholder="Since" />
              </SelectTrigger>
              <SelectContent className="z-[100] max-h-[280px] bg-zinc-900 border-zinc-800">
                {sinceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <Card className={adminPanelCardClass}>
        <CardHeader className={adminPanelCardHeaderClass}>
          <CardTitle className="text-zinc-100 text-base">Alert history</CardTitle>
          <CardDescription className="text-zinc-400">Sent at, commodity, sector, risk score, alert type, recipients, and delivery status</CardDescription>
        </CardHeader>
        <CardContent className={adminPanelCardContentClass}>
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-32 mb-4 bg-zinc-800" />
              <div className={adminPanelTableWrapperClass}>
              <Table>
                <TableHeader>
                  <TableRow className={adminPanelTableRowClass}>
                    <TableHead className={adminPanelTableHeadClass}>Sent at</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Commodity</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Sector</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Risk score</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Alert type</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Recipients</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Sent to administrators</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className={adminPanelTableRowClass}>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-28 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-20 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-24 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-12 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-24 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-10 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-32 bg-zinc-800" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">No sector alerts logged yet.</p>
          ) : (
            <div className={adminPanelTableWrapperClass}>
            <Table>
              <TableHeader>
                <TableRow className={adminPanelTableRowClass}>
                  <TableHead className={adminPanelTableHeadClass}>Sent at</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Commodity</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Sector</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Risk score</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Alert type</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Recipients</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Sent to administrators</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row: SectorAlertLogRow) => (
                  <TableRow key={row.id} className={adminPanelTableRowClass}>
                    <TableCell className="text-zinc-500 text-sm whitespace-nowrap py-3 px-4">
                      {row.sent_at ? new Date(row.sent_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-200 text-sm py-3 px-4">{row.commodity}</TableCell>
                    <TableCell className="text-zinc-300 text-sm py-3 px-4">{row.sector}</TableCell>
                    <TableCell className="font-mono tabular-nums text-zinc-300 text-sm py-3 px-4">{row.risk_score}</TableCell>
                    <TableCell className="text-zinc-300 text-sm py-3 px-4">{formatAlertType(row.alert_type)}</TableCell>
                    <TableCell className="tabular-nums text-zinc-300 text-sm py-3 px-4">{row.recipient_count}</TableCell>
                    <TableCell className="text-sm text-zinc-500 py-3 px-4" title="Alert email delivered to sector recipients">
                      {row.recipient_count > 0
                        ? `Delivered to ${row.recipient_count} administrator(s)`
                        : "Not sent"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={adminPanelCardClass + " overflow-hidden"}>
        <CardHeader className={adminPanelCardHeaderClass + " flex flex-col sm:flex-row items-stretch sm:items-start justify-between space-y-0 gap-4"}>
          <div className="space-y-1.5">
            <CardTitle className="text-zinc-100 text-base">LinkedIn post approval status</CardTitle>
            <CardDescription className="text-zinc-400">
              Confirmation emails sent to administrators with Yes/No for posting to LinkedIn. Status reflects their response.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
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
        <CardContent className={adminPanelCardContentClass}>
          {decisions.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">No LinkedIn confirmation requests yet.</p>
          ) : (
            <div className={adminPanelTableWrapperClass}>
            <Table>
              <TableHeader>
                <TableRow className={adminPanelTableRowClass}>
                  <TableHead className={adminPanelTableHeadClass}>Commodity</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Sent at</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Status</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Responded at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((row: AdminDecisionRow) => (
                  <TableRow key={row.id} className={adminPanelTableRowClass}>
                    <TableCell className="font-medium text-zinc-200 text-sm py-3 px-4">{row.commodity ?? "—"}</TableCell>
                    <TableCell className="text-zinc-500 text-sm whitespace-nowrap py-3 px-4">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {row.status === "approved" ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                          {formatDecisionStatus(row.status)}
                        </Badge>
                      ) : row.status === "rejected" ? (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">{formatDecisionStatus(row.status)}</Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-600 text-zinc-400">{formatDecisionStatus(row.status)}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm whitespace-nowrap py-3 px-4">
                      {row.responded_at ? new Date(row.responded_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
