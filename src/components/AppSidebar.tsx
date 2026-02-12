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
import { cn } from "@/lib/utils";

const navItemsBeforeEnergy = [
  { title: "Overview", url: "/", icon: BarChart3 },
  { title: "Energy Map", url: "/energy-map", icon: Map },
];

const navItemsAfterEnergy = [
  { title: "CPI-AL/RL Map", url: "/cpi-map", icon: Wheat },
  { title: "CPI Outlook", url: "/cpi-outlook", icon: Eye },
  { title: "Risk Intelligence", url: "/risk-intelligence", icon: Activity },
  { title: "Industrial (IIP)", url: "/iip", icon: Factory },
  { title: "GDP & Accounts", url: "/gdp", icon: Landmark },
  { title: "GVA", url: "/gva", icon: Building2 },
  { title: "Predictions", url: "/predictions", icon: LineChart },
  { title: "Data Explorer", url: "/explorer", icon: Search },
];

export function AppSidebar() {
  const sidebar = useSidebar();
  const collapsed = sidebar?.state === "collapsed";
  const location = useLocation();
  const commodityList = useEnergyCommodityList();
  const isEnergySection = location.pathname.startsWith("/energy");
  const isWpiSection = location.pathname.startsWith("/wpi");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo area */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          <Activity className="w-6 h-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              ISMIGS
            </span>
          )}
        </div>

        <SidebarGroup>
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
                  <div
                    className={cn(
                      "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:!p-2",
                      isEnergySection && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <NavLink
                      to="/energy"
                      end={false}
                      className="flex flex-1 min-w-0 items-center gap-2 overflow-hidden"
                      activeClassName="bg-transparent"
                    >
                      <Zap className="h-4 w-4 shrink-0" />
                      <span className="truncate">Energy Analytics</span>
                    </NavLink>
                    <CollapsibleTrigger
                      className="flex shrink-0 rounded p-0.5 hover:bg-sidebar-accent"
                      aria-label="Toggle energy commodities"
                    >
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/menu-item:rotate-180" />
                    </CollapsibleTrigger>
                  </div>
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
                  <div
                    className={cn(
                      "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:!p-2",
                      isWpiSection && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <NavLink
                      to="/wpi"
                      end={false}
                      className="flex flex-1 min-w-0 items-center gap-2 overflow-hidden"
                      activeClassName="bg-transparent"
                    >
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <span className="truncate">Inflation (WPI)</span>
                    </NavLink>
                    <CollapsibleTrigger
                      className="flex shrink-0 rounded p-0.5 hover:bg-sidebar-accent"
                      aria-label="Toggle WPI major groups"
                    >
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/menu-item:rotate-180" />
                    </CollapsibleTrigger>
                  </div>
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

        {/* Status indicator */}
        <div className="mt-auto px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-stable animate-pulse" />
            {!collapsed && (
              <span className="text-xs text-muted-foreground font-mono">
                MoSPI Live
              </span>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
