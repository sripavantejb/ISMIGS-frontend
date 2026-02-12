import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const sectorKeys = groups.flatMap((g) => g.sectors.map((s) => s.sectorKey));

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email_logs", sectorFilter || "all"],
    queryFn: () => fetchEmailLogs({ limit: 50, sector_key: sectorFilter || undefined }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Email logs</h2>
          <p className="text-sm text-muted-foreground">History of sent emails per sector</p>
        </div>
        <Select value={sectorFilter || "all"} onValueChange={(v) => setSectorFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sectors</SelectItem>
            {sectorKeys.map((key) => (
              <SelectItem key={key} value={key}>{key}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Recent sends</CardTitle>
          <CardDescription>Ordered by most recent</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No log entries yet.</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
