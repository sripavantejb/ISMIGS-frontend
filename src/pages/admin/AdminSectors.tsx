import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, Mail, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useSectorList } from "@/hooks/useSectorList";
import { useSectorRecipients } from "@/hooks/useSectorRecipients";
import {
  sendSectorTestEmail,
  exportSectorRecipientsCsv,
  importSectorRecipientsCsvFile,
} from "@/services/adminApi";

function parseLines(value: string): string[] {
  return value
    .trim()
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type SectorExtras = {
  label: string;
  enabled: boolean;
  cc: string[];
  bcc: string[];
};

export default function AdminSectors() {
  const { toast } = useToast();
  const groups = useSectorList();
  const { recipientsByKey, isLoading, upsert, isUpserting } = useSectorRecipients();

  const [localEmails, setLocalEmails] = useState<Record<string, string[]>>({});
  const [localExtras, setLocalExtras] = useState<Record<string, SectorExtras>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [testInsights, setTestInsights] = useState("");
  const [testWarnings, setTestWarnings] = useState("");
  const [testContentOpen, setTestContentOpen] = useState(false);

  useEffect(() => {
    setLocalEmails((prev) => {
      const next = { ...prev };
      groups.forEach((g) => {
        g.sectors.forEach((s) => {
          const row = recipientsByKey[s.sectorKey];
          const fromDb = row?.emails;
          if (fromDb?.length) next[s.sectorKey] = [...fromDb];
          else if (!(s.sectorKey in next)) next[s.sectorKey] = [""];
        });
      });
      return next;
    });
    setLocalExtras((prev) => {
      const next = { ...prev };
      groups.forEach((g) => {
        g.sectors.forEach((s) => {
          const row = recipientsByKey[s.sectorKey];
          if (row && !(s.sectorKey in next)) {
            next[s.sectorKey] = {
              label: row.label ?? "",
              enabled: row.enabled !== false,
              cc: row.cc ?? [],
              bcc: row.bcc ?? [],
            };
          } else if (!(s.sectorKey in next)) {
            next[s.sectorKey] = { label: "", enabled: true, cc: [], bcc: [] };
          }
        });
      });
      return next;
    });
  }, [recipientsByKey, groups]);

  const addEmailSlot = (sectorKey: string) => {
    setLocalEmails((prev) => ({
      ...prev,
      [sectorKey]: [...(prev[sectorKey] ?? [""]), ""],
    }));
  };

  const removeEmailSlot = (sectorKey: string, index: number) => {
    setLocalEmails((prev) => {
      const list = [...(prev[sectorKey] ?? [""])];
      list.splice(index, 1);
      return { ...prev, [sectorKey]: list.length ? list : [""] };
    });
  };

  const updateEmailAt = (sectorKey: string, index: number, value: string) => {
    setLocalEmails((prev) => {
      const list = [...(prev[sectorKey] ?? [""])];
      list[index] = value;
      return { ...prev, [sectorKey]: list };
    });
  };

  const setExtra = (sectorKey: string, patch: Partial<SectorExtras>) => {
    setLocalExtras((prev) => ({
      ...prev,
      [sectorKey]: { ...(prev[sectorKey] ?? { label: "", enabled: true, cc: [], bcc: [] }), ...patch },
    }));
  };

  const handleSave = async (sectorKey: string, displayName: string) => {
    const emails = (localEmails[sectorKey] ?? [""]).map((e) => e.trim()).filter(Boolean);
    const extras = localExtras[sectorKey] ?? { label: "", enabled: true, cc: [], bcc: [] };
    setSavingKey(sectorKey);
    try {
      await upsert({
        sectorKey,
        displayName,
        emails,
        label: extras.label.trim() || null,
        enabled: extras.enabled,
        cc: extras.cc.filter(Boolean),
        bcc: extras.bcc.filter(Boolean),
      });
      toast({ title: "Saved", description: `Recipients for ${displayName} updated.` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSendTest = async (sectorKey: string, displayName: string) => {
    const emails = (localEmails[sectorKey] ?? [""]).map((e) => e.trim()).filter(Boolean);
    if (!emails.length) {
      toast({
        variant: "destructive",
        title: "No emails",
        description: "Add at least one email address before sending a test.",
      });
      return;
    }
    setSendingKey(sectorKey);
    try {
      const insights = parseLines(testInsights);
      const warnings = parseLines(testWarnings);
      const options =
        insights.length > 0 || warnings.length > 0
          ? { insights, warnings }
          : undefined;
      const { sent, results } = await sendSectorTestEmail(sectorKey, emails, options);
      if (sent > 0) {
        toast({ title: "Test sent", description: `Sample email sent to ${sent} recipient(s) for ${displayName}.` });
      }
      if (results?.some((r) => !r.ok)) {
        const failed = results?.filter((r) => !r.ok);
        toast({
          variant: "destructive",
          title: "Some failed",
          description: failed?.map((f) => `${f.to}: ${f.error}`).join("; "),
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send test email";
      const isOpenAIKey = /OPENAI_API_KEY/i.test(msg);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: isOpenAIKey
          ? "Set OPENAI_API_KEY in your backend's Vercel project (e.g. ismigs-backend) under Settings → Environment Variables, then redeploy."
          : msg,
      });
    } finally {
      setSendingKey(null);
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
      toast({ variant: "destructive", title: "Export failed", description: e instanceof Error ? e.message : "" });
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
        const { ok, err } = await importSectorRecipientsCsvFile(text);
        toast({ title: "Import done", description: `${ok} saved, ${err} failed.` });
        window.location.reload();
      } catch (err) {
        toast({ variant: "destructive", title: "Import failed", description: err instanceof Error ? err.message : "" });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sector recipients</h2>
          <p className="text-sm text-muted-foreground">
            Add email addresses per sector. Use “Send test” to send a sample email.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>Export CSV</Button>
          <Button variant="outline" size="sm" onClick={handleImportCsv} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import CSV"}
          </Button>
        </div>
      </div>

      <Collapsible open={testContentOpen} onOpenChange={setTestContentOpen}>
        <Card className="border-border bg-card">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">
                Customize test email content (optional)
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${testContentOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                If you fill these, the test email will use a LinkedIn-style post generated from them instead of the sector sample.
              </p>
              <div className="space-y-2">
                <Label htmlFor="test-insights" className="text-xs">Top insights (one per line)</Label>
                <textarea
                  id="test-insights"
                  className="flex min-h-[60px] w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. Growth in manufacturing index"
                  value={testInsights}
                  onChange={(e) => setTestInsights(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-warnings" className="text-xs">Critical warnings (one per line)</Label>
                <textarea
                  id="test-warnings"
                  className="flex min-h-[60px] w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. Input cost pressure in Q2"
                  value={testWarnings}
                  onChange={(e) => setTestWarnings(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <motion.div
              key={group.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{group.label}</CardTitle>
                  <CardDescription>Sectors under {group.label}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {group.sectors.map((sector) => {
                    const emails = localEmails[sector.sectorKey] ?? [""];
                    const extras = localExtras[sector.sectorKey] ?? { label: "", enabled: true, cc: [], bcc: [] };
                    const hasEmails = emails.some((e) => e.trim().length > 0);
                    return (
                      <div
                        key={sector.sectorKey}
                        className="flex flex-col gap-3 rounded-lg border border-border/50 p-4 bg-background/50"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{sector.displayName}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <Checkbox
                              id={`enabled-${sector.sectorKey}`}
                              checked={extras.enabled}
                              onCheckedChange={(c) => setExtra(sector.sectorKey, { enabled: c === true })}
                            />
                            <Label htmlFor={`enabled-${sector.sectorKey}`} className="text-xs text-muted-foreground">Enabled</Label>
                          </div>
                        </div>
                        <div className="grid gap-2 max-w-md">
                          <Label className="text-muted-foreground text-xs">Optional label</Label>
                          <Input
                            placeholder="Label (optional)"
                            value={extras.label}
                            onChange={(e) => setExtra(sector.sectorKey, { label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Recipient emails</Label>
                          {emails.map((email, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => updateEmailAt(sector.sectorKey, idx, e.target.value)}
                                className="max-w-md"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEmailSlot(sector.sectorKey, idx)}
                                disabled={emails.length <= 1}
                                aria-label="Remove email"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addEmailSlot(sector.sectorKey)}
                            className="w-fit"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add email
                          </Button>
                        </div>
                        <div className="grid gap-2 max-w-md">
                          <Label className="text-muted-foreground text-xs">CC (comma-separated)</Label>
                          <Input
                            placeholder="cc1@example.com, cc2@example.com"
                            value={(extras.cc || []).join(", ")}
                            onChange={(e) => setExtra(sector.sectorKey, { cc: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                          />
                        </div>
                        <div className="grid gap-2 max-w-md">
                          <Label className="text-muted-foreground text-xs">BCC (comma-separated)</Label>
                          <Input
                            placeholder="bcc@example.com"
                            value={(extras.bcc || []).join(", ")}
                            onChange={(e) => setExtra(sector.sectorKey, { bcc: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(sector.sectorKey, sector.displayName)}
                            disabled={isUpserting || savingKey !== null}
                          >
                            {savingKey === sector.sectorKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSendTest(sector.sectorKey, sector.displayName)}
                            disabled={!hasEmails || sendingKey !== null}
                          >
                            {sendingKey === sector.sectorKey ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Send test email
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
