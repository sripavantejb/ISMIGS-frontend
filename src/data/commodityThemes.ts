/**
 * Commodity-specific themes for the Energy hero: accent, gradient, and particle color.
 */

export interface CommodityTheme {
  /** CSS color for accents (borders, highlights) */
  accent: string;
  /** CSS gradient for hero background (e.g. "linear-gradient(...)") */
  gradient: string;
  /** RGB tuple [r,g,b] for particle/canvas effects (0-255) */
  particleColor: [number, number, number];
}

const THEMES: Record<string, CommodityTheme> = {
  Coal: {
    accent: "hsl(25 70% 45%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(25 40% 12%) 40%, hsl(222 44% 10%) 100%)",
    particleColor: [180, 100, 60],
  },
  "Crude Oil": {
    accent: "hsl(35 60% 40%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(35 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [140, 90, 40],
  },
  "Crude oil": {
    accent: "hsl(35 60% 40%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(35 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [140, 90, 40],
  },
  Electricity: {
    accent: "hsl(199 90% 55%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(199 50% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [0, 200, 255],
  },
  "Natural Gas": {
    accent: "hsl(160 60% 45%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(160 30% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [80, 220, 160],
  },
  "Natural gas": {
    accent: "hsl(160 60% 45%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(160 30% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [80, 220, 160],
  },
  "Petroleum products": {
    accent: "hsl(45 70% 48%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(45 40% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [220, 180, 80],
  },
  "Petroleum Products": {
    accent: "hsl(45 70% 48%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(45 40% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [220, 180, 80],
  },
  "Oil Products": {
    accent: "hsl(45 70% 48%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(45 40% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [220, 180, 80],
  },
  "Nuclear energy": {
    accent: "hsl(280 60% 55%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(280 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [180, 120, 255],
  },
  "Nuclear Energy": {
    accent: "hsl(280 60% 55%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(280 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [180, 120, 255],
  },
  "Hydro power": {
    accent: "hsl(199 80% 50%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(199 45% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [60, 160, 255],
  },
  "Hydro Power": {
    accent: "hsl(199 80% 50%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(199 45% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [60, 160, 255],
  },
  Hydro: {
    accent: "hsl(199 80% 50%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(199 45% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [60, 160, 255],
  },
  Solar: {
    accent: "hsl(38 95% 55%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(38 50% 16%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [255, 200, 80],
  },
  Wind: {
    accent: "hsl(170 70% 50%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(170 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [100, 230, 200],
  },
  Lignite: {
    accent: "hsl(30 55% 42%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(30 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [160, 110, 50],
  },
  "Renewable energy": {
    accent: "hsl(142 70% 45%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(142 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [80, 220, 140],
  },
  "Renewable Energy": {
    accent: "hsl(142 70% 45%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(142 35% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [80, 220, 140],
  },
  Total: {
    accent: "hsl(215 25% 55%)",
    gradient:
      "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(215 30% 14%) 50%, hsl(222 44% 10%) 100%)",
    particleColor: [120, 160, 220],
  },
};

const DEFAULT_THEME: CommodityTheme = {
  accent: "hsl(187 92% 50%)",
  gradient:
    "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(187 40% 14%) 50%, hsl(222 44% 10%) 100%)",
  particleColor: [0, 200, 255],
};

/**
 * Get theme for a commodity name. Falls back to default if not mapped.
 */
export function getCommodityTheme(commodityName: string | null | undefined): CommodityTheme {
  if (!commodityName?.trim()) return DEFAULT_THEME;
  return THEMES[commodityName] ?? DEFAULT_THEME;
}
