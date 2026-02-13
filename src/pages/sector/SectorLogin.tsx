import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { sectorLogin, getStoredSectorToken, setStoredSectorToken } from "@/services/sectorApi";

export default function SectorLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (getStoredSectorToken()) {
      navigate("/sector/approvals", { replace: true });
      return;
    }
    setChecking(false);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await sectorLogin(username.trim(), password);
      setStoredSectorToken(token);
      navigate("/sector/approvals", { replace: true });
    } catch (err) {
      const e = err as Error & { status?: number };
      const is401 = e.status === 401;
      const isNetworkError =
        e instanceof TypeError || e.message === "Failed to fetch";
      setError(
        is401
          ? "Invalid username or password."
          : isNetworkError
            ? "Cannot reach the backend. Check your connection."
            : e.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-zinc-950">
        <Card className="w-full max-w-md border-border bg-zinc-900">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-zinc-950">
      <Card className="w-full max-w-md border-border bg-zinc-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" />
            <CardTitle className="text-zinc-100">Sector approvals</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Sign in with the credentials provided by your admin to view and approve LinkedIn posts for your sector.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sector-username" className="text-zinc-300">Username</Label>
              <Input
                id="sector-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Sector login username"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector-password" className="text-zinc-300">Password</Label>
              <Input
                id="sector-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
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
