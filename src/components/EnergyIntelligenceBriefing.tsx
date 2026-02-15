import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  HelpCircle,
  Building2,
  User,
  AlertTriangle,
  Lightbulb,
  Zap,
  Factory,
  Box,
  Train,
  Truck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useOpenAI, type SectorData } from "@/hooks/useOpenAI";
import { parseEnergyBriefing, parseSectorsMostAffected } from "@/utils/parseEnergyBriefing";
import { Skeleton } from "@/components/ui/skeleton";

interface EnergyIntelligenceBriefingProps {
  sectorName: string;
  context: SectorData;
}

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Key Trend": TrendingUp,
  "Why This Is Happening": HelpCircle,
  "Sectors Most Affected": Building2,
  "What This Means for You": User,
  "Risk Assessment": AlertTriangle,
  "Policy Insight": Lightbulb,
};

const SECTOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Power: Zap,
  Industry: Factory,
  Steel: Box,
  Cement: Building2,
  Rail: Train,
  Transport: Truck,
};

function getIcon(title: string) {
  const key = Object.keys(SECTION_ICONS).find((k) => title.includes(k));
  return key ? SECTION_ICONS[key] : TrendingUp;
}

function getSectorIcon(sectorName: string) {
  return SECTOR_ICONS[sectorName] ?? Building2;
}

const NUMBER_PREFIX = /^\s*\d+[.)]\s*/;

function renderSectionContent(content: string) {
  const lines = content.split(/\n/).filter((l) => l.trim());
  const items: string[] = [];
  for (const line of lines) {
    let trimmed = line.trim();
    trimmed = trimmed.replace(/^\-\s+/, "").replace(NUMBER_PREFIX, "");
    if (trimmed) items.push(trimmed);
  }
  if (items.length <= 1 && content.trim()) {
    const single = content.trim().replace(NUMBER_PREFIX, "").replace(/^\-\s+/, "");
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {single}
      </p>
    );
  }
  return (
    <ul className="list-none space-y-1.5 text-sm text-muted-foreground leading-relaxed pl-0">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-muted-foreground/70 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const CARD_CLASS = "rounded-xl border border-border/60 bg-card/50 overflow-hidden";

export function EnergyIntelligenceBriefing({ sectorName, context }: EnergyIntelligenceBriefingProps) {
  const { loading, error, summary, requestOutlook } = useOpenAI();
  const requestedKeyRef = useRef<string | null>(null);
  const [showFullBriefing, setShowFullBriefing] = useState(false);

  const contextKey = JSON.stringify(context);
  useEffect(() => {
    if (!sectorName) return;
    const key = `${sectorName}:${contextKey}`;
    if (requestedKeyRef.current === key) return;
    requestedKeyRef.current = key;
    requestOutlook({ sectorName, ...context });
  }, [sectorName, contextKey, requestOutlook]);

  const sections = summary ? parseEnergyBriefing(summary) : [];
  const mainSection = sections.find((s) => s.title.includes("What This Means for You"));
  const restSections = sections.filter(
    (s) =>
      !s.title.includes("What This Means for You") &&
      (s.title.includes("Key Trend") ||
        s.title.includes("Why This Is Happening") ||
        s.title.includes("Sectors Most Affected") ||
        s.title.includes("Risk Assessment") ||
        s.title.includes("Policy Insight"))
  );

  if (error) {
    return (
      <div className={`${CARD_CLASS} p-5`}>
        <h2 className="text-lg font-semibold text-foreground mb-2">Energy intelligence</h2>
        <p className="text-sm text-critical">
          {error.startsWith("Outlook generation is not configured") ||
          error.startsWith("OpenAI API key is invalid")
            ? error
            : `Error: ${error}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-foreground">Energy intelligence</h2>
      </div>

      {loading && !summary && (
        <div className="flex flex-col gap-4">
          <div className={CARD_CLASS}>
            <div className="flex gap-3 p-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full max-w-sm" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[85%]" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-4 w-24 mt-4 rounded" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-20 flex-1 rounded-xl" />
            <Skeleton className="h-20 w-1/4 rounded-xl" />
          </div>
        </div>
      )}

      {!loading && sections.length === 0 && summary && (
        <div className={`${CARD_CLASS} p-5`}>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {!loading && sections.length > 0 && (
        <>
          {/* Main card: What this means for you (first) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={CARD_CLASS}
          >
            <div className="flex gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  What this means for you
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  In plain language — how this energy type can affect your daily life and what to watch for.
                </p>
                {mainSection ? (
                  renderSectionContent(mainSection.content)
                ) : (
                  <p className="text-sm text-muted-foreground">Briefing is being prepared.</p>
                )}
                {restSections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFullBriefing((v) => !v)}
                    className="mt-4 text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {showFullBriefing ? (
                      <>
                        Read less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Expanded: full Energy Intelligence */}
          <AnimatePresence>
            {showFullBriefing && restSections.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                {restSections.map((section, index) => {
                  const isSectors = section.title.includes("Sectors Most Affected");
                  const sectorBlocks = isSectors ? parseSectorsMostAffected(section.content) : [];

                  if (isSectors && sectorBlocks.length > 0) {
                    return (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex flex-col gap-3"
                      >
                        <div className={`${CARD_CLASS} p-4`}>
                          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                            <Building2 className="h-4 w-4 text-primary" />
                            {section.title}
                          </h3>
                          <div className="flex flex-col gap-3">
                            {sectorBlocks.map((block) => {
                              const SectorIcon = getSectorIcon(block.sector);
                              return (
                                <div
                                  key={block.sector}
                                  className="rounded-lg border border-border/40 bg-card/30 p-3"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                      <SectorIcon className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-semibold text-foreground text-sm">
                                      {block.sector}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground leading-relaxed">
                                    {renderSectionContent(block.content)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  if (isSectors && sectorBlocks.length === 0) {
                    const Icon = getIcon(section.title);
                    return (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={CARD_CLASS}
                      >
                        <div className="flex gap-3 p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-foreground mb-2">
                              {section.title}
                            </h3>
                            {renderSectionContent(section.content)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  const Icon = getIcon(section.title);
                  return (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={CARD_CLASS}
                    >
                      <div className="flex gap-3 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-foreground mb-2">
                            {section.title}
                          </h3>
                          {renderSectionContent(section.content)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
