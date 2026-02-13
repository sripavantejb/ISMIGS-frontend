import { Outlet, useNavigate } from "react-router-dom";
import { FileCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearStoredSectorToken } from "@/services/sectorApi";
import { clearStoredToken, clearStoredUser } from "@/services/adminApi";

export default function SectorLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredSectorToken();
    clearStoredToken();
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-zinc-200">Sector approvals</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-zinc-100">
          <LogOut className="h-4 w-4 mr-1" />
          Log out
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
