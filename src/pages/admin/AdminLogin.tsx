import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { login, getStoredToken, setStoredToken, setStoredUser } from "@/services/adminApi";
import { setStoredSectorToken } from "@/services/sectorApi";

// Demo credentials matching backend defaults (ADMIN_USERNAME / ADMIN_PASSWORD)
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin123";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (getStoredToken()) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    setChecking(false);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(
        email.trim() ? { email: email.trim(), password } : { username: username.trim(), password }
      );
      setStoredToken(res.token);
      if (res.user) setStoredUser({ id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role as "SUPER_ADMIN" | "SECTOR_ADMIN", sector_id: res.user.sector_id });
      else if (res.role === "SUPER_ADMIN") setStoredUser({ id: "admin", role: "SUPER_ADMIN" });
      if (res.role === "SECTOR_ADMIN") {
        setStoredSectorToken(res.token);
        navigate("/sector/approvals", { replace: true });
      }
      else if (res.role === "SUPER_ADMIN") navigate("/admin-panel", { replace: true });
      else navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const e = err as Error & { status?: number };
      const is401 = e.status === 401;
      const isNetworkError =
        e instanceof TypeError || e.message === "Failed to fetch";
      setError(
        is401
          ? "Invalid username or password."
          : isNetworkError
            ? "Cannot reach the backend. Check your connection or that the backend URL is correct."
            : "Something went wrong. Try again."
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
            <CardTitle>Admin</CardTitle>
          </div>
          <CardDescription>Sign in with email (Sector Admin) or username (Admin). Super Admin: use email or admin / admin123.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email (optional)</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username (if no email)</Label>
              <Input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
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
