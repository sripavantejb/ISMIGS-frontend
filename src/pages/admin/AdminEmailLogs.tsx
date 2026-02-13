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

export default function AdminEmailLogs() {
  const [sectorFilter, setSectorFilter] = useState<string>("");
  const groups = useSectorList();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email_logs", sectorFilter || "all"],
    queryFn: () => fetchEmailLogs({ limit: 50, sector_key: sectorFilter || undefined }),
  });

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Email logs</h2>
          <p className="text-sm text-muted-foreground">History of sent emails per sector</p>
        </div>
        <Select value={sectorFilter || "all"} onValueChange={(v) => setSectorFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[200px] min-w-0">
            <SelectValue placeholder="All sectors" />
          </SelectTrigger>
          <SelectContent className="z-[100] max-h-[280px]">
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

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Recent sends</CardTitle>
          <CardDescription>Ordered by most recent</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="overflow-x-auto -mx-1 px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sector</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent at</TableHead>
                    <TableHead className="max-w-[200px]">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No log entries yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent at</TableHead>
                  <TableHead className="max-w-[200px]">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs as EmailLogRow[]).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.sector_key}</TableCell>
                    <TableCell className="truncate max-w-[180px]">{log.recipient}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{log.subject}</TableCell>
                    <TableCell>
                      <span className={log.success ? "text-green-600" : "text-destructive"}>
                        {log.success ? "Sent" : "Failed"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(log.sent_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-destructive text-xs max-w-[200px] truncate">
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
