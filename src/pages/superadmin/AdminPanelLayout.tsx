import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, NavLink, useSearchParams } from "react-router-dom";
import {
  Shield,
  LogOut,
  LayoutDashboard,
  Mail,
  List,
  Settings,
  FileText,
  AlertTriangle,
  LayoutGrid,
  Bell,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { clearStoredToken, clearStoredUser } from "@/services/adminApi";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { to: "/admin-panel", end: true, label: "Overview", icon: LayoutGrid },
  { to: "/admin-panel/dashboard", end: false, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin-panel/notifications", end: false, label: "Notifications", icon: Bell },
  { to: "/admin-panel/sectors", end: false, label: "Sector recipients", icon: Mail },
  { to: "/admin-panel/alerts", end: false, label: "Sector alerts", icon: AlertTriangle },
  { to: "/admin-panel/digest", end: false, label: "Email digest", icon: FileText },
  { to: "/admin-panel/logs", end: false, label: "Email logs", icon: List },
  { to: "/admin-panel/settings", end: false, label: "Settings", icon: Settings },
];

function NavLinkContent({ item }: { item: (typeof navItems)[number] }) {
  const Icon = item.icon;
  return (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </>
  );
}

export default function AdminPanelLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const result = searchParams.get("result");
    if (!result) return;
    if (result === "approved") {
      toast({ title: "Post approved", description: "The LinkedIn post has been approved and will be shared." });
    } else if (result === "rejected") {
      toast({ title: "Post cancelled", description: "No action taken on the LinkedIn post." });
    } else if (result === "expired") {
      toast({ variant: "destructive", title: "Link expired", description: "This confirmation link has expired." });
    } else if (result === "invalid") {
      toast({ variant: "destructive", title: "Invalid link", description: "This link is invalid or has already been used." });
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("result");
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  const handleLogout = () => {
    clearStoredToken();
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };

  const isActive = (item: (typeof navItems)[number]) =>
    location.pathname === item.to || (!item.end && location.pathname.startsWith(item.to));

  const navList = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setSheetOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md py-2.5 pr-3 text-sm font-medium transition-colors",
            "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80",
            isActive(item)
              ? "bg-zinc-800 text-zinc-100 border-l-2 border-primary pl-[14px]"
              : "pl-3"
          )}
        >
          <NavLinkContent item={item} />
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-x-hidden">
      {/* Mobile header: hamburger + title + logout */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 min-h-[44px] items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-3 sm:px-4 backdrop-blur flex-shrink-0 w-full min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
          onClick={() => setSheetOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-sm sm:text-base truncate">Super Admin Panel</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-zinc-400 hover:text-zinc-100 shrink-0 min-h-[44px] px-3"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </header>

      {/* Mobile nav drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          className="w-[min(85vw,20rem)] border-r border-zinc-800 bg-zinc-900 p-0 flex flex-col"
        >
          <SheetHeader className="p-4 border-b border-zinc-800 text-left">
            <SheetTitle className="text-zinc-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Menu
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-3">{navList}</div>
          <div className="mt-auto border-t border-zinc-800 p-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-zinc-800 bg-zinc-900/95">
        <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
          <Shield className="h-6 w-6 text-primary shrink-0" />
          <span className="font-semibold text-base text-zinc-100 truncate">Super Admin Panel</span>
        </div>
        <div className="flex-1 overflow-auto p-3">{navList}</div>
        <div className="mt-auto border-t border-zinc-800 p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 text-sm font-medium"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3 shrink-0" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 md:pl-[calc(16rem+1.5rem)]">
        <Outlet />
      </main>
    </div>
  );
}
