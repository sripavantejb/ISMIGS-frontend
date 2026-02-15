import { Link } from 'react-router-dom'

const analyses = [
  { title: 'Overview', description: 'Macro summary, production, consumption, and supply vs demand trends at a glance.', to: '/dashboard' },
  { title: 'Industrial production (IIP)', description: 'IIP by category: Mining, Manufacturing, Electricity. Track industrial output.', to: '/iip' },
  { title: 'Energy analytics', description: 'Supply, production, imports, and consumption by commodity. Coal, oil, gas.', to: '/energy' },
  { title: 'Wholesale inflation (WPI)', description: 'WPI by major group: Primary Articles, Fuel & Power, Manufactured Products.', to: '/wpi' },
  { title: 'GVA', description: 'GVA by industry. Sector-wise economy and value added across sectors.', to: '/gva' },
  { title: 'GDP and accounts', description: 'GDP and national accounts data. Official macro aggregates and trends.', to: '/gdp' },
  { title: 'Risk Intelligence', description: 'AI-powered risk assessment and intelligence across economic indicators.', to: '/risk-intelligence' },
  { title: 'CPI', description: 'State-level CPI-AL, CPI-RL, rural prices map, and CPI outlook with AI insights.', to: '/cpi-map' },
  {
    title: 'Agriculture & farmer dashboard',
    description: 'Crop recommendation, AI Crop Doctor, Cultivation cost (AI), Crop profitability, Loans, Government schemes, Market prices, Water & irrigation, Alerts, Expert consultation, Farm profile, Rural prices map.',
    to: '/agriculture',
  },
]

function LaptopCodeIcon({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="4" y="8" width="32" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 28h24M12 32h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="middle" fill="currentColor" fontSize="8" fontFamily="monospace">{'</>'}</text>
    </svg>
  )
}

function CircularArrowIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Card({ title, description, to }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col h-full p-6 sm:p-8 rounded-2xl border border-border bg-card text-left transition-all duration-300 shadow-md hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      <span className="absolute top-5 right-5 text-muted-foreground group-hover:text-primary" aria-hidden>
        <CircularArrowIcon />
      </span>
      <div className="mb-4 text-primary">
        <LaptopCodeIcon />
      </div>
      <h3 className="font-semibold text-lg mb-2 text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed flex-1 min-h-0 text-muted-foreground">{description}</p>
      <span className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground group-hover:text-primary">View</span>
    </Link>
  )
}

export default function AnalysisGrid() {
  return (
    <section className="min-h-screen flex flex-col justify-center py-20 md:py-24 px-6 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Two sectors: Macro &amp; Energy and Agriculture
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Complete feature set for analysts and farmers — switch between analyses in one click from the sidebar.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {analyses.map((item) => (
          <Card
            key={item.title}
            title={item.title}
            description={item.description}
            to={item.to}
          />
        ))}
      </div>
    </section>
  )
}
