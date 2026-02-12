/**
 * URL slug and category mapping for IIP (Index of Industrial Production) sub-pages.
 * Maps sidebar display names to API type/category for filtering.
 */

export interface IIPCategoryConfig {
  displayName: string;
  /** Short label for sidebar to avoid overflow */
  sidebarLabel: string;
  slug: string;
  type: string;
  category: string;
}

/** Main IIP views for sidebar: General, Sectoral (Mining, Manufacturing, Electricity), Use-based. */
export const IIP_CATEGORY_LIST: IIPCategoryConfig[] = [
  { displayName: "General", sidebarLabel: "General", slug: "general", type: "General", category: "General" },
  { displayName: "Mining", sidebarLabel: "Mining", slug: "mining", type: "Sectoral", category: "Mining" },
  { displayName: "Manufacturing", sidebarLabel: "Manufacturing", slug: "manufacturing", type: "Sectoral", category: "Manufacturing" },
  { displayName: "Electricity", sidebarLabel: "Electricity", slug: "electricity", type: "Sectoral", category: "Electricity" },
  { displayName: "Use-based: Primary goods", sidebarLabel: "Primary goods", slug: "primary-goods", type: "Use-based category", category: "Primary goods" },
  { displayName: "Use-based: Capital goods", sidebarLabel: "Capital goods", slug: "capital-goods", type: "Use-based category", category: "Capital goods" },
  { displayName: "Use-based: Intermediate goods", sidebarLabel: "Intermediate", slug: "intermediate-goods", type: "Use-based category", category: "Intermediate goods" },
  { displayName: "Use-based: Infrastructure", sidebarLabel: "Infrastructure", slug: "infrastructure", type: "Use-based category", category: "Infrastructure/Construction goods" },
  { displayName: "Use-based: Consumer durables", sidebarLabel: "Consumer durables", slug: "consumer-durables", type: "Use-based category", category: "Consumer durables" },
  { displayName: "Use-based: Consumer non-durables", sidebarLabel: "Consumer non-durables", slug: "consumer-non-durables", type: "Use-based category", category: "Consumer non-durables" },
];

/** Display names only, for sidebar list (same order as config). */
export const IIP_SIDEBAR_DISPLAY_NAMES = IIP_CATEGORY_LIST.map((c) => c.displayName);

/**
 * Normalize display name or category to URL-safe slug.
 */
export function iipCategoryToSlug(displayName: string): string {
  const config = IIP_CATEGORY_LIST.find(
    (c) => c.displayName.toLowerCase() === displayName.toLowerCase()
  );
  return config?.slug ?? displayName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Resolve URL slug to category config. Returns null if slug not found.
 */
export function resolveIIPCategoryFromSlug(slug: string): IIPCategoryConfig | null {
  if (!slug?.trim()) return null;
  const normalized = slug.trim().toLowerCase();
  return IIP_CATEGORY_LIST.find((c) => c.slug === normalized) ?? null;
}

/**
 * Get (type, category) for API filtering from slug.
 */
export function iipSlugToApiFilter(slug: string): { type: string; category: string } | null {
  const config = resolveIIPCategoryFromSlug(slug);
  return config ? { type: config.type, category: config.category } : null;
}
