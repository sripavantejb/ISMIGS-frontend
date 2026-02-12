/**
 * URL slug utilities for energy commodity sub-pages.
 */

/**
 * Normalize commodity name to URL-safe slug: lowercase, spaces → hyphens.
 */
export function commodityNameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Resolve URL slug back to the exact API commodity name from the list.
 * Returns null if no match (e.g. invalid or deleted commodity).
 */
export function resolveCommodityFromSlug(
  slug: string,
  commodityList: string[]
): string | null {
  if (!slug || !commodityList.length) return null;
  const normalized = slug.trim().toLowerCase();
  const found = commodityList.find(
    (name) => commodityNameToSlug(name) === normalized
  );
  return found ?? null;
}
