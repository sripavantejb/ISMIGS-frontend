import { useState } from "react";
import { Link } from "react-router-dom";
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
  ClipboardList,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  adminPanelCardClass,
  adminPanelCardHeaderClass,
  adminPanelCardContentClass,
  adminPanelLabelClass,
  adminPanelInputClass,
  adminPanelTableWrapperClass,
  adminPanelTableRowClass,
  adminPanelTableHeadClass,
  adminPanelPageTitleClass,
  adminPanelPageSubtitleClass,
} from "@/lib/adminPanelStyles";
import { useToast } from "@/hooks/use-toast";
import { useSectorList } from "@/hooks/useSectorList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSuperadminSectors,
  fetchSectorsWithAdmins,
  createSector,
  createSectorAdmin,
  ensureSector,
  fetchAllApprovals,
  sendSuperadminSectorEmail,
  type SuperadminSector,
  type SectorWithAdminRow,
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

  const { data: sectorsWithAdmins = [], isLoading: sectorsWithAdminsLoading } = useQuery({
    queryKey: ["superadmin_sectors_with_admins"],
    queryFn: fetchSectorsWithAdmins,
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
      queryClient.invalidateQueries({ queryKey: ["superadmin_sectors_with_admins"] });
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
      queryClient.invalidateQueries({ queryKey: ["superadmin_sectors_with_admins"] });
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

  // Aliases for shared styles (keep in sync with adminPanelStyles)
  const cardClass = adminPanelCardClass;
  const cardHeaderClass = adminPanelCardHeaderClass;
  const cardContentClass = adminPanelCardContentClass;
  const labelClass = adminPanelLabelClass;
  const inputClass = adminPanelInputClass;

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 min-w-0 w-full">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
        {/* Page title */}
        <motion.section variants={item}>
          <h1 className={adminPanelPageTitleClass}>Overview</h1>
          <p className={adminPanelPageSubtitleClass}>Sectors, admins, and LinkedIn post approvals.</p>
        </motion.section>
        {/* Overview Stats */}
        <motion.section variants={item}>
          <h2 className="text-base font-semibold tracking-tight text-zinc-100 mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={adminPanelCardClass}>
              <CardHeader className={adminPanelCardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Sectors
                </CardTitle>
              </CardHeader>
              <CardContent className={adminPanelCardContentClass}>
                <p className="text-2xl font-bold text-zinc-100">{sectorsLoading ? "—" : sectors.length}</p>
              </CardContent>
            </Card>
            <Card className={adminPanelCardClass}>
              <CardHeader className={adminPanelCardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent className={adminPanelCardContentClass}>
                <p className="text-2xl font-bold text-amber-400">{approvalsLoading ? "—" : pendingCount}</p>
              </CardContent>
            </Card>
            <Card className={adminPanelCardClass}>
              <CardHeader className={adminPanelCardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Approved
                </CardTitle>
              </CardHeader>
              <CardContent className={adminPanelCardContentClass}>
                <p className="text-2xl font-bold text-emerald-500">{approvalsLoading ? "—" : approvedCount}</p>
              </CardContent>
            </Card>
            <Card className={adminPanelCardClass}>
              <CardHeader className={adminPanelCardHeaderClass}>
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <History className="h-4 w-4" /> Rejected
                </CardTitle>
              </CardHeader>
              <CardContent className={adminPanelCardContentClass}>
                <p className="text-2xl font-bold text-zinc-500">{approvalsLoading ? "—" : rejectedCount}</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Sector Management */}
        <motion.section variants={item}>
          <Card className={adminPanelCardClass}>
            <CardHeader className={adminPanelCardHeaderClass}>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Sector Management
              </CardTitle>
              <CardDescription className="text-zinc-400">Create new sectors. Optionally set sector_key (e.g. energy:coal).</CardDescription>
            </CardHeader>
            <CardContent className={cn(adminPanelCardContentClass, "space-y-4")}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <Label htmlFor="sector-name" className={adminPanelLabelClass}>Sector name</Label>
                  <Input
                    id="sector-name"
                    value={sectorName}
                    onChange={(e) => setSectorName(e.target.value)}
                    placeholder="e.g. Electricity"
                    className={adminPanelInputClass}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Label htmlFor="sector-key" className={adminPanelLabelClass}>Sector key (optional)</Label>
                  <Input
                    id="sector-key"
                    value={sectorKey}
                    onChange={(e) => setSectorKey(e.target.value)}
                    placeholder="e.g. energy:electricity"
                    className={adminPanelInputClass}
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
              <div className={adminPanelTableWrapperClass}>
                <Table>
                  <TableHeader>
                    <TableRow className={adminPanelTableRowClass}>
                      <TableHead className={adminPanelTableHeadClass}>Name</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Key</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((s: SuperadminSector) => (
                      <TableRow key={s.id} className={adminPanelTableRowClass}>
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
          <Card className={adminPanelCardClass}>
            <CardHeader className={adminPanelCardHeaderClass}>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5" /> Create Sector Admin
              </CardTitle>
              <CardDescription className="text-zinc-400">Add a Sector Admin user for a specific sector.</CardDescription>
            </CardHeader>
            <CardContent className={adminPanelCardContentClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 min-w-0">
                  <Label className={adminPanelLabelClass}>Name</Label>
                  <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Full name" className={adminPanelInputClass} />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className={adminPanelLabelClass}>Email</Label>
                  <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="email@example.com" className={adminPanelInputClass} />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className={adminPanelLabelClass}>Password</Label>
                  <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" className={adminPanelInputClass} />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className={adminPanelLabelClass}>Sector</Label>
                  <Select value={adminSectorKey || undefined} onValueChange={setAdminSectorKey}>
                    <SelectTrigger className={adminPanelInputClass}>
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

        {/* Created sectors & admin credentials */}
        <motion.section variants={item}>
          <Card className={adminPanelCardClass}>
            <CardHeader className={adminPanelCardHeaderClass}>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> Created sectors & admin credentials
              </CardTitle>
              <CardDescription className="text-zinc-400">
                All sectors and their sector admin login (email) and name. Passwords are not stored and cannot be shown.
              </CardDescription>
              <p className="text-sm text-zinc-400 mt-2">
                Sector admins sign in at the{" "}
                <Link to="/admin/login" className="text-primary hover:underline font-medium">Admin login</Link>
                {" "}page with their <strong className="text-zinc-300">email</strong> and <strong className="text-zinc-300">password</strong>; they are then redirected to the Sector approvals panel.
              </p>
            </CardHeader>
            <CardContent className={adminPanelCardContentClass}>
              <div className={adminPanelTableWrapperClass}>
                <Table>
                  <TableHeader>
                    <TableRow className={adminPanelTableRowClass}>
                      <TableHead className={adminPanelTableHeadClass}>Sector name</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Sector key</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Admin name</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Login (email / username)</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectorsWithAdminsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className={adminPanelTableRowClass}>
                          <TableCell className="py-3 px-4"><Skeleton className="h-8 w-36 bg-zinc-800" /></TableCell>
                          <TableCell className="py-3 px-4"><Skeleton className="h-6 w-20 rounded bg-zinc-800" /></TableCell>
                          <TableCell className="py-3 px-4"><Skeleton className="h-8 w-28 bg-zinc-800" /></TableCell>
                          <TableCell className="py-3 px-4"><Skeleton className="h-4 w-40 bg-zinc-800" /></TableCell>
                          <TableCell className="py-3 px-4"><Skeleton className="h-4 w-24 bg-zinc-800" /></TableCell>
                        </TableRow>
                      ))
                    ) : sectorsWithAdmins.length === 0 ? (
                      <TableRow className={adminPanelTableRowClass}>
                        <TableCell colSpan={5} className="text-zinc-500 text-sm py-6 text-center">
                          No sectors yet. Create sectors in Sector Management and assign admins above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (sectorsWithAdmins as SectorWithAdminRow[]).map((row) => (
                        <TableRow key={row.sector_id} className={adminPanelTableRowClass}>
                          <TableCell className="text-zinc-200 text-sm py-3 px-4 font-medium">{row.sector_name}</TableCell>
                          <TableCell className="text-zinc-400 font-mono text-sm py-3 px-4">{row.sector_key ?? "—"}</TableCell>
                          <TableCell className="text-zinc-200 text-sm py-3 px-4">{row.admin_name ?? "—"}</TableCell>
                          <TableCell className="text-zinc-300 text-sm py-3 px-4">{row.admin_email ?? "—"}</TableCell>
                          <TableCell className="text-zinc-500 text-sm py-3 px-4">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Trigger email to sector */}
        <motion.section variants={item}>
          <Card className={adminPanelCardClass}>
            <CardHeader className={adminPanelCardHeaderClass}>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Mail className="h-5 w-5" /> Send sector email
              </CardTitle>
              <CardDescription className="text-zinc-400">Generate sector-specific LinkedIn draft and email recipients for the selected sector.</CardDescription>
            </CardHeader>
            <CardContent className={cn(adminPanelCardContentClass, "flex flex-wrap items-end gap-4")}>
              <div className="space-y-2 w-full sm:min-w-[200px] flex-1 min-w-0">
                <Label className={adminPanelLabelClass}>Sector</Label>
                <Select value={emailSectorKey || undefined} onValueChange={setEmailSectorKey}>
                  <SelectTrigger className={adminPanelInputClass}>
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
          <Card className={adminPanelCardClass}>
            <CardHeader className={adminPanelCardHeaderClass}>
              <CardTitle className="text-zinc-100">LinkedIn post approvals</CardTitle>
              <CardDescription className="text-zinc-400">Filter by sector, commodity, or status. Total: {total}</CardDescription>
            </CardHeader>
            <CardContent className={cn(adminPanelCardContentClass, "space-y-4")}>
              <div className="flex flex-wrap gap-2">
                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger className={cn(adminPanelInputClass, "w-full sm:w-[180px]")}>
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
                  className={cn(adminPanelInputClass, "w-full sm:w-[140px]")}
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className={cn(adminPanelInputClass, "w-full sm:w-[140px]")}>
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
              <div className={adminPanelTableWrapperClass}>
                <Table>
                  <TableHeader>
                    <TableRow className={adminPanelTableRowClass}>
                      <TableHead className={adminPanelTableHeadClass}>Sector</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Commodity</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Status</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Created</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Approved at</TableHead>
                      <TableHead className={adminPanelTableHeadClass}>Approved by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row: AllApprovalRow) => (
                      <TableRow key={row.id} className={adminPanelTableRowClass}>
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
