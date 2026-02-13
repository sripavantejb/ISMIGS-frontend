import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Overview from "./pages/Overview";
// import EnergyMap from "./pages/EnergyMap";
import EnergyAnalytics from "./pages/EnergyAnalytics";
import IndustrialProduction from "./pages/IndustrialProduction";
import InflationWPI from "./pages/InflationWPI";
import GDPNationalAccounts from "./pages/GDPNationalAccounts";
import GVAPage from "./pages/GVAPage";
// import PredictionsPage from "./pages/PredictionsPage";
import CPIMap from "./pages/CPIMap";
import CPIOutlook from "./pages/CPIOutlook";
import RiskIntelligence from "./pages/RiskIntelligence";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSectors from "./pages/admin/AdminSectors";
import AdminEmailLogs from "./pages/admin/AdminEmailLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDigest from "./pages/admin/AdminDigest";
import AdminDecision from "./pages/admin/AdminDecision";
import AdminSectorAlerts from "./pages/admin/AdminSectorAlerts";
import SectorLayout from "./pages/sector/SectorLayout";
import SectorApprovals from "./pages/sector/SectorApprovals";
import AdminPanelLayout from "./pages/superadmin/AdminPanelLayout";
import AdminPanel from "./pages/superadmin/AdminPanel";
import Notifications from "./pages/superadmin/Notifications";
import { useState, useEffect } from "react";
import { getStoredToken, getStoredUser, setStoredUser, fetchMe } from "./services/adminApi";
import { getStoredSectorToken, setStoredSectorToken } from "./services/sectorApi";
import ISMIGSChatbot from "@/chatbot/ISMIGSChatbot";

const queryClient = new QueryClient();

function AdminGuard() {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  const [resolved, setResolved] = useState<boolean | null>(storedUser ? true : null);

  useEffect(() => {
    if (!token) return;
    if (storedUser?.role === "SECTOR_ADMIN") {
      setStoredSectorToken(token);
      setResolved(false);
      return;
    }
    if (storedUser) {
      setResolved(true);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((res: { user?: string | { id: string; name?: string; email?: string; role?: string; sector_id?: string }; role?: string }) => {
        if (cancelled) return;
        const role = res.role ?? (res.user && typeof res.user === "object" ? res.user.role : null);
        const user = res.user && typeof res.user === "object" ? res.user : null;
        if (role === "SECTOR_ADMIN") {
          setStoredSectorToken(token);
          setStoredUser({ id: user?.id ?? "", name: user?.name, email: user?.email, role: "SECTOR_ADMIN", sector_id: user?.sector_id });
          setResolved(false);
        } else {
          if (user) setStoredUser({ id: user.id, name: user.name, email: user.email, role: (user.role as "SUPER_ADMIN" | "SECTOR_ADMIN") || "SUPER_ADMIN", sector_id: user.sector_id });
          setResolved(true);
        }
      })
      .catch(() => {
        if (!cancelled) setResolved(true);
      });
    return () => { cancelled = true; };
  }, [token, storedUser?.role, storedUser]);

  if (!token) return <Navigate to="/admin/login" replace />;
  if (storedUser?.role === "SECTOR_ADMIN" || resolved === false) return <Navigate to="/sector/approvals" replace />;
  if (resolved === null && !storedUser) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  return <Outlet />;
}

function SectorGuard() {
  const token = getStoredSectorToken();
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

function SuperAdminGuard() {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setAllowed(false);
      return;
    }
    if (storedUser?.role === "SUPER_ADMIN") {
      setAllowed(true);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((res: { user?: string | { id: string; role?: string }; role?: string }) => {
        if (cancelled) return;
        const isSuperAdmin =
          res.role === "SUPER_ADMIN" ||
          (res.user && typeof res.user === "object" && res.user.role === "SUPER_ADMIN") ||
          res.user === "admin";
        if (isSuperAdmin) {
          if (res.user && typeof res.user === "object") {
            const u = res.user as { id: string; name?: string; email?: string; role?: string; sector_id?: string };
            setStoredUser({ id: u.id, name: u.name, email: u.email, role: (u.role as "SUPER_ADMIN" | "SECTOR_ADMIN") || "SUPER_ADMIN", sector_id: u.sector_id });
          } else setStoredUser({ id: "admin", role: "SUPER_ADMIN" });
          setAllowed(true);
        } else setAllowed(false);
      })
      .catch(() => {
        if (!cancelled) setAllowed(false);
      });
    return () => { cancelled = true; };
  }, [token, storedUser?.role]);

  if (!token) return <Navigate to="/admin/login" replace />;
  if (allowed === null) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!allowed) return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/admin-panel" element={<SuperAdminGuard />}>
            <Route element={<AdminPanelLayout />}>
              <Route index element={<AdminPanel />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="sectors" element={<AdminSectors />} />
              <Route path="logs" element={<AdminEmailLogs />} />
              <Route path="alerts" element={<AdminSectorAlerts />} />
              <Route path="digest" element={<AdminDigest />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
          <Route path="/sector" element={<Outlet />}>
            <Route path="login" element={<Navigate to="/admin/login" replace />} />
            <Route element={<SectorGuard />}>
              <Route element={<SectorLayout />}>
                <Route path="approvals" element={<SectorApprovals />} />
              </Route>
            </Route>
            <Route index element={<Navigate to="/sector/approvals" replace />} />
          </Route>
          <Route path="*" element={
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                  <div className="flex items-center h-12 border-b border-border/30 px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
                    <SidebarTrigger />
                    <span className="ml-3 text-xs text-muted-foreground font-mono uppercase tracking-widest">ISMIGS — India State Macro Intelligence</span>
                  </div>
                  <Routes>
                    <Route path="/" element={<Overview />} />
                {/* <Route path="/energy-map" element={<EnergyMap />} /> */}
                <Route path="/energy/:commoditySlug?" element={<EnergyAnalytics />} />
                <Route path="/iip/:categorySlug?" element={<IndustrialProduction />} />
                <Route path="/wpi/:majorGroupSlug?" element={<InflationWPI />} />
                <Route path="/gdp" element={<GDPNationalAccounts />} />
                <Route path="/gva/:industrySlug?" element={<GVAPage />} />
                {/* <Route path="/predictions" element={<PredictionsPage />} /> */}
                <Route path="/cpi-map" element={<CPIMap />} />
                <Route path="/cpi-outlook" element={<CPIOutlook />} />
                <Route path="/risk-intelligence" element={<RiskIntelligence />} />
                {/* <Route path="/explorer" element={<ComingSoon title="Data Explorer" />} /> */}
                <Route path="/admin" element={<Outlet />}>
                  <Route path="decision" element={<AdminDecision />} />
                  <Route path="login" element={<AdminLogin />} />
                  <Route element={<AdminGuard />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route element={<AdminLayout />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="sectors" element={<AdminSectors />} />
                      <Route path="logs" element={<AdminEmailLogs />} />
                      <Route path="alerts" element={<AdminSectorAlerts />} />
                      <Route path="digest" element={<AdminDigest />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                  </Route>
                </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
              <ISMIGSChatbot />
            </SidebarProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;





