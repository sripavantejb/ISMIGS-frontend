import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FileCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearStoredSectorToken } from "@/services/sectorApi";
import { clearStoredToken, clearStoredUser, fetchMe } from "@/services/adminApi";

export default function SectorLayout() {
  const navigate = useNavigate();
  const [sectorName, setSectorName] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((res: { user?: string | { sector_name?: string } }) => {
        if (res.user && typeof res.user === "object" && res.user.sector_name) {
          setSectorName(res.user.sector_name);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    clearStoredSectorToken();
    clearStoredToken();
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <FileCheck className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold text-zinc-100">
            Sector approvals{sectorName ? ` – ${sectorName}` : ""}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-zinc-100 border-zinc-700 hover:border-zinc-600">
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto w-full px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
