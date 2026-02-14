import {
  BarChart3,
  Zap,
  Factory,
  TrendingUp,
  Landmark,
  Search,
  Map,
  Activity,
  Wheat,
  Eye,
  Building2,
  LineChart,
  ChevronDown,
} from "lucide-react";
import { useLocation } from "react-router-dom";
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
import { cn } from "@/lib/utils";

const navItemsBeforeEnergy = [
  { title: "Overview", url: "/", icon: BarChart3 },
  // { title: "Energy Map", url: "/energy-map", icon: Map },
];

const navItemsAfterEnergy = [
  { title: "Rural prices map", url: "/cpi-map", icon: Wheat },
  { title: "Consumer price outlook", url: "/cpi-outlook", icon: Eye },
  { title: "Risk Intelligence", url: "/risk-intelligence", icon: Activity },
  { title: "GDP and national accounts", url: "/gdp", icon: Landmark },
  // { title: "Predictions", url: "/predictions", icon: LineChart },
  // { title: "Data Explorer", url: "/explorer", icon: Search },
];

export function AppSidebar() {
  const sidebar = useSidebar();
  const collapsed = sidebar?.state === "collapsed";
  const location = useLocation();
  const commodityList = useEnergyCommodityList();
  const isEnergySection = location.pathname.startsWith("/energy");
  const isWpiSection = location.pathname.startsWith("/wpi");
  const isIipSection = location.pathname.startsWith("/iip");
  const isGvaSection = location.pathname.startsWith("/gva");
  const gvaIndustryList = useGVAIndustryList();

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

        {/* Scrollable nav only - footer stays visible */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
        <SidebarGroup className="pb-2">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItemsBeforeEnergy.map((item) => (
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
