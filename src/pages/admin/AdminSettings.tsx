import { useState, useEffect, useCallback } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSettings,
  updateSettings,
  smtpTest,
  getStoredUser,
  fetchSuperadminSectors,
  createSectorAdmin,
  type SuperadminSector,
} from "@/services/adminApi";
import {
  adminPanelCardClass,
  adminPanelCardHeaderClass,
  adminPanelCardContentClass,
  adminPanelLabelClass,
  adminPanelInputClass,
  adminPanelTableWrapperClass,
  adminPanelTableRowClass,
  adminPanelTableHeadClass,
  adminPanelPageTitleClass,
  adminPanelPageSubtitleClass,
} from "@/lib/adminPanelStyles";

type SectorRowState = { name: string; email: string; password: string };

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultFrom, setDefaultFrom] = useState("");
  const [smtpTestEmail, setSmtpTestEmail] = useState("");

  const isSuperAdmin = getStoredUser()?.role === "SUPER_ADMIN";
  const [sectorRows, setSectorRows] = useState<Record<string, SectorRowState>>({});
  const [creatingSectorId, setCreatingSectorId] = useState<string | null>(null);
  const [createdSectorIds, setCreatedSectorIds] = useState<Set<string>>(new Set());

  const { data: sectors = [], isLoading: sectorsLoading, error: sectorsError } = useQuery({
    queryKey: ["superadmin_sectors"],
    queryFn: fetchSuperadminSectors,
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (!isSuperAdmin || !sectors.length) return;
    const withAdmin = new Set(sectors.filter((s) => s.has_sector_admin).map((s) => s.id));
    if (withAdmin.size > 0) setCreatedSectorIds((prev) => new Set([...prev, ...withAdmin]));
  }, [isSuperAdmin, sectors]);

  const updateSectorRow = useCallback((sectorId: string, field: keyof SectorRowState, value: string) => {
    setSectorRows((prev) => ({
      ...prev,
      [sectorId]: {
        ...(prev[sectorId] ?? { name: "", email: "", password: "" }),
        [field]: value,
      },
    }));
  }, []);

  const getRow = useCallback((sector: SuperadminSector) => {
    const defaultName = `Sector Admin – ${sector.sector_name}`;
    return sectorRows[sector.id] ?? { name: defaultName, email: "", password: "" };
  }, [sectorRows]);

  const handleCreateCredentials = async (sector: SuperadminSector) => {
    const row = getRow(sector);
    if (!row.email.trim() || !row.password) {
      toast({ variant: "destructive", title: "Email and password required" });
      return;
    }
    setCreatingSectorId(sector.id);
    try {
      await createSectorAdmin({
        name: row.name.trim() || sector.sector_name,
        email: row.email.trim(),
        password: row.password,
        sector_id: sector.id,
      });
      setCreatedSectorIds((prev) => new Set(prev).add(sector.id));
      setSectorRows((prev) => ({ ...prev, [sector.id]: { ...row, password: "" } }));
      toast({
        title: "Credentials created",
        description: `Sector Admin for ${sector.sector_name} can now sign in. They will only see data for ${sector.sector_name}.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to create credentials",
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCreatingSectorId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((s) => {
        if (!cancelled) {
          setNotificationsEnabled(s.notifications_enabled);
          setDefaultFrom(s.default_from ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) toast({ variant: "destructive", title: "Failed to load settings" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        notifications_enabled: notificationsEnabled,
        default_from: defaultFrom.trim() || null,
      });
      toast({ title: "Settings saved" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSmtpTest = async () => {
    if (!smtpTestEmail.trim()) {
      toast({ variant: "destructive", title: "Enter an email address" });
      return;
    }
    setTesting(true);
    try {
      const result = await smtpTest(smtpTestEmail.trim());
      if (result.dev && result.previewUrl) {
        toast({
          title: "Test email sent (dev mode)",
          description: "No real SMTP configured. View the message: " + result.previewUrl,
        });
      } else {
        toast({ title: "Test email sent", description: `Check ${smtpTestEmail} for the test message.` });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const isNotConfigured = msg.includes("SMTP not configured") || msg.includes("503");
      toast({
        variant: "destructive",
        title: "SMTP test failed",
        description: isNotConfigured
          ? "SMTP is not set up. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to backend/.env (see .env.example) and restart the backend."
          : msg || undefined,
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-7 w-24 bg-zinc-800" />
          <Skeleton className="h-4 w-56 mt-2 bg-zinc-800" />
        </div>
        <Card className={adminPanelCardClass}>
          <CardHeader className={adminPanelCardHeaderClass}>
            <Skeleton className="h-5 w-36 bg-zinc-800" />
            <Skeleton className="h-4 w-full max-w-md mt-2 bg-zinc-800" />
          </CardHeader>
          <CardContent className={adminPanelCardContentClass + " flex items-center justify-between"}>
            <Skeleton className="h-4 w-40 bg-zinc-800" />
            <Skeleton className="h-6 w-11 rounded-full bg-zinc-800" />
          </CardContent>
        </Card>
        <Card className={adminPanelCardClass}>
          <CardHeader className={adminPanelCardHeaderClass}>
            <Skeleton className="h-5 w-44 bg-zinc-800" />
            <Skeleton className="h-4 w-full max-w-sm mt-2 bg-zinc-800" />
          </CardHeader>
          <CardContent className={adminPanelCardContentClass}>
            <Skeleton className="h-10 w-full bg-zinc-800" />
          </CardContent>
        </Card>
        <Card className={adminPanelCardClass}>
          <CardHeader className={adminPanelCardHeaderClass}>
            <Skeleton className="h-5 w-28 bg-zinc-800" />
            <Skeleton className="h-4 w-full max-w-lg mt-2 bg-zinc-800" />
          </CardHeader>
          <CardContent className={adminPanelCardContentClass + " flex gap-2"}>
            <Skeleton className="h-10 flex-1 bg-zinc-800" />
            <Skeleton className="h-10 w-24 bg-zinc-800" />
          </CardContent>
        </Card>
        <Skeleton className="h-10 w-32 bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 min-w-0 w-full">
      <div>
        <h1 className={adminPanelPageTitleClass}>Settings</h1>
        <p className={adminPanelPageSubtitleClass}>Notifications and email defaults</p>
      </div>

      <Card className={adminPanelCardClass}>
        <CardHeader className={adminPanelCardHeaderClass}>
          <CardTitle className="text-zinc-100 text-base">Notifications</CardTitle>
          <CardDescription className="text-zinc-400">When disabled, no sector emails will be sent (test or real).</CardDescription>
        </CardHeader>
        <CardContent className={adminPanelCardContentClass + " flex items-center justify-between"}>
          <Label htmlFor="notifications-enabled" className={adminPanelLabelClass + " cursor-pointer"}>Notifications enabled</Label>
          <Switch
            id="notifications-enabled"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </CardContent>
      </Card>

      <Card className={adminPanelCardClass}>
        <CardHeader className={adminPanelCardHeaderClass}>
          <CardTitle className="text-zinc-100 text-base">Default from address</CardTitle>
          <CardDescription className="text-zinc-400">Overrides SMTP_FROM when set. Leave empty to use server default.</CardDescription>
        </CardHeader>
        <CardContent className={adminPanelCardContentClass}>
          <Input
            type="email"
            placeholder="e.g. notifications@example.com"
            value={defaultFrom}
            onChange={(e) => setDefaultFrom(e.target.value)}
            className={adminPanelInputClass}
          />
        </CardContent>
      </Card>

      <Card className={adminPanelCardClass}>
        <CardHeader className={adminPanelCardHeaderClass}>
          <CardTitle className="text-zinc-100 text-base">Test SMTP</CardTitle>
          <CardDescription className="text-zinc-400">Send a test email to verify SMTP. Configure SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env (see .env.example).</CardDescription>
        </CardHeader>
        <CardContent className={adminPanelCardContentClass + " flex flex-col sm:flex-row gap-2"}>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={smtpTestEmail}
            onChange={(e) => setSmtpTestEmail(e.target.value)}
            className={adminPanelInputClass + " min-w-0 flex-1"}
          />
          <Button onClick={handleSmtpTest} disabled={testing} className="rounded-lg w-full sm:w-auto shrink-0">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send test"}
          </Button>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card className={adminPanelCardClass}>
          <CardHeader className={adminPanelCardHeaderClass}>
            <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Sector admin credentials
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Create login credentials (email and password) for each sector. Sector Admins can then sign in at the login page and access their sector&apos;s approvals.
            </CardDescription>
          </CardHeader>
          <CardContent className={adminPanelCardContentClass}>
            {sectorsError && (
              <p className="text-sm text-destructive mb-4">
                {sectorsError instanceof Error ? sectorsError.message : "Failed to load sectors."}
              </p>
            )}
            {sectorsLoading ? (
              <Skeleton className="h-32 w-full bg-zinc-800" />
            ) : sectors.length === 0 ? (
              <p className="text-sm text-zinc-500">No sectors yet. Create sectors from the Super Admin panel first.</p>
            ) : (
              <div className={adminPanelTableWrapperClass}>
                <Table>
                  <TableHeader>
                    <TableRow className={adminPanelTableRowClass}>
                      <TableHead className={adminPanelTableHeadClass + " w-[140px]"}>Sector</TableHead>
                      <TableHead className={adminPanelTableHeadClass + " min-w-[160px]"}>Name</TableHead>
                      <TableHead className={adminPanelTableHeadClass + " min-w-[180px]"}>Email</TableHead>
                      <TableHead className={adminPanelTableHeadClass + " min-w-[140px]"}>Password</TableHead>
                      <TableHead className={adminPanelTableHeadClass + " text-right w-[160px]"}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((sector) => {
                      const row = getRow(sector);
                      const created = createdSectorIds.has(sector.id);
                      const creating = creatingSectorId === sector.id;
                      const canCreate = row.email.trim() && row.password && !creating;
                      return (
                        <TableRow key={sector.id} className={adminPanelTableRowClass}>
                          <TableCell className="font-medium text-zinc-200 text-sm py-3 px-4">{sector.sector_name}</TableCell>
                          <TableCell className="py-3 px-4">
                            <Input
                              placeholder={`Sector Admin – ${sector.sector_name}`}
                              value={row.name}
                              onChange={(e) => updateSectorRow(sector.id, "name", e.target.value)}
                              className={adminPanelInputClass + " h-8"}
                            />
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              value={row.email}
                              onChange={(e) => updateSectorRow(sector.id, "email", e.target.value)}
                              className={adminPanelInputClass + " h-8"}
                              disabled={created}
                            />
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={row.password}
                              onChange={(e) => updateSectorRow(sector.id, "password", e.target.value)}
                              className={adminPanelInputClass + " h-8"}
                              disabled={created}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            {created ? (
                              <span className="text-sm text-zinc-500">Credentials created</span>
                            ) : (
                              <Button
                                size="sm"
                                className="rounded-lg"
                                disabled={!canCreate}
                                onClick={() => handleCreateCredentials(sector)}
                              >
                                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create credentials"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="rounded-lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save settings
      </Button>
    </div>
  );
}
