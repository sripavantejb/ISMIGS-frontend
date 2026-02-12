import { useMemo } from "react";
import { useGVADetailed } from "./useMacroData";
import { normalizeGvaRows } from "@/utils/gvaLogic";

/**
 * Returns sorted list of GVA industry names from the detailed NAS API.
 * Used by the sidebar to render GVA sub-items.
 */
export function useGVAIndustryList(): string[] {
  const { data: raw } = useGVADetailed();

  return useMemo(() => {
    if (!raw || !Array.isArray(raw)) return [];
    const rows = normalizeGvaRows(raw as Record<string, unknown>[]);
    const set = new Set<string>();
    rows.forEach((r) => r.industry && set.add(r.industry));
    return Array.from(set).sort();
  }, [raw]);
}
