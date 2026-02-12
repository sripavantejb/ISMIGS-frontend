/**
 * URL slug utilities for WPI major group sub-pages.
 */

/** Display names for sidebar and pages. "Overall" maps to Wholesale Price Index in data. */
export const WPI_MAJOR_GROUP_LIST = [
  "Overall",
  "Primary articles",
  "Fuel & power",
  "Manufactured products",
] as const;

export type WpiMajorGroupName = (typeof WPI_MAJOR_GROUP_LIST)[number];

/**
 * Normalize major group name to URL-safe slug.
 * "Overall" -> "overall", "Primary articles" -> "primary-articles", "Fuel & power" -> "fuel-power".
 */
export function majorGroupNameToSlug(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (trimmed === "overall") return "overall";
  return trimmed
    .replace(/\s+/g, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Resolve URL slug back to display name from the list.
 * "overall" -> "Overall", "primary-articles" -> "Primary articles".
 * Returns null if slug does not match any known major group.
 */
export function resolveMajorGroupFromSlug(
  slug: string,
  list: readonly string[] = WPI_MAJOR_GROUP_LIST
): string | null {
  if (!slug || !slug.trim()) return null;
  const normalized = slug.trim().toLowerCase();
  const found = list.find(
    (name) => majorGroupNameToSlug(name) === normalized
  );
  return found ?? null;
}

/**
 * Map sidebar display name to API majorgroup value for filtering.
 * "Overall" -> "Wholesale Price Index" (or no filter for all data).
 */
export function majorGroupDisplayToApiValue(displayName: string): string | null {
  if (displayName === "Overall") return "Wholesale Price Index";
  return displayName;
}
