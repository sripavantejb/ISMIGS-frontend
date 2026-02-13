import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { fetchSettings, updateSettings, smtpTest } from "@/services/adminApi";

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultFrom, setDefaultFrom] = useState("");
  const [smtpTestEmail, setSmtpTestEmail] = useState("");

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

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save settings
      </Button>
    </div>
  );
}
