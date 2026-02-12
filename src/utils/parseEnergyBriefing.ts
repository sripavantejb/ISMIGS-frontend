/**
 * Parses the raw ENERGY INTELLIGENCE BRIEFING text into sections for UI display.
 */

export interface BriefingSection {
  title: string;
  content: string;
}

export interface SectorBlock {
  sector: string;
  emoji: string;
  content: string;
}

const SECTION_HEADERS = [
  "Key Trend",
  "Why This Is Happening",
  "Sectors Most Affected",
  "What This Means for You",
  "Risk Assessment",
  "Policy Insight",
];

const DASH_ONLY = /^[\s\-]+$/;
const COMMODITY_LINE = /^\s*Commodity\s*:\s*.+$/i;

function cleanSectionContent(text: string): string {
  if (!text || !text.trim()) return text;
  const lines = text.split("\n");
  const kept = lines.filter((line) => {
    const t = line.trim();
    if (!t) return false;
    if (DASH_ONLY.test(t)) return false;
    if (COMMODITY_LINE.test(t)) return false;
    return true;
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const SECTOR_PATTERNS: { name: string; emoji: string; re: RegExp }[] = [
  { name: "Power", emoji: "⚡", re: /Power\s*:/i },
  { name: "Industry", emoji: "🏭", re: /Industry\s*:/i },
  { name: "Steel", emoji: "🔩", re: /Steel\s*:/i },
  { name: "Cement", emoji: "🧱", re: /Cement\s*:/i },
  { name: "Rail", emoji: "🚂", re: /Rail\s*:/i },
  { name: "Transport", emoji: "🚛", re: /Transport\s*:/i },
];

export function parseSectorsMostAffected(content: string): SectorBlock[] {
  if (!content || !content.trim()) return [];
  const cleaned = cleanSectionContent(content);
  const blocks: SectorBlock[] = [];
  for (const { name, emoji, re } of SECTOR_PATTERNS) {
    const match = cleaned.match(re);
    if (!match) continue;
    const start = match.index! + match[0].length;
    let end = cleaned.length;
    for (const other of SECTOR_PATTERNS) {
      if (other.name === name) continue;
      const nextMatch = cleaned.slice(start).match(other.re);
      if (nextMatch) {
        const nextStart = start + nextMatch.index!;
        if (nextStart < end) end = nextStart;
      }
    }
    const sectorContent = cleaned.slice(start, end).trim();
    if (sectorContent) blocks.push({ sector: name, emoji, content: sectorContent });
  }
  return blocks;
}

/**
 * Split raw briefing text into sections by "• SectionName:" pattern.
 * Returns array of { title, content } for each section found.
 */
export function parseEnergyBriefing(raw: string): BriefingSection[] {
  if (!raw || !raw.trim()) return [];

  const sections: BriefingSection[] = [];
  const bulletPattern = /\n\s*•\s+/g;
  const parts = raw.split(bulletPattern).map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const firstLineEnd = part.indexOf("\n");
    const firstLine = firstLineEnd >= 0 ? part.slice(0, firstLineEnd) : part;
    const rest = firstLineEnd >= 0 ? part.slice(firstLineEnd).trim() : "";
    const title = firstLine.replace(/:$/, "").trim();
    const rawContent = rest || firstLine;
    const content = cleanSectionContent(rawContent);
    if (title && (SECTION_HEADERS.some((h) => title.includes(h)) || sections.length === 0)) {
      sections.push({
        title: title.length > 60 ? title.slice(0, 60) + "…" : title,
        content: content || title,
      });
    } else if (sections.length > 0) {
      sections[sections.length - 1].content += "\n\n" + cleanSectionContent(part);
    }
  }

  if (sections.length === 0 && raw.trim()) {
    sections.push({ title: "Summary", content: cleanSectionContent(raw.trim()) });
  }
  return sections;
}
