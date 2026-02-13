import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Loader2, Mail, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
  sector_username: string;
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
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [localSectorPassword, setLocalSectorPassword] = useState<Record<string, string>>({});

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
              sector_username: row.sector_username ?? "",
            };
          } else if (!(s.sectorKey in next)) {
            next[s.sectorKey] = { label: "", enabled: true, cc: [], bcc: [], sector_username: "" };
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
      [sectorKey]: { ...(prev[sectorKey] ?? { label: "", enabled: true, cc: [], bcc: [], sector_username: "" }), ...patch },
    }));
  };

  const handleSave = async (sectorKey: string, displayName: string) => {
    const emails = (localEmails[sectorKey] ?? [""]).map((e) => e.trim()).filter(Boolean);
    const extras = localExtras[sectorKey] ?? { label: "", enabled: true, cc: [], bcc: [], sector_username: "" };
    const password = localSectorPassword[sectorKey] ?? "";
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
        sector_username: extras.sector_username.trim() || null,
        sector_password: password.trim() || undefined,
      });
      if (password.trim()) setLocalSectorPassword((p) => ({ ...p, [sectorKey]: "" }));
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
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Sector recipients</h2>
          <p className="text-sm text-muted-foreground">
            Add email addresses per sector. Use “Send test” to send a sample email.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
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
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-1 px-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Sector</TableHead>
                  <TableHead className="w-[90px]">Enabled</TableHead>
                  <TableHead className="w-[160px]">Label</TableHead>
                  <TableHead className="min-w-[140px]">Recipients</TableHead>
                  <TableHead className="min-w-[160px]">CC</TableHead>
                  <TableHead className="min-w-[160px]">BCC</TableHead>
                  <TableHead className="text-right w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-11 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
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
                <CardContent>
                  {group.sectors.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No sectors in this section.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-1 px-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Sector</TableHead>
                          <TableHead className="w-[90px]">Enabled</TableHead>
                          <TableHead className="w-[160px]">Label</TableHead>
                          <TableHead className="min-w-[140px]">Recipients</TableHead>
                          <TableHead className="min-w-[160px]">CC</TableHead>
                          <TableHead className="min-w-[160px]">BCC</TableHead>
                          <TableHead className="text-right w-[180px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.sectors.map((sector) => {
                          const emails = localEmails[sector.sectorKey] ?? [""];
                          const extras = localExtras[sector.sectorKey] ?? { label: "", enabled: true, cc: [], bcc: [], sector_username: "" };
                          const hasEmails = emails.some((e) => e.trim().length > 0);
                          const count = emails.filter((e) => e.trim()).length;
                          const recipientSummary =
                            count === 0
                              ? "No recipients"
                              : count === 1
                                ? (emails.find((e) => e.trim()) ?? "").slice(0, 28) + (emails.find((e) => e.trim())!.length > 28 ? "…" : "")
                                : `${count} recipients`;
                          const isExpanded = expandedRowKey === sector.sectorKey;
                          return (
                            <React.Fragment key={sector.sectorKey}>
                              <TableRow className="hover:bg-muted/50">
                                <TableCell className="font-medium">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedRowKey((k) => (k === sector.sectorKey ? null : sector.sectorKey))}
                                    className="flex items-center gap-1.5 text-left hover:opacity-80"
                                    aria-expanded={isExpanded}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    )}
                                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span>{sector.displayName}</span>
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <Switch
                                    id={`enabled-${sector.sectorKey}`}
                                    checked={extras.enabled}
                                    onCheckedChange={(c) => setExtra(sector.sectorKey, { enabled: c })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Label (optional)"
                                    value={extras.label}
                                    onChange={(e) => setExtra(sector.sectorKey, { label: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {recipientSummary}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="cc@example.com"
                                    value={(extras.cc || []).join(", ")}
                                    onChange={(e) =>
                                      setExtra(sector.sectorKey, {
                                        cc: e.target.value
                                          .split(",")
                                          .map((x) => x.trim())
                                          .filter(Boolean),
                                      })
                                    }
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="bcc@example.com"
                                    value={(extras.bcc || []).join(", ")}
                                    onChange={(e) =>
                                      setExtra(sector.sectorKey, {
                                        bcc: e.target.value
                                          .split(",")
                                          .map((x) => x.trim())
                                          .filter(Boolean),
                                      })
                                    }
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSave(sector.sectorKey, sector.displayName)}
                                      disabled={isUpserting || savingKey !== null}
                                    >
                                      {savingKey === sector.sectorKey ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Save"
                                      )}
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
                                          Send test
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow key={`${sector.sectorKey}-expanded`} className="bg-muted/30 hover:bg-muted/30">
                                  <TableCell colSpan={7} className="p-4">
                                    <div className="space-y-4 max-w-2xl">
                                      <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Sector login (for LinkedIn approvals panel)</Label>
                                        <div className="flex flex-wrap gap-4 items-end">
                                          <div className="space-y-1">
                                            <Label htmlFor={`sector-username-${sector.sectorKey}`} className="text-xs">Username</Label>
                                            <Input
                                              id={`sector-username-${sector.sectorKey}`}
                                              placeholder="e.g. sector_coal"
                                              value={extras.sector_username}
                                              onChange={(e) => setExtra(sector.sectorKey, { sector_username: e.target.value })}
                                              className="h-8 text-sm w-48"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label htmlFor={`sector-password-${sector.sectorKey}`} className="text-xs">Password</Label>
                                            <Input
                                              id={`sector-password-${sector.sectorKey}`}
                                              type="password"
                                              placeholder="Set password to create or change"
                                              value={localSectorPassword[sector.sectorKey] ?? ""}
                                              onChange={(e) => setLocalSectorPassword((p) => ({ ...p, [sector.sectorKey]: e.target.value }))}
                                              className="h-8 text-sm w-48"
                                            />
                                          </div>
                                        </div>
                                        {recipientsByKey[sector.sectorKey]?.has_sector_login && (
                                          <p className="text-xs text-muted-foreground">Login is set. Change password above to update.</p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Recipient emails</Label>
                                        {emails.map((email, idx) => (
                                        <div key={idx} className="flex gap-2">
                                          <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            value={email}
                                            onChange={(e) =>
                                              updateEmailAt(sector.sectorKey, idx, e.target.value)
                                            }
                                            className="h-8 text-sm"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
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
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
