import {
  BarChart3,
  Zap,
  Factory,
  TrendingUp,
  Landmark,
  Search,
  Map,
  Activity,
  Building2,
  LineChart,
  ChevronDown,
  Sprout,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEnergyCommodityList } from "@/hooks/useEnergyCommodityList";
import { commodityNameToSlug } from "@/utils/energySlug";
import { WPI_MAJOR_GROUP_LIST, majorGroupNameToSlug } from "@/utils/wpiSlug";
import { IIP_CATEGORY_LIST } from "@/utils/iipSlug";
import { useGVAIndustryList } from "@/hooks/useGVAIndustryList";
import { gvaIndustryToSlug, gvaIndustrySidebarLabel } from "@/utils/gvaSlug";
import { useSector, type Sector } from "@/contexts/SectorContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const AGRICULTURE_NAV_ITEMS: { to: string; label: string }[] = [
  { to: "/agriculture", label: "Dashboard" },
  { to: "/agriculture/crop-recommendation", label: "Crop recommendation" },
  { to: "/agriculture/crop-doctor", label: "AI Crop Doctor" },
  { to: "/agriculture/costs", label: "Cultivation cost calculator (AI)" },
  { to: "/agriculture/profitability", label: "Crop Profitability" },
  { to: "/agriculture/loans", label: "Loans" },
  { to: "/agriculture/schemes", label: "Government schemes" },
  { to: "/agriculture/market-prices", label: "Market prices" },
  { to: "/agriculture/water-irrigation", label: "Water & irrigation" },
  { to: "/agriculture/alerts", label: "Alerts" },
  { to: "/agriculture/experts", label: "Expert consultation" },
];

// Overview link: Agriculture panel → /agriculture, Energy panel → /dashboard

const navItemsAfterEnergy = [
  { title: "Risk Intelligence", url: "/risk-intelligence", icon: Activity },
  { title: "GDP and national accounts", url: "/gdp", icon: Landmark },
  // { title: "Predictions", url: "/predictions", icon: LineChart },
  // { title: "Data Explorer", url: "/explorer", icon: Search },
];

const ENERGY_PATHS = ["/dashboard", "/energy", "/wpi", "/iip", "/gva", "/risk-intelligence", "/gdp"] as const;
function isOnEnergyPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") || ENERGY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AppSidebar() {
  const sidebar = useSidebar();
  const collapsed = sidebar?.state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { sector, setSector } = useSector();
  const commodityList = useEnergyCommodityList();
  const isAgricultureSection = location.pathname.startsWith("/agriculture");
  const isEnergySection = location.pathname.startsWith("/energy");
  const isWpiSection = location.pathname.startsWith("/wpi");
  const isIipSection = location.pathname.startsWith("/iip");
  const isGvaSection = location.pathname.startsWith("/gva");
  const gvaIndustryList = useGVAIndustryList();

  const handleSectorChange = (value: string) => {
    const newSector = value as Sector;
    if (newSector === sector) return;
    setSector(newSector);
    if (newSector === "agriculture" && isOnEnergyPath(location.pathname)) {
      navigate("/agriculture", { replace: true });
    } else if (newSector === "energy" && isAgricultureSection) {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* Logo area - fixed at top */}
        <div className="flex shrink-0 items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          <Activity className="w-6 h-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              ISMIGS
            </span>
          )}
        </div>

        {/* Sector switch */}
        <div className="shrink-0 px-3 py-3 border-b border-sidebar-border">
          <TooltipProvider delayDuration={300}>
            <Tabs value={sector} onValueChange={handleSectorChange}>
              <TabsList className={cn(
                "w-full grid grid-cols-2 h-9 bg-sidebar-accent/50 p-1",
                collapsed && "grid-cols-2"
              )}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="agriculture"
                      className={cn(
                        "flex items-center justify-center gap-2 text-sidebar-foreground/70 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:ring-1 data-[state=active]:ring-sidebar-ring data-[state=active]:ring-inset",
                        collapsed && "px-2"
                      )}
                    >
                      <Sprout className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate text-xs">Agriculture</span>}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">Agriculture</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="energy"
                      className={cn(
                        "flex items-center justify-center gap-2 text-sidebar-foreground/70 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:ring-1 data-[state=active]:ring-sidebar-ring data-[state=active]:ring-inset",
                        collapsed && "px-2"
                      )}
                    >
                      <Zap className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate text-xs">Energy</span>}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">Energy</TooltipContent>
                </Tooltip>
              </TabsList>
            </Tabs>
          </TooltipProvider>
        </div>

        {/* Scrollable nav only - footer stays visible */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
        <SidebarGroup className="pb-2">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={sector === "agriculture" ? "Agriculture Overview" : "Overview"}>
                  <NavLink
                    to={sector === "agriculture" ? "/agriculture" : "/dashboard"}
                    end={true}
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>{sector === "agriculture" ? "Agriculture Overview" : "Overview"}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {sector === "agriculture" && (
              <SidebarMenuItem>
                <Collapsible defaultOpen={isAgricultureSection} className="group/menu-item">
                  <CollapsibleTrigger asChild aria-label="Toggle agriculture sections">
                    <NavLink
                      to="/agriculture"
                      end={false}
                      className={cn(
                        "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:!p-2",
                        isAgricultureSection && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      activeClassName="bg-transparent"
                    >
                      <Sprout className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 min-w-0">Agriculture</span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/menu-item:rotate-180" />
                    </NavLink>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {AGRICULTURE_NAV_ITEMS.map(({ to, label }) => {
                        const isActive = location.pathname === to;
                        return (
                          <SidebarMenuSubItem key={to}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink
                                to={to}
                                end={to === "/agriculture"}
                                className={cn(
                                  "block truncate",
                                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                                title={label}
                              >
                                {label}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
              )}

              {sector === "energy" && (
              <SidebarMenuItem>
                <Collapsible defaultOpen={isEnergySection} className="group/menu-item">
                  <CollapsibleTrigger asChild aria-label="Toggle energy commodities">
                    <NavLink
                      to="/energy"
                      end={false}
                      className={cn(
                        "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:!p-2",
                        isEnergySection && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      activeClassName="bg-transparent"
                    >
                      <Zap className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 min-w-0">Energy Analytics</span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/menu-item:rotate-180" />
                    </NavLink>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {commodityList.map((name) => {
                        const slug = commodityNameToSlug(name);
                        const isActive = location.pathname === `/energy/${slug}`;
                        return (
                          <SidebarMenuSubItem key={name}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink
                                to={`/energy/${slug}`}
                                className={cn(
                                  "block",
                                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                              >
                                {name}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
              )}

              {sector === "energy" && (
              <>
              <SidebarMenuItem>
                <Collapsible defaultOpen={isWpiSection} className="group/menu-item">
                  <CollapsibleTrigger asChild aria-label="Toggle wholesale inflation groups">
                    <NavLink
                      to="/wpi"
                      end={false}
                      className={cn(
                        "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:!p-2",
                        isWpiSection && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      activeClassName="bg-transparent"
                    >
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 min-w-0">Wholesale inflation</span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/menu-item:rotate-180" />
                    </NavLink>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {WPI_MAJOR_GROUP_LIST.map((name) => {
                        const slug = majorGroupNameToSlug(name);
                        const isActive = location.pathname === `/wpi/${slug}`;
                        return (
                          <SidebarMenuSubItem key={name}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink
                                to={slug === "overall" ? "/wpi/overall" : `/wpi/${slug}`}
                                className={cn(
                                  "block",
                                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                              >
                                {name}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isIipSection} className="group/menu-item">
                  <CollapsibleTrigger asChild aria-label="Toggle industrial production categories">
                    <NavLink
                      to="/iip"
                      end={false}
                      className={cn(
                        "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:!p-2",
                        isIipSection && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      activeClassName="bg-transparent"
                    >
                      <Factory className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 min-w-0">Industrial production</span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/menu-item:rotate-180" />
                    </NavLink>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {IIP_CATEGORY_LIST.map((config) => {
                        const isActive = location.pathname === `/iip/${config.slug}`;
                        return (
                          <SidebarMenuSubItem key={config.slug}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink
                                to={`/iip/${config.slug}`}
                                className={cn(
                                  "block truncate",
                                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                                title={config.displayName}
                              >
                                {config.sidebarLabel}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={isGvaSection} className="group/menu-item">
                  <CollapsibleTrigger asChild aria-label="Toggle sector-wise economy industries">
                    <NavLink
                      to="/gva"
                      end={false}
                      className={cn(
                        "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:!p-2",
                        isGvaSection && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      activeClassName="bg-transparent"
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 min-w-0">Sector-wise economy</span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/menu-item:rotate-180" />
                    </NavLink>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {gvaIndustryList.map((name) => {
                        const slug = gvaIndustryToSlug(name);
                        const isActive = location.pathname === `/gva/${slug}`;
                        return (
                          <SidebarMenuSubItem key={slug}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <NavLink
                                to={`/gva/${slug}`}
                                className={cn(
                                  "block truncate",
                                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                                title={name}
                              >
                                {gvaIndustrySidebarLabel(name)}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {navItemsAfterEnergy.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </div>

        {/* Status indicator - fixed at bottom */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-stable animate-pulse" />
            {!collapsed && (
              <span className="text-xs text-muted-foreground font-mono">
                Official data live
              </span>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
