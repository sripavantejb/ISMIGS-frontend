/**
 * URL slug utilities for GVA industry sub-pages.
 */

/**
 * Normalize industry name to URL-safe slug: lowercase, spaces → hyphens.
 */
export function gvaIndustryToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[,&]/g, "")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Resolve URL slug back to the exact industry name from the list.
 */
export function resolveGvaIndustryFromSlug(
  slug: string,
  industryList: string[]
): string | null {
  if (!slug || !industryList.length) return null;
  const normalized = slug.trim().toLowerCase();
  const found = industryList.find(
    (name) => gvaIndustryToSlug(name) === normalized
  );
  return found ?? null;
}

/**
 * Short label for sidebar to avoid overflow (first 24 chars + … if longer).
 */
export function gvaIndustrySidebarLabel(name: string, maxLen = 24): string {
  const t = name.trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen).trim() + "…";
}
