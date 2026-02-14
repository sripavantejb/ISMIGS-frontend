import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSuperadminNotifications, fetchSuperadminSectors, type NotificationItem, type SuperadminSector } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  adminPanelCardClass,
  adminPanelCardHeaderClass,
  adminPanelCardContentClass,
  adminPanelInputClass,
  adminPanelPageTitleClass,
  adminPanelPageSubtitleClass,
} from "@/lib/adminPanelStyles";

const ALL_SECTORS = "__all__";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function Notifications() {
  const [sectorFilter, setSectorFilter] = useState<string>(ALL_SECTORS);
  const { data: sectors = [] } = useQuery({
    queryKey: ["superadmin_sectors"],
    queryFn: fetchSuperadminSectors,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["superadmin_notifications", sectorFilter],
    queryFn: () =>
      fetchSuperadminNotifications({
        limit: 50,
        sector_id: sectorFilter && sectorFilter !== ALL_SECTORS ? sectorFilter : undefined,
      }),
  });

  const items: NotificationItem[] = data?.items ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-w-0 w-full">
      <div className="space-y-1">
        <h1 className={adminPanelPageTitleClass}>Notifications</h1>
        <p className={adminPanelPageSubtitleClass}>Activity feed across sectors.</p>
      </div>
      <Card className={cn(adminPanelCardClass, "overflow-hidden")}>
        <CardHeader className={adminPanelCardHeaderClass}>
          <CardTitle className="text-zinc-100">Activity feed</CardTitle>
          <CardDescription className="text-zinc-400">
            LinkedIn posts, approvals, sector admin creation, and emails across sectors.
          </CardDescription>
          <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
            <span className="text-sm text-zinc-400 shrink-0">Sector:</span>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className={cn(adminPanelInputClass, "w-full sm:w-[220px] min-w-0")}>
                <SelectValue placeholder="All sectors" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-zinc-900 border-zinc-800">
                <SelectItem value={ALL_SECTORS}>All sectors</SelectItem>
                {sectors.map((s: SuperadminSector) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.sector_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className={adminPanelCardContentClass}>
          {isLoading ? (
            <ul className="space-y-0 min-w-0 divide-y divide-zinc-800">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-3 -mx-2 px-2">
                  <Skeleton className="h-4 w-40 bg-zinc-800" />
                  <Skeleton className="h-4 w-24 bg-zinc-800" />
                  <Skeleton className="h-4 w-64 max-w-full bg-zinc-800" />
                  <Skeleton className="h-4 w-16 bg-zinc-800 ml-auto" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="text-zinc-500 py-8 text-center text-sm">No activity yet.</p>
          ) : (
            <ul className="space-y-0 min-w-0 divide-y divide-zinc-800">
              {items.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-3 text-sm min-w-0 hover:bg-zinc-800/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <span className="font-medium text-zinc-100 break-words">{item.title}</span>
                  {item.sector_name && (
                    <span className="text-zinc-500 shrink-0">· {item.sector_name}</span>
                  )}
                  {item.description && (
                    <span className="text-zinc-400 truncate min-w-0 max-w-full sm:max-w-md">{item.description}</span>
                  )}
                  <span className="text-zinc-500 ml-auto shrink-0">{formatTime(item.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
