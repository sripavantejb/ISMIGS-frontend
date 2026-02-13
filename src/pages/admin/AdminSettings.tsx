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
      toast({ title: "Credentials created", description: `Sector Admin for ${sector.sector_name} can now sign in with that email.` });
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
      <div className="space-y-6 max-w-xl">
        <div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full max-w-md mt-2" />
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-full max-w-sm mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full max-w-lg mt-2" />
          </CardHeader>
          <CardContent className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Notifications and email defaults</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>When disabled, no sector emails will be sent (test or real).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="notifications-enabled" className="cursor-pointer">Notifications enabled</Label>
          <Switch
            id="notifications-enabled"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Default from address</CardTitle>
          <CardDescription>Overrides SMTP_FROM when set. Leave empty to use server default.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="email"
            placeholder="e.g. notifications@example.com"
            value={defaultFrom}
            onChange={(e) => setDefaultFrom(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Test SMTP</CardTitle>
          <CardDescription>Send a test email to verify SMTP. Configure SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env (see .env.example).</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={smtpTestEmail}
            onChange={(e) => setSmtpTestEmail(e.target.value)}
          />
          <Button onClick={handleSmtpTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send test"}
          </Button>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Sector admin credentials
            </CardTitle>
            <CardDescription>
              Create login credentials (email and password) for each sector. Sector Admins can then sign in at the login page and access their sector&apos;s approvals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sectorsError && (
              <p className="text-sm text-destructive mb-4">
                {sectorsError instanceof Error ? sectorsError.message : "Failed to load sectors."}
              </p>
            )}
            {sectorsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : sectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sectors yet. Create sectors from the Super Admin panel first.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Sector</TableHead>
                      <TableHead className="min-w-[160px]">Name</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Password</TableHead>
                      <TableHead className="text-right w-[160px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((sector) => {
                      const row = getRow(sector);
                      const created = createdSectorIds.has(sector.id);
                      const creating = creatingSectorId === sector.id;
                      const canCreate = row.email.trim() && row.password && !creating;
                      return (
                        <TableRow key={sector.id}>
                          <TableCell className="font-medium">{sector.sector_name}</TableCell>
                          <TableCell>
                            <Input
                              placeholder={`Sector Admin – ${sector.sector_name}`}
                              value={row.name}
                              onChange={(e) => updateSectorRow(sector.id, "name", e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              value={row.email}
                              onChange={(e) => updateSectorRow(sector.id, "email", e.target.value)}
                              className="h-8"
                              disabled={created}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={row.password}
                              onChange={(e) => updateSectorRow(sector.id, "password", e.target.value)}
                              className="h-8"
                              disabled={created}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {created ? (
                              <span className="text-sm text-muted-foreground">Credentials created</span>
                            ) : (
                              <Button
                                size="sm"
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

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save settings
      </Button>
    </div>
  );
}
