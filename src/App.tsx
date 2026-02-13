import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Overview from "./pages/Overview";
import EnergyMap from "./pages/EnergyMap";
import EnergyAnalytics from "./pages/EnergyAnalytics";
import IndustrialProduction from "./pages/IndustrialProduction";
import InflationWPI from "./pages/InflationWPI";
import GDPNationalAccounts from "./pages/GDPNationalAccounts";
import GVAPage from "./pages/GVAPage";
import PredictionsPage from "./pages/PredictionsPage";
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
import { getStoredToken } from "./services/adminApi";

const queryClient = new QueryClient();

function AdminGuard() {
  const token = getStoredToken();
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
                <Route path="/energy-map" element={<EnergyMap />} />
                <Route path="/energy/:commoditySlug?" element={<EnergyAnalytics />} />
                <Route path="/iip/:categorySlug?" element={<IndustrialProduction />} />
                <Route path="/wpi/:majorGroupSlug?" element={<InflationWPI />} />
                <Route path="/gdp" element={<GDPNationalAccounts />} />
                <Route path="/gva/:industrySlug?" element={<GVAPage />} />
                <Route path="/predictions" element={<PredictionsPage />} />
                <Route path="/cpi-map" element={<CPIMap />} />
                <Route path="/cpi-outlook" element={<CPIOutlook />} />
                <Route path="/risk-intelligence" element={<RiskIntelligence />} />
                <Route path="/explorer" element={<ComingSoon title="Data Explorer" />} />
                <Route path="/admin" element={<Outlet />}>
                  <Route path="login" element={<AdminLogin />} />
                  <Route element={<AdminGuard />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route element={<AdminLayout />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="sectors" element={<AdminSectors />} />
                      <Route path="logs" element={<AdminEmailLogs />} />
                      <Route path="digest" element={<AdminDigest />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;





