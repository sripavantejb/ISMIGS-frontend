import { Navigate, useLocation } from "react-router-dom";
import { useSector } from "@/contexts/SectorContext";

/**
 * Guards routes so Agriculture sector only shows agriculture pages,
 * and Energy sector only shows energy/macro pages.
 * Redirects to the correct panel when sector and path don't match.
 */
export function SectorRouteGuard({ children }: { children: React.ReactNode }) {
  const { sector } = useSector();
  const { pathname } = useLocation();

  // Admin routes - allow both sectors
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  // Farmers redirect - goes to agriculture
  if (pathname.startsWith("/farmers")) {
    return <>{children}</>;
  }

  if (sector === "agriculture") {
    // Agriculture panel: only allow /agriculture/*
    if (pathname.startsWith("/agriculture")) {
      return <>{children}</>;
    }
    // Redirect energy/macro paths to agriculture panel
    return <Navigate to="/agriculture" replace />;
  }

  if (sector === "energy") {
    // Energy panel: allow /, /energy, /wpi, /iip, /gva, /risk-intelligence, /gdp
    if (
      pathname === "/" ||
      pathname.startsWith("/energy") ||
      pathname.startsWith("/wpi") ||
      pathname.startsWith("/iip") ||
      pathname.startsWith("/gva") ||
      pathname.startsWith("/risk-intelligence") ||
      pathname.startsWith("/gdp") ||
      pathname.startsWith("/cpi-map") ||
      pathname.startsWith("/cpi-outlook")
    ) {
      return <>{children}</>;
    }
    // Redirect agriculture paths to energy panel
    if (pathname.startsWith("/agriculture")) {
      return <Navigate to="/energy" replace />;
    }
  }

  return <>{children}</>;
}
