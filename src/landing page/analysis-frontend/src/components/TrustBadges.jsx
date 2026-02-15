import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const DASHBOARD_ITEMS = [
  { name: 'Overview' },
  { name: 'Industrial production (IIP)' },
  { name: 'Energy analytics' },
  { name: 'Wholesale inflation (WPI)' },
  { name: 'GVA' },
  { name: 'GDP and accounts' },
  { name: 'Agriculture', to: '/agriculture' },
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
      <div className="w-full bg-card border-y border-border rounded-none py-5 px-6 md:px-10 shadow-xl">
        <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8">
          {DASHBOARD_ITEMS.map((item, i) => (
            <span key={item.name} className="flex items-center gap-5 md:gap-8">
              {item.to ? (
                <Link
                  to={item.to}
                  className="text-foreground text-base md:text-lg font-medium whitespace-nowrap transition-colors duration-200 hover:text-primary"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-foreground text-base md:text-lg font-medium whitespace-nowrap transition-colors duration-200 hover:text-primary cursor-default">{item.name}</span>
              )}
              {i < DASHBOARD_ITEMS.length - 1 && (
                <span className="hidden md:inline-block w-px h-6 bg-border flex-shrink-0" aria-hidden />
              )}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
