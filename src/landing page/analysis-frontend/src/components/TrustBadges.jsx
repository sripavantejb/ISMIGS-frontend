import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const DASHBOARD_ITEMS = [
  { name: 'Overview', to: '/dashboard' },
  { name: 'Industrial production (IIP)', to: '/iip' },
  { name: 'Energy analytics', to: '/energy' },
  { name: 'Wholesale inflation (WPI)', to: '/wpi' },
  { name: 'GVA', to: '/gva' },
  { name: 'GDP and accounts', to: '/gdp' },
  { name: 'Risk Intelligence', to: '/risk-intelligence' },
  { name: 'CPI', to: '/cpi-map' },
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-card border border-border rounded-2xl shadow-md py-5 px-6 md:px-10">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-1">
            {DASHBOARD_ITEMS.map((item, i) => (
              <span key={item.name} className="flex items-center">
                <Link
                  to={item.to}
                  className="text-foreground text-base md:text-lg font-medium whitespace-nowrap transition-colors duration-200 hover:text-primary py-2 px-2 rounded-lg hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  {item.name}
                </Link>
                {i < DASHBOARD_ITEMS.length - 1 && (
                  <span className="hidden md:inline-block w-px h-6 bg-border flex-shrink-0 mx-1" aria-hidden />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
