import { Outlet, useNavigate } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearStoredToken, clearStoredUser } from "@/services/adminApi";

export default function AdminPanelLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredToken();
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 md:px-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Super Admin Panel</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-zinc-100">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
