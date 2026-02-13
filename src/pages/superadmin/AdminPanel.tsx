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
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSuperadminSectors,
  createSector,
  createSectorAdmin,
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
  const [adminSectorId, setAdminSectorId] = useState("");
  const [filterSector, setFilterSector] = useState<string>("");
  const [filterCommodity, setFilterCommodity] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [emailSectorId, setEmailSectorId] = useState("");

  const { data: sectors = [], isLoading: sectorsLoading } = useQuery({
    queryKey: ["superadmin_sectors"],
    queryFn: fetchSuperadminSectors,
  });

  const { data: approvalsData, isLoading: approvalsLoading } = useQuery({
    queryKey: ["superadmin_approvals", filterSector, filterCommodity, filterStatus],
    queryFn: () =>
      fetchAllApprovals({
        limit: 100,
        sector_id: filterSector || undefined,
        commodity: filterCommodity || undefined,
        status: filterStatus || undefined,
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
    mutationFn: () =>
      createSectorAdmin({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        sector_id: adminSectorId,
      }),
    onSuccess: () => {
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminSectorId("");
      toast({ title: "Sector Admin created" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => sendSuperadminSectorEmail(emailSectorId),
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {/* Overview Stats */}
        <motion.section variants={item}>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Sectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zinc-100">{sectorsLoading ? "—" : sectors.length}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">{approvalsLoading ? "—" : pendingCount}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-500">{approvalsLoading ? "—" : approvedCount}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <History className="h-4 w-4" /> Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zinc-500">{approvalsLoading ? "—" : rejectedCount}</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Sector Management */}
        <motion.section variants={item}>
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Sector Management
              </CardTitle>
              <CardDescription>Create new sectors. Optionally set sector_key (e.g. energy:coal).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="sector-name">Sector name</Label>
                  <Input
                    id="sector-name"
                    value={sectorName}
                    onChange={(e) => setSectorName(e.target.value)}
                    placeholder="e.g. Electricity"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="sector-key">Sector key (optional)</Label>
                  <Input
                    id="sector-key"
                    value={sectorKey}
                    onChange={(e) => setSectorKey(e.target.value)}
                    placeholder="e.g. energy:electricity"
                    className="bg-zinc-800 border-zinc-700"
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Key</TableHead>
                      <TableHead className="text-zinc-400">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((s: SuperadminSector) => (
                      <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-zinc-200">{s.sector_name}</TableCell>
                        <TableCell className="text-zinc-400 font-mono text-sm">{s.sector_key ?? "—"}</TableCell>
                        <TableCell className="text-zinc-500 text-sm">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</TableCell>
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
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5" /> Create Sector Admin
              </CardTitle>
              <CardDescription>Add a Sector Admin user for a specific sector.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Full name" className="bg-zinc-800 border-zinc-700" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="email@example.com" className="bg-zinc-800 border-zinc-700" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" className="bg-zinc-800 border-zinc-700" />
                </div>
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Select value={adminSectorId} onValueChange={setAdminSectorId}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((s: SuperadminSector) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.sector_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="mt-4"
                onClick={() => createAdminMutation.mutate()}
                disabled={!adminName.trim() || !adminEmail.trim() || !adminPassword || !adminSectorId || createAdminMutation.isPending}
              >
                {createAdminMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Sector Admin
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* Trigger email to sector */}
        <motion.section variants={item}>
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Mail className="h-5 w-5" /> Send sector email
              </CardTitle>
              <CardDescription>Generate sector-specific LinkedIn draft and email recipients for the selected sector.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 min-w-[200px]">
                <Label>Sector</Label>
                <Select value={emailSectorId} onValueChange={setEmailSectorId}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s: SuperadminSector) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.sector_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => sendEmailMutation.mutate()} disabled={!emailSectorId || sendEmailMutation.isPending}>
                {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send email
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* LinkedIn post approvals & history */}
        <motion.section variants={item}>
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-zinc-100">LinkedIn post approvals</CardTitle>
              <CardDescription>Filter by sector, commodity, or status. Total: {total}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="All sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sectors</SelectItem>
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
                  className="w-[140px] bg-zinc-800 border-zinc-700"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
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
                      <TableHead className="text-zinc-400">Sector</TableHead>
                      <TableHead className="text-zinc-400">Commodity</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400">Created</TableHead>
                      <TableHead className="text-zinc-400">Approved at</TableHead>
                      <TableHead className="text-zinc-400">Approved by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row: AllApprovalRow) => (
                      <TableRow key={row.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-zinc-200">{row.sector_name ?? "—"}</TableCell>
                        <TableCell className="text-zinc-300">{row.commodity ?? "—"}</TableCell>
                        <TableCell>
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
                        <TableCell className="text-zinc-500 text-sm">{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-zinc-500 text-sm">{row.approved_at ? new Date(row.approved_at).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-zinc-500 text-sm">{row.approved_by ?? "—"}</TableCell>
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
