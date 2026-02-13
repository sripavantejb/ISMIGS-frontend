import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, List, Settings, Loader2, Download, Upload, SendHorizontal, LayoutGrid, Users, Inbox, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSectorList } from "@/hooks/useSectorList";
import { useSectorRecipients } from "@/hooks/useSectorRecipients";
import {
  fetchEmailLogs,
  sendTestToAllSectors,
  exportSectorRecipientsCsv,
  importSectorRecipientsCsvFile,
  fetchEnergyCommodities,
  sendEnergyDisclosure,
  type EmailLogRow,
} from "@/services/adminApi";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/admin-panel") ? "/admin-panel" : "/admin";
  const { toast } = useToast();
  const groups = useSectorList();
  const { recipientsByKey } = useSectorRecipients();
  const [sendingAll, setSendingAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [disclosureSending, setDisclosureSending] = useState(false);
  const [disclosureEmail, setDisclosureEmail] = useState("");
  const [disclosureCommodity, setDisclosureCommodity] = useState<string>("");
  const [disclosureSectorKey, setDisclosureSectorKey] = useState<string>("");

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

  const { data: energyCommodities = [] } = useQuery({
    queryKey: ["energy_commodities"],
    queryFn: fetchEnergyCommodities,
    staleTime: 1000 * 60 * 5,
  });

  const handleSendEnergyDisclosure = async () => {
    const email = disclosureEmail.trim();
    if (!email) {
      toast({ variant: "destructive", title: "Email required", description: "Enter admin email to receive the confirmation." });
      return;
    }
    setDisclosureSending(true);
    try {
      const displayName = disclosureSectorKey
        ? groups.flatMap((g) => g.sectors).find((s) => s.sectorKey === disclosureSectorKey)?.displayName
        : undefined;
      const result = await sendEnergyDisclosure(
        disclosureCommodity || energyCommodities[0],
        email,
        disclosureSectorKey || undefined,
        displayName
      );
      toast({
        title: "Confirmation email sent",
        description: result.message || `Check ${email} and use Yes/No to approve or reject the LinkedIn post.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send energy disclosure.";
      const isOpenAIKey = /OPENAI_API_KEY/i.test(msg);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: isOpenAIKey
          ? "Set OPENAI_API_KEY in your backend's Vercel project (e.g. ismigs-backend) under Settings → Environment Variables, then redeploy."
          : msg,
      });
    } finally {
      setDisclosureSending(false);
    }
  };

  const handleSendTestToAll = async () => {
    setSendingAll(true);
    try {
      const { sent, failed, results } = await sendTestToAllSectors();
      toast({
        title: "Test emails sent",
        description: `Sent: ${sent}, Failed: ${failed}. ${results.length} sector(s).`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send";
      const isOpenAIKey = /OPENAI_API_KEY/i.test(msg);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: isOpenAIKey
          ? "Set OPENAI_API_KEY in your backend's Vercel project (e.g. ismigs-backend) under Settings → Environment Variables, then redeploy."
          : msg,
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
    <div className="space-y-6 md:space-y-8 max-w-5xl min-w-0 w-full">
      <div className="space-y-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview and quick actions for sector notifications.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total sectors</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalSectors}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sectors with recipients</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground tabular-nums">{sectorsWithEmails}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalRecipients}</p>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
          <CardDescription>Navigate to admin sections or run bulk actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Navigation</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/sectors`)}>
                <Mail className="h-4 w-4 mr-2" />
                Sector recipients
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/logs`)}>
                <List className="h-4 w-4 mr-2" />
                Email logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/settings`)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Energy disclosure (LinkedIn)</p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
              <div className="space-y-1 min-w-0 flex-1 sm:flex-initial sm:w-[180px]">
                <Label className="text-xs">Commodity</Label>
                <Select value={disclosureCommodity || energyCommodities[0] || undefined} onValueChange={setDisclosureCommodity}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 min-w-0">
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] max-h-[280px]">
                    {energyCommodities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-0 flex-1 sm:flex-initial sm:w-[200px]">
                <Label className="text-xs">Sector (optional)</Label>
                <Select value={disclosureSectorKey || "__none__"} onValueChange={(v) => setDisclosureSectorKey(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[200px] h-9 min-w-0">
                    <SelectValue placeholder="None – email only" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] max-h-[280px]">
                    <SelectItem value="__none__">— None —</SelectItem>
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
              <div className="space-y-1 min-w-0 flex-1 sm:flex-initial sm:w-[220px]">
                <Label className="text-xs">Admin email</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  className="w-full sm:w-[220px] h-9 min-w-0"
                  value={disclosureEmail}
                  onChange={(e) => setDisclosureEmail(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleSendEnergyDisclosure} disabled={disclosureSending || energyCommodities.length === 0} className="w-full sm:w-auto">
                {disclosureSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                Send disclosure email
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Uses real commodity data. Admin receives email with LinkedIn draft and Yes/No to post. If you select a sector, the post is also added to that sector’s approvals; the sector admin can approve from the sector panel, then the LinkedIn content is sent to the webhook.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Bulk actions</p>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent email activity</CardTitle>
          <CardDescription>Last 5 sent emails across all sectors.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No emails sent yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Sector</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[160px] text-right">Sent at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentLogs as EmailLogRow[]).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-muted-foreground">{log.sector_key}</TableCell>
                    <TableCell className="truncate max-w-[240px]">{log.recipient}</TableCell>
                    <TableCell>
                      <Badge variant={log.success ? "default" : "destructive"} className="font-normal">
                        {log.success ? "Sent" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono text-xs">
                      {new Date(log.sent_at).toLocaleString()}
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
