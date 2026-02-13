import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  FileCheck,
  History,
  Mail,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSectorList } from "@/hooks/useSectorList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSuperadminSectors,
  createSector,
  createSectorAdmin,
  ensureSector,
  fetchAllApprovals,
  sendSuperadminSectorEmail,
  type SuperadminSector,
  type AllApprovalRow,
} from "@/services/adminApi";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sectorName, setSectorName] = useState("");
  const [sectorKey, setSectorKey] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSectorKey, setAdminSectorKey] = useState("");
  const ALL_FILTER = "__all__";
  const [filterSector, setFilterSector] = useState<string>(ALL_FILTER);
  const [filterCommodity, setFilterCommodity] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(ALL_FILTER);
  const [emailSectorKey, setEmailSectorKey] = useState("");

  const sectorGroups = useSectorList();
  const allSectors = sectorGroups.flatMap((g) => g.sectors);

  const { data: sectors = [], isLoading: sectorsLoading } = useQuery({
    queryKey: ["superadmin_sectors"],
    queryFn: fetchSuperadminSectors,
  });

  const { data: approvalsData, isLoading: approvalsLoading } = useQuery({
    queryKey: ["superadmin_approvals", filterSector, filterCommodity, filterStatus],
    queryFn: () =>
      fetchAllApprovals({
        limit: 100,
        sector_id: filterSector && filterSector !== ALL_FILTER ? filterSector : undefined,
        commodity: filterCommodity || undefined,
        status: filterStatus && filterStatus !== ALL_FILTER ? filterStatus : undefined,
      }),
  });

  const createSectorMutation = useMutation({
    mutationFn: () =>
      createSector({
        sector_name: sectorName.trim(),
        sector_key: sectorKey.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_sectors"] });
      setSectorName("");
      setSectorKey("");
      toast({ title: "Sector created" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      const displayName = allSectors.find((s) => s.sectorKey === adminSectorKey)?.displayName ?? adminSectorKey;
      const { id } = await ensureSector({ sector_key: adminSectorKey, sector_name: displayName });
      return createSectorAdmin({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        sector_id: id,
      });
    },
    onSuccess: () => {
      const displayName = allSectors.find((s) => s.sectorKey === adminSectorKey)?.displayName ?? adminSectorKey;
      queryClient.invalidateQueries({ queryKey: ["superadmin_sectors"] });
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminSectorKey("");
      toast({
        title: "Sector Admin created",
        description: `They can sign in and will only see data for ${displayName}.`,
      });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const displayName = allSectors.find((s) => s.sectorKey === emailSectorKey)?.displayName ?? emailSectorKey;
      const { id } = await ensureSector({ sector_key: emailSectorKey, sector_name: displayName });
      return sendSuperadminSectorEmail(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_approvals"] });
      toast({ title: "Email sent", description: `Sent to ${data.sent} recipient(s).` });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const items = approvalsData?.items ?? [];
  const total = approvalsData?.total ?? 0;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const approvedCount = items.filter((i) => i.status === "approved").length;
  const rejectedCount = items.filter((i) => i.status === "rejected").length;

  const cardClass = "border border-zinc-800 bg-zinc-900/80 rounded-xl shadow-sm min-w-0";
  const cardHeaderClass = "p-4 md:p-6 pb-2";
  const cardContentClass = "p-4 md:p-6 pt-0";
  const labelClass = "text-sm font-medium text-zinc-300";
  const inputClass = "bg-zinc-800 border-zinc-700 rounded-md w-full focus:ring-zinc-500 focus:ring-offset-zinc-900";

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
        {/* Overview Stats */}
        <motion.section variants={item}>
          <h2 className="text-base font-semibold tracking-tight text-zinc-100 mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={cardClass}>
              <CardHeader className={cardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Sectors
                </CardTitle>
              </CardHeader>
              <CardContent className={cardContentClass}>
                <p className="text-2xl font-bold text-zinc-100">{sectorsLoading ? "—" : sectors.length}</p>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader className={cardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent className={cardContentClass}>
                <p className="text-2xl font-bold text-amber-400">{approvalsLoading ? "—" : pendingCount}</p>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader className={cardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Approved
                </CardTitle>
              </CardHeader>
              <CardContent className={cardContentClass}>
                <p className="text-2xl font-bold text-emerald-500">{approvalsLoading ? "—" : approvedCount}</p>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader className={cardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <History className="h-4 w-4" /> Rejected
                </CardTitle>
              </CardHeader>
              <CardContent className={cardContentClass}>
                <p className="text-2xl font-bold text-zinc-500">{approvalsLoading ? "—" : rejectedCount}</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Sector Management */}
        <motion.section variants={item}>
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Sector Management
              </CardTitle>
              <CardDescription className="text-zinc-400">Create new sectors. Optionally set sector_key (e.g. energy:coal).</CardDescription>
            </CardHeader>
            <CardContent className={cn(cardContentClass, "space-y-4")}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <Label htmlFor="sector-name" className={labelClass}>Sector name</Label>
                  <Input
                    id="sector-name"
                    value={sectorName}
                    onChange={(e) => setSectorName(e.target.value)}
                    placeholder="e.g. Electricity"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Label htmlFor="sector-key" className={labelClass}>Sector key (optional)</Label>
                  <Input
                    id="sector-key"
                    value={sectorKey}
                    onChange={(e) => setSectorKey(e.target.value)}
                    placeholder="e.g. energy:electricity"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => createSectorMutation.mutate()}
                    disabled={!sectorName.trim() || createSectorMutation.isPending}
                  >
                    {createSectorMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create sector
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-md border border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Name</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Key</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((s: SuperadminSector) => (
                      <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-zinc-200 text-sm py-3 px-4">{s.sector_name}</TableCell>
                        <TableCell className="text-zinc-400 font-mono text-sm py-3 px-4">{s.sector_key ?? "—"}</TableCell>
                        <TableCell className="text-zinc-500 text-sm py-3 px-4">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Create Sector Admin */}
        <motion.section variants={item}>
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5" /> Create Sector Admin
              </CardTitle>
              <CardDescription className="text-zinc-400">Add a Sector Admin user for a specific sector.</CardDescription>
            </CardHeader>
            <CardContent className={cardContentClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 min-w-0">
                  <Label className={labelClass}>Name</Label>
                  <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className={labelClass}>Email</Label>
                  <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="email@example.com" className={inputClass} />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className={labelClass}>Password</Label>
                  <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className={labelClass}>Sector</Label>
                  <Select value={adminSectorKey || undefined} onValueChange={setAdminSectorKey}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] max-h-[280px]">
                      {sectorGroups.flatMap((group) =>
                        group.sectors.map((s) => (
                          <SelectItem key={s.sectorKey} value={s.sectorKey}>
                            {group.label} – {s.displayName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="mt-4"
                onClick={() => createAdminMutation.mutate()}
                disabled={!adminName.trim() || !adminEmail.trim() || !adminPassword || !adminSectorKey || createAdminMutation.isPending}
              >
                {createAdminMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Sector Admin
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* Trigger email to sector */}
        <motion.section variants={item}>
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Mail className="h-5 w-5" /> Send sector email
              </CardTitle>
              <CardDescription className="text-zinc-400">Generate sector-specific LinkedIn draft and email recipients for the selected sector.</CardDescription>
            </CardHeader>
            <CardContent className={cn(cardContentClass, "flex flex-wrap items-end gap-4")}>
              <div className="space-y-2 w-full sm:min-w-[200px] flex-1 min-w-0">
                <Label className={labelClass}>Sector</Label>
                <Select value={emailSectorKey || undefined} onValueChange={setEmailSectorKey}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] max-h-[280px]">
                    {sectorGroups.flatMap((group) =>
                      group.sectors.map((s) => (
                        <SelectItem key={s.sectorKey} value={s.sectorKey}>
                          {group.label} – {s.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => sendEmailMutation.mutate()} disabled={!emailSectorKey || sendEmailMutation.isPending} className="w-full sm:w-auto">
                {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send email
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* LinkedIn post approvals & history */}
        <motion.section variants={item}>
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-zinc-100">LinkedIn post approvals</CardTitle>
              <CardDescription className="text-zinc-400">Filter by sector, commodity, or status. Total: {total}</CardDescription>
            </CardHeader>
            <CardContent className={cn(cardContentClass, "space-y-4")}>
              <div className="flex flex-wrap gap-2">
                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger className={cn(inputClass, "w-full sm:w-[180px]")}>
                    <SelectValue placeholder="All sectors" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value={ALL_FILTER}>All sectors</SelectItem>
                    {sectors.map((s: SuperadminSector) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.sector_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Commodity"
                  value={filterCommodity}
                  onChange={(e) => setFilterCommodity(e.target.value)}
                  className={cn(inputClass, "w-full sm:w-[140px]")}
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className={cn(inputClass, "w-full sm:w-[140px]")}>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value={ALL_FILTER}>All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto rounded-md border border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Sector</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Commodity</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Status</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Created</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Approved at</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 py-3 px-4">Approved by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row: AllApprovalRow) => (
                      <TableRow key={row.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-zinc-200 text-sm py-3 px-4">{row.sector_name ?? "—"}</TableCell>
                        <TableCell className="text-zinc-300 text-sm py-3 px-4">{row.commodity ?? "—"}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={
                              row.status === "approved"
                                ? "bg-emerald-900/50 text-emerald-400"
                                : row.status === "rejected"
                                  ? "bg-zinc-700 text-zinc-400"
                                  : "bg-amber-900/50 text-amber-400"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-500 text-sm py-3 px-4">{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-zinc-500 text-sm py-3 px-4">{row.approved_at ? new Date(row.approved_at).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-zinc-500 text-sm py-3 px-4">{row.approved_by ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </motion.div>
    </div>
  );
}
