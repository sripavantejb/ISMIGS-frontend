import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation, useParams } from "react-router-dom";
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
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
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
import { SectorProvider } from "@/contexts/SectorContext";
import { SectorRouteGuard } from "@/components/SectorRouteGuard";
import { FarmersLayout, FarmersDashboard, FarmProfile, InputCosts, CropProfitability, Alerts, Loans, CropRecommendation, AICropDoctor, GovernmentSchemes, MarketPrices, WaterIrrigation, ExpertConsultation } from "@/farmers";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

function FarmersRedirect() {
  const { "*": splat } = useParams();
  const to = splat ? `/agriculture/${splat}` : "/agriculture";
  return <Navigate to={to} replace />;
}

function ChatbotWithContext() {
  const location = useLocation();
  
  // Build detailed context based on current page
  let context: string | undefined = undefined;
  
  if (location.pathname === "/" || location.pathname === "/dashboard") {
    context = "Overview page - Main dashboard with state-level energy data, GDP indicators, and macro-economic overview";
  } else if (location.pathname.startsWith("/energy")) {
    const commodityMatch = location.pathname.match(/\/energy\/(.+)/);
    const commodity = commodityMatch ? commodityMatch[1] : "general";
    context = `Energy Analytics page - ${commodity} analytics with production, consumption, imports, exports, and AI-powered predictions. Users can toggle between Past History and Predictions modes, and filter by Year and Sector.`;
  } else if (location.pathname.startsWith("/wpi")) {
    const groupMatch = location.pathname.match(/\/wpi\/(.+)/);
    const group = groupMatch ? groupMatch[1] : "overall";
    context = `Wholesale Inflation (WPI) page - ${group} major group analysis with inflation rates, forecasts, and AI-powered predictions. Users can toggle between Past History and Predictions modes, and filter by Year and Major Group.`;
  } else if (location.pathname.startsWith("/iip")) {
    const categoryMatch = location.pathname.match(/\/iip\/(.+)/);
    const category = categoryMatch ? categoryMatch[1] : "general";
    context = `Industrial Production (IIP) page - ${category} category analysis with index values, growth rates, and AI-powered predictions. Users can toggle between Past History and Predictions modes, and filter by Year and Category.`;
  } else if (location.pathname.startsWith("/gva")) {
    const industryMatch = location.pathname.match(/\/gva\/(.+)/);
    const industry = industryMatch ? industryMatch[1] : "all";
    context = `Sector-wise Economy (GVA) page - ${industry} industry analysis with Gross Value Added data, growth rates, and AI-powered predictions. Users can toggle between Past History and Predictions modes, and filter by Year and Industry.`;
  } else if (location.pathname === "/gdp") {
    context = "GDP and National Accounts page - GDP analytics with current and constant prices, growth rates, and AI-powered predictions. Users can toggle between Past History and Predictions modes, and filter by Fiscal Year.";
  } else if (location.pathname === "/cpi-map") {
    context = "Rural Prices Map page - Interactive map showing state-level CPI-AL and CPI-RL data with year-over-year inflation rates";
  } else if (location.pathname === "/cpi-outlook") {
    context = "Consumer Price Outlook page - AI-powered CPI outlook and analysis with inflation forecasts and state-wise comparisons";
  } else if (location.pathname === "/risk-intelligence") {
    context = "Risk Intelligence page - AI-powered risk assessment across economic indicators with sector-wise risk identification and mitigation recommendations";
  } else if (location.pathname.startsWith("/agriculture") || location.pathname.startsWith("/farmers")) {
    context = "Farmer Dashboard – farming, crops, weather, loans, and agriculture. Specialized dashboard for farmers with farm profile, input costs, crop profitability, energy impact, alerts, loans, crop recommendations, government schemes, market prices, water/irrigation data, and expert consultation";
  }
  
  return <ISMIGSChatbot context={context} />;
}



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
  if (resolved === null && !storedUser) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        <Skeleton className="w-64 shrink-0 rounded-r-xl" />
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }
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
  if (allowed === null) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        <Skeleton className="w-64 shrink-0 rounded-r-xl" />
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }
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
              <Route path="dashboard" element={<SuperAdminDashboard />} />
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
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={
            <SectorProvider>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <main className="scroll-area-main flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-auto">
                  <div className="flex items-center h-12 border-b border-border/30 px-4 bg-background sticky top-0 z-40 will-change-transform [transform:translateZ(0)] min-w-0 overflow-hidden">
                    <SidebarTrigger />
                    <span className="ml-3 text-xs text-muted-foreground font-mono uppercase tracking-widest truncate min-w-0">ISMIGS — India State Macro Intelligence</span>
                  </div>
                  <SectorRouteGuard>
                  <Routes>
                    <Route path="/farmers/*" element={<FarmersRedirect />} />
                    <Route path="/agriculture" element={<FarmersLayout />}>
                      <Route index element={<FarmersDashboard />} />
                      <Route path="profile" element={<FarmProfile />} />
                      <Route path="costs" element={<InputCosts />} />
                      <Route path="profitability" element={<CropProfitability />} />
                      <Route path="alerts" element={<Alerts />} />
                      <Route path="rural-prices" element={<CPIMap />} />
                      <Route path="loans" element={<Loans />} />
                      <Route path="crop-recommendation" element={<CropRecommendation />} />
                      <Route path="crop-doctor" element={<AICropDoctor />} />
                      <Route path="schemes" element={<GovernmentSchemes />} />
                      <Route path="market-prices" element={<MarketPrices />} />
                      <Route path="water-irrigation" element={<WaterIrrigation />} />
                      <Route path="experts" element={<ExpertConsultation />} />
                    </Route>
                    <Route path="/dashboard" element={<Overview />} />
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
                  </SectorRouteGuard>
                </main>
              </div>
              <ChatbotWithContext />
            </SidebarProvider>
            </SectorProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;





