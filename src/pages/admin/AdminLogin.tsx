import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { login, getStoredToken, setStoredToken, setStoredUser, fetchMe } from "@/services/adminApi";
import { setStoredSectorToken } from "@/services/sectorApi";

// Demo credentials matching backend defaults (ADMIN_USERNAME / ADMIN_PASSWORD)
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin123";

function redirectByRole(
  res: { role?: string; user?: { id: string; name?: string; email?: string; role?: string; sector_id?: string } },
  navigate: (path: string, opts?: { replace: boolean }) => void,
  setStoredUser: (u: { id: string; name?: string; email?: string; role: "SUPER_ADMIN" | "SECTOR_ADMIN"; sector_id?: string }) => void,
  setStoredSectorToken: (t: string) => void,
  token: string
) {
  if (res.user) setStoredUser({ id: res.user.id, name: res.user.name, email: res.user.email, role: (res.user.role as "SUPER_ADMIN" | "SECTOR_ADMIN") || "SECTOR_ADMIN", sector_id: res.user.sector_id });
  else if (res.role === "SUPER_ADMIN") setStoredUser({ id: "admin", role: "SUPER_ADMIN" });
  if (res.role === "SECTOR_ADMIN") {
    setStoredSectorToken(token);
    navigate("/sector/approvals", { replace: true });
  } else if (res.role === "SUPER_ADMIN") navigate("/admin-panel", { replace: true });
  else navigate("/admin/dashboard", { replace: true });
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((res: { user?: string | { id: string; name?: string; email?: string; role?: string; sector_id?: string }; role?: string }) => {
        if (cancelled) return;
        const role = res.role ?? (res.user && typeof res.user === "object" ? res.user.role : null);
        const user = res.user && typeof res.user === "object" ? res.user : null;
        if (role === "SECTOR_ADMIN") {
          setStoredSectorToken(token);
          setStoredUser({ id: user?.id ?? "", name: user?.name, email: user?.email, role: "SECTOR_ADMIN", sector_id: user?.sector_id });
          navigate("/sector/approvals", { replace: true });
        } else if (role === "SUPER_ADMIN") {
          setStoredUser({ id: "admin", role: "SUPER_ADMIN" });
          navigate("/admin-panel", { replace: true });
        } else {
          if (user) setStoredUser({ id: user.id, name: user.name, email: user.email, role: (user.role as "SUPER_ADMIN" | "SECTOR_ADMIN") || "SUPER_ADMIN", sector_id: user.sector_id });
          navigate("/admin/dashboard", { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => { cancelled = true; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const emailVal = email.trim();
    const usernameVal = username.trim();
    // Accounts created in Super Admin (Sector Admin) are logged in by EMAIL. If user typed email in either field, use it.
    const loginEmail = emailVal || (usernameVal.includes("@") ? usernameVal : "");
    const loginPayload = loginEmail
      ? { email: loginEmail, password }
      : { username: usernameVal, password };
    try {
      const res = await login(loginPayload);
      setStoredToken(res.token);
      redirectByRole(res, navigate, setStoredUser, setStoredSectorToken, res.token);
    } catch (err) {
      const errObj = err as Error & { status?: number };
      const is401 = errObj.status === 401;
      const isNetworkError =
        errObj instanceof TypeError || errObj.message === "Failed to fetch";
      setError(
        is401
          ? "Invalid email or password. If your account was created in the Super Admin panel, use the exact email (in the Email field above) and password that were set when the account was created."
          : isNetworkError
            ? "Cannot reach the backend. Check your connection or that the backend URL is correct."
            : errObj.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Admin login</CardTitle>
          </div>
          <CardDescription>
            One login for Super Admin, Admin, and Sector Admin. Sign in with your credentials; you will be redirected to the correct panel based on your role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Sector Admin: your email. Super Admin: optional."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username (if not using email)</Label>
              <Input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Super Admin: admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
