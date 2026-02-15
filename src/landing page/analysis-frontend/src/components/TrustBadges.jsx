import { motion } from 'framer-motion'

const DASHBOARD_NAMES = [
  'Overview',
  'Industrial production (IIP)',
  'Energy analytics',
  'Wholesale inflation (WPI)',
  'GVA',
  'GDP and accounts',
]

export default function TrustBadges() {
  return (
    <motion.section
      className="relative z-10 -mt-10 w-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="w-full bg-ismigs-card border-y border-white/10 rounded-none py-5 px-6 md:px-10 shadow-xl">
        <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8">
          {DASHBOARD_NAMES.map((name, i) => (
            <span key={name} className="flex items-center gap-5 md:gap-8">
              <span className="text-white text-base md:text-lg font-medium whitespace-nowrap transition-colors duration-200 hover:text-ismigs-purple cursor-default">{name}</span>
              {i < DASHBOARD_NAMES.length - 1 && (
                <span className="hidden md:inline-block w-px h-6 bg-white/20 flex-shrink-0" aria-hidden />
              )}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
