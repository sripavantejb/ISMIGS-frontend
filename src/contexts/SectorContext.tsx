import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SECTOR_STORAGE_KEY = "ismigs-sidebar-sector";

export type Sector = "agriculture" | "energy";

function getStoredSector(): Sector | null {
  try {
    const v = localStorage.getItem(SECTOR_STORAGE_KEY);
    if (v === "agriculture" || v === "energy") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function setStoredSector(s: Sector) {
  try {
    localStorage.setItem(SECTOR_STORAGE_KEY, s);
  } catch {
    /* ignore */
  }
}

type SectorContextValue = {
  sector: Sector;
  setSector: (s: Sector) => void;
};

const SectorContext = createContext<SectorContextValue | null>(null);

function deriveSectorFromPath(pathname: string): Sector {
  return pathname.startsWith("/agriculture") ? "agriculture" : "energy";
}

export function SectorProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sector, setSectorState] = useState<Sector>(() => {
    const stored = getStoredSector();
    if (stored) return stored;
    return deriveSectorFromPath(location.pathname);
  });

  const setSector = useCallback((s: Sector) => {
    setSectorState(s);
    setStoredSector(s);
  }, []);

  useEffect(() => {
    const stored = getStoredSector();
    if (!stored) {
      const derived = deriveSectorFromPath(location.pathname);
      setSectorState(derived);
      setStoredSector(derived);
    }
  }, [location.pathname]);

  const value: SectorContextValue = { sector, setSector };

  return <SectorContext.Provider value={value}>{children}</SectorContext.Provider>;
}

export function useSector(): SectorContextValue {
  const ctx = useContext(SectorContext);
  if (!ctx) {
    throw new Error("useSector must be used within SectorProvider");
  }
  return ctx;
}
