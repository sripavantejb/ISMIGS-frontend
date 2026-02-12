import { useMemo } from "react";
import { useEnergyCommodityList } from "@/hooks/useEnergyCommodityList";
import { useGVAIndustryList } from "@/hooks/useGVAIndustryList";
import {
  getCustomSectors,
  getEnergySectors,
  getWpiSectors,
  getIipSectors,
  getGvaSectors,
  type SectorEntry,
} from "@/utils/sectorList";

export type SectorGroup = {
  label: string;
  type: "custom" | "energy" | "wpi" | "iip" | "gva";
  sectors: SectorEntry[];
};

/**
 * Builds the full sector list from constants and API-backed hooks (energy, GVA).
 * Used by the admin panel to show all sectors that can have email recipients.
 */
export function useSectorList(): SectorGroup[] {
  const commodityList = useEnergyCommodityList();
  const gvaIndustryList = useGVAIndustryList();

  return useMemo(() => {
    const custom = getCustomSectors();
    const energy = getEnergySectors(commodityList);
    const wpi = getWpiSectors();
    const iip = getIipSectors();
    const gva = getGvaSectors(gvaIndustryList);

    return [
      { label: "Custom", type: "custom", sectors: custom },
      { label: "Energy", type: "energy", sectors: energy },
      { label: "Inflation (WPI)", type: "wpi", sectors: wpi },
      { label: "Industrial (IIP)", type: "iip", sectors: iip },
      { label: "GVA", type: "gva", sectors: gva },
    ];
  }, [commodityList, gvaIndustryList]);
}
