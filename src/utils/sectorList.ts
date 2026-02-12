/**
 * Sector list utilities for admin panel.
 * Stable keys: {type}:{slug} for custom, energy, wpi, iip, gva.
 */

import { WPI_MAJOR_GROUP_LIST, majorGroupNameToSlug } from "@/utils/wpiSlug";
import { IIP_CATEGORY_LIST } from "@/utils/iipSlug";
import { commodityNameToSlug } from "@/utils/energySlug";
import { gvaIndustryToSlug } from "@/utils/gvaSlug";

export const CUSTOM_SECTOR_LIST = [
  { displayName: "Agriculture", slug: "agriculture" },
  { displayName: "Manufacturing", slug: "manufacturing" },
  { displayName: "Freight transport", slug: "freight-transport" },
] as const;

export type SectorEntry = { sectorKey: string; displayName: string; type: "custom" | "energy" | "wpi" | "iip" | "gva" };

export function getCustomSectors(): SectorEntry[] {
  return CUSTOM_SECTOR_LIST.map(({ displayName, slug }) => ({
    sectorKey: `custom:${slug}`,
    displayName,
    type: "custom",
  }));
}

export function getWpiSectors(): SectorEntry[] {
  return WPI_MAJOR_GROUP_LIST.map((name) => ({
    sectorKey: `wpi:${majorGroupNameToSlug(name)}`,
    displayName: name,
    type: "wpi",
  }));
}

export function getIipSectors(): SectorEntry[] {
  return IIP_CATEGORY_LIST.map((c) => ({
    sectorKey: `iip:${c.slug}`,
    displayName: c.displayName,
    type: "iip",
  }));
}

export function getEnergySectors(commodityNames: string[]): SectorEntry[] {
  return commodityNames.map((name) => ({
    sectorKey: `energy:${commodityNameToSlug(name)}`,
    displayName: name,
    type: "energy",
  }));
}

export function getGvaSectors(industryNames: string[]): SectorEntry[] {
  return industryNames.map((name) => ({
    sectorKey: `gva:${gvaIndustryToSlug(name)}`,
    displayName: name,
    type: "gva",
  }));
}
