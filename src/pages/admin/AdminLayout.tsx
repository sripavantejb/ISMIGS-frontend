import { useLocation, Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Mail, List, Settings, LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { clearStoredToken } from "@/services/adminApi";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/sectors", label: "Sector recipients", icon: Mail },
  { to: "/admin/digest", label: "Email digest", icon: FileText },
  { to: "/admin/logs", label: "Email logs", icon: List },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearStoredToken();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex items-center justify-between gap-6 border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-foreground">Admin</h1>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin/dashboard"}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  location.pathname === item.to || (item.to !== "/admin/dashboard" && location.pathname.startsWith(item.to))
                    ? "bg-muted text-foreground"
                    : ""
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      <Outlet />
    </div>
  );
}
