import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, User, Calculator, TrendingUp, Zap, Bell, Map, Banknote, Leaf, Landmark, IndianRupee, Droplets, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; end: boolean; label: string; icon: React.ComponentType<{ className?: string }> };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/farmers", end: true, label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "My farm",
    items: [
      { to: "/farmers/profile", end: false, label: "Farm Profile", icon: User },
      { to: "/farmers/crop-recommendation", end: false, label: "Crop recommendation", icon: Leaf },
    ],
  },
  {
    label: "Costs & planning",
    items: [
      { to: "/farmers/costs", end: false, label: "Input Costs", icon: Calculator },
      { to: "/farmers/profitability", end: false, label: "Crop Profitability", icon: TrendingUp },
      { to: "/farmers/energy", end: false, label: "Energy Impact", icon: Zap },
      { to: "/farmers/loans", end: false, label: "Loans", icon: Banknote },
    ],
  },
  {
    label: "Markets & prices",
    items: [
      { to: "/farmers/rural-prices", end: false, label: "Rural prices map", icon: Map },
      { to: "/farmers/schemes", end: false, label: "Government schemes", icon: Landmark },
      { to: "/farmers/market-prices", end: false, label: "Market prices", icon: IndianRupee },
      { to: "/farmers/water-irrigation", end: false, label: "Water & irrigation", icon: Droplets },
    ],
  },
  {
    label: "Alerts & support",
    items: [
      { to: "/farmers/alerts", end: false, label: "Alerts", icon: Bell },
      { to: "/farmers/experts", end: false, label: "Expert consultation", icon: Users },
    ],
  },
];

export default function FarmersLayout() {
  return (
    <div className="flex flex-col min-h-full">
      <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 p-2 border-b border-emerald-900/40 bg-card sticky top-0 z-30 will-change-transform [transform:translateZ(0)]">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label} className="flex items-center gap-1">
            {groupIdx > 0 && (
              <span className="w-px h-5 bg-border/60 mx-1 shrink-0" aria-hidden />
            )}
            {group.items.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-emerald-500/10"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
