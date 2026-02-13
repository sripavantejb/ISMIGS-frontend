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
import { Loader2 } from "lucide-react";

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
    <div className="space-y-4 min-w-0">
      <Card className="border border-zinc-800 bg-zinc-900/80 overflow-hidden">
        <CardHeader className="pb-2 p-4 md:p-6">
          <CardTitle className="text-zinc-100">Activity feed</CardTitle>
          <CardDescription className="text-zinc-400">
            LinkedIn posts, approvals, sector admin creation, and emails across sectors.
          </CardDescription>
          <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
            <span className="text-sm text-zinc-400 shrink-0">Sector:</span>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full sm:w-[220px] bg-zinc-800 border-zinc-700 text-zinc-100 min-w-0">
                <SelectValue placeholder="All sectors" />
              </SelectTrigger>
              <SelectContent>
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
        <CardContent className="p-4 md:p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="text-zinc-500 py-8 text-center">No activity yet.</p>
          ) : (
            <ul className="space-y-2 min-w-0">
              {items.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2 border-b border-zinc-800 last:border-0 text-sm min-w-0"
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
