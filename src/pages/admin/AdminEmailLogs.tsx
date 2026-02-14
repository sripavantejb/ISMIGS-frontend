import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchEmailLogs, type EmailLogRow } from "@/services/adminApi";
import { useSectorList } from "@/hooks/useSectorList";
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

export default function AdminEmailLogs() {
  const [sectorFilter, setSectorFilter] = useState<string>("");
  const groups = useSectorList();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email_logs", sectorFilter || "all"],
    queryFn: () => fetchEmailLogs({ limit: 50, sector_key: sectorFilter || undefined }),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-w-0 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className={adminPanelPageTitleClass}>Email logs</h1>
          <p className={adminPanelPageSubtitleClass}>History of sent emails per sector</p>
        </div>
        <Select value={sectorFilter || "all"} onValueChange={(v) => setSectorFilter(v === "all" ? "" : v)}>
          <SelectTrigger className={adminPanelInputClass + " w-full sm:w-[200px] min-w-0"}>
            <SelectValue placeholder="All sectors" />
          </SelectTrigger>
          <SelectContent className="z-[100] max-h-[280px] bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All sectors</SelectItem>
            {groups.flatMap((group) =>
              group.sectors.map((s) => (
                <SelectItem key={s.sectorKey} value={s.sectorKey}>
                  {group.label} – {s.displayName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Card className={adminPanelCardClass + " overflow-hidden"}>
        <CardHeader className={adminPanelCardHeaderClass}>
          <CardTitle className="text-zinc-100 text-base">Recent sends</CardTitle>
          <CardDescription className="text-zinc-400">Ordered by most recent</CardDescription>
        </CardHeader>
        <CardContent className={adminPanelCardContentClass}>
          {isLoading ? (
            <>
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-6 w-28 bg-zinc-800" />
                <Skeleton className="h-4 w-40 bg-zinc-800" />
              </div>
              <div className={adminPanelTableWrapperClass}>
              <Table>
                <TableHeader>
                  <TableRow className={adminPanelTableRowClass}>
                    <TableHead className={adminPanelTableHeadClass}>Sector</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Recipient</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Subject</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Status</TableHead>
                    <TableHead className={adminPanelTableHeadClass}>Sent at</TableHead>
                    <TableHead className={adminPanelTableHeadClass + " max-w-[200px]"}>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <TableRow key={i} className={adminPanelTableRowClass}>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-20 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-32 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-40 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-12 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-28 bg-zinc-800" /></TableCell>
                      <TableCell className="py-3 px-4"><Skeleton className="h-4 w-24 bg-zinc-800" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          ) : logs.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">No log entries yet.</p>
          ) : (
            <div className={adminPanelTableWrapperClass}>
            <Table>
              <TableHeader>
                <TableRow className={adminPanelTableRowClass}>
                  <TableHead className={adminPanelTableHeadClass}>Sector</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Recipient</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Subject</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Status</TableHead>
                  <TableHead className={adminPanelTableHeadClass}>Sent at</TableHead>
                  <TableHead className={adminPanelTableHeadClass + " max-w-[200px]"}>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs as EmailLogRow[]).map((log) => (
                  <TableRow key={log.id} className={adminPanelTableRowClass}>
                    <TableCell className="font-mono text-xs text-zinc-400 py-3 px-4">{log.sector_key}</TableCell>
                    <TableCell className="truncate max-w-[180px] text-zinc-200 text-sm py-3 px-4">{log.recipient}</TableCell>
                    <TableCell className="truncate max-w-[200px] text-zinc-300 text-sm py-3 px-4">{log.subject}</TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={log.success ? "text-emerald-500" : "text-destructive"}>
                        {log.success ? "Sent" : "Failed"}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm whitespace-nowrap py-3 px-4">
                      {new Date(log.sent_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-destructive text-xs max-w-[200px] truncate py-3 px-4">
                      {log.error_message ?? "—"}
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
