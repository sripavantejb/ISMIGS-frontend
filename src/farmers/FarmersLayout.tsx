import { useLocation, Outlet } from "react-router-dom";
import { AgricultureSectionHero } from "@/components/AgricultureSectionHero";

const AGRICULTURE_SECTIONS: Record<string, { name: string; subtitle: string }> = {
  "/agriculture": {
    name: "Dashboard",
    subtitle: "Your farming dashboard: weather, tools, and quick estimates",
  },
  "/agriculture/profile": {
    name: "Farm Profile",
    subtitle: "Set your location, land, crops, and irrigation",
  },
  "/agriculture/costs": {
    name: "Cultivation cost calculator (AI)",
    subtitle: "Track fertilizer, diesel, and input prices",
  },
  "/agriculture/profitability": {
    name: "Crop Profitability",
    subtitle: "Compare crop returns by state and cultivation cost",
  },
  "/agriculture/loans": {
    name: "Loans",
    subtitle: "Loan estimator and bank comparison",
  },
  "/agriculture/rural-prices": {
    name: "Rural prices map",
    subtitle: "MSP and mandi prices by crop and state",
  },
  "/agriculture/schemes": {
    name: "Government schemes",
    subtitle: "Central and state schemes",
  },
  "/agriculture/market-prices": {
    name: "Market prices",
    subtitle: "MSP and live market prices",
  },
  "/agriculture/water-irrigation": {
    name: "Water & irrigation",
    subtitle: "Daily water need and rain forecast",
  },
  "/agriculture/alerts": {
    name: "Alerts",
    subtitle: "Early warnings and price alerts",
  },
  "/agriculture/experts": {
    name: "Expert consultation",
    subtitle: "Book 1:1 sessions with agronomists",
  },
  "/agriculture/crop-recommendation": {
    name: "Crop recommendation",
    subtitle: "Smart crop suggestions by state and season",
  },
  "/agriculture/crop-doctor": {
    name: "AI Crop Doctor",
    subtitle: "Upload a photo of diseased crop for AI-assisted diagnosis and treatment",
  },
};

const DEFAULT_SECTION = {
  name: "Agriculture",
  subtitle: "Your farming dashboard",
};

export default function FarmersLayout() {
  const { pathname } = useLocation();
  const section = AGRICULTURE_SECTIONS[pathname] ?? DEFAULT_SECTION;

  return (
    <div className="flex flex-col min-h-full min-w-0 overflow-x-hidden" data-sector="agriculture">
      <div className="shrink-0 px-4 sm:px-6 py-4">
        <AgricultureSectionHero sectionName={section.name} subtitle={section.subtitle} />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
