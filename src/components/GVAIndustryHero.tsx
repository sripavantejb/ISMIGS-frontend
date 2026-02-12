import { motion } from "framer-motion";

const TAGLINE_DEFAULT = "Industry-wise contribution to GDP.";

interface GVAIndustryHeroProps {
  industryName: string;
  /** One short line on how this industry affects GVA. From API when available. */
  industryAffectsGvaShort?: string;
}

export function GVAIndustryHero({
  industryName,
  industryAffectsGvaShort,
}: GVAIndustryHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/10 via-card to-primary/5"
    >
      <div className="relative z-10 px-6 py-10 sm:px-8 sm:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground"
        >
          {industryName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mt-2 text-sm sm:text-base text-muted-foreground"
        >
          {industryAffectsGvaShort ?? TAGLINE_DEFAULT}
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-4 h-0.5 w-20 origin-left rounded-full bg-primary/60"
        />
      </div>
    </motion.section>
  );
}
