import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Send, List, Settings, Loader2, Download, Upload, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSectorList } from "@/hooks/useSectorList";
import { useSectorRecipients } from "@/hooks/useSectorRecipients";
import {
  fetchEmailLogs,
  sendTestToAllSectors,
  exportSectorRecipientsCsv,
  importSectorRecipientsCsvFile,
  type EmailLogRow,
} from "@/services/adminApi";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const groups = useSectorList();
  const { recipientsByKey } = useSectorRecipients();
  const [sendingAll, setSendingAll] = useState(false);
  const [importing, setImporting] = useState(false);

  const totalSectors = groups.reduce((acc, g) => acc + g.sectors.length, 0);
  const sectorsWithEmails = Object.values(recipientsByKey).filter(
    (r) => (r.emails || []).length > 0
  ).length;
  const totalRecipients = Object.values(recipientsByKey).reduce(
    (acc, r) => acc + (r.emails || []).length,
    0
  );

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["email_logs", 5],
    queryFn: () => fetchEmailLogs({ limit: 5 }),
  });

  const handleSendTestToAll = async () => {
    setSendingAll(true);
    try {
      const { sent, failed, results } = await sendTestToAllSectors();
      toast({
        title: "Test emails sent",
        description: `Sent: ${sent}, Failed: ${failed}. ${results.length} sector(s).`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: e instanceof Error ? e.message : "Could not send",
      });
    } finally {
      setSendingAll(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportSectorRecipientsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sector-recipients.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "sector-recipients.csv downloaded." });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: e instanceof Error ? e.message : "Could not export",
      });
    }
  };

  const handleImportCsv = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const { ok, err, total } = await importSectorRecipientsCsvFile(text);
        toast({
          title: "Import done",
          description: `${ok} saved, ${err} failed (${total} rows).`,
        });
        window.location.reload();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: err instanceof Error ? err.message : "Could not import",
        });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview and quick actions</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total sectors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalSectors}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sectors with recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{sectorsWithEmails}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalRecipients}</p>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
          <CardDescription>Navigate or run bulk actions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/sectors")}>
            <Mail className="h-4 w-4 mr-2" />
            Sector recipients
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/logs")}>
            <List className="h-4 w-4 mr-2" />
            Email logs
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={handleSendTestToAll} disabled={sendingAll}>
            {sendingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendHorizontal className="h-4 w-4 mr-2" />}
            Send test to all sectors
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleImportCsv} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Import CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Recent email activity</CardTitle>
          <CardDescription>Last 5 sent emails</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emails sent yet.</p>
          ) : (
            <ul className="space-y-2">
              {(recentLogs as EmailLogRow[]).map((log) => (
                <li key={log.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{log.sector_key}</span>
                  <span className="truncate max-w-[200px]">{log.recipient}</span>
                  <span className={log.success ? "text-green-600" : "text-destructive"}>
                    {log.success ? "Sent" : "Failed"}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {new Date(log.sent_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
