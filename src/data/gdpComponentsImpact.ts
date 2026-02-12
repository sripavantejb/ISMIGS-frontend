/**
 * GDP components for "Sectors affected" cards.
 * seriesKey maps to real series: gva, tax, gdp, or proxy (GDP growth as proxy).
 * Impact text is derived from analytics in the page, not static message.
 */

export type GDPSeriesKey = "gva" | "tax" | "gdp" | "proxy";

export interface GDPComponentImpact {
  name: string;
  seriesKey: GDPSeriesKey;
}

export const GDP_COMPONENTS_IMPACT: GDPComponentImpact[] = [
  { name: "GVA", seriesKey: "gva" },
  { name: "Net Taxes", seriesKey: "tax" },
  { name: "Household consumption", seriesKey: "proxy" },
  { name: "Government consumption", seriesKey: "proxy" },
  { name: "Investment", seriesKey: "proxy" },
  { name: "Net exports", seriesKey: "proxy" },
];
