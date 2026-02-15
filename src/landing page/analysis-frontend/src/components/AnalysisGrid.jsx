import { Link } from 'react-router-dom'

const analyses = [
  {
    title: 'Overview',
    description: 'Macro summary, production, consumption, and supply vs demand trends at a glance.',
  },
  {
    title: 'Industrial production (IIP)',
    description: 'IIP by category: Mining, Manufacturing, Electricity. Track industrial output.',
  },
  {
    title: 'Energy analytics',
    description: 'Supply, production, imports, and consumption by commodity. Coal, oil, gas.',
  },
  {
    title: 'Wholesale inflation (WPI)',
    description: 'WPI by major group: Primary Articles, Fuel & Power, Manufactured Products.',
  },
  {
    title: 'GVA',
    description: 'GVA by industry. Sector-wise economy and value added across sectors.',
  },
  {
    title: 'GDP and accounts',
    description: 'GDP and national accounts data. Official macro aggregates and trends.',
  },
]

function LaptopCodeIcon({ className = 'w-10 h-10', isHighlight }) {
  const stroke = isHighlight ? 'currentColor' : '#a78bfa'
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="4" y="8" width="32" height="20" rx="1.5" stroke={stroke} strokeWidth="1.5" />
      <path d="M8 28h24M12 32h16" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="middle" fill={stroke} fontSize="8" fontFamily="monospace">{'</>'}</text>
    </svg>
  )
}

function CircularArrowIcon({ className = 'w-5 h-5', isHighlight }) {
  const stroke = isHighlight ? 'currentColor' : '#a78bfa'
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
      <path d="M12 8v4l3 3" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Card({ title, description, isHighlight }) {
  return (
    <Link
      to="/dashboard"
      className={`group relative block p-6 rounded-xl border text-left transition-all duration-300 ${
        isHighlight
          ? 'bg-ismigs-purple border-ismigs-purple/50 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-ismigs-purple/25'
          : 'bg-ismigs-card border-white/20 hover:border-ismigs-purple/50 hover:bg-ismigs-purple/10 hover:scale-[1.02] hover:shadow-lg'
      }`}
    >
      <span className="absolute top-4 right-4 text-white/70 group-hover:text-white">
        <CircularArrowIcon isHighlight={isHighlight} />
      </span>
      <div className={`mb-4 ${isHighlight ? 'text-white' : 'text-ismigs-purple'}`}>
        <LaptopCodeIcon isHighlight={isHighlight} />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className={isHighlight ? 'text-white/90 text-sm leading-relaxed' : 'text-gray-400 text-sm leading-relaxed'}>{description}</p>
    </Link>
  )
}

export default function AnalysisGrid() {
  return (
    <section className="min-h-screen flex flex-col justify-center py-20 md:py-24 px-6 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Comprehensive Economic & Energy Analysis
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Switch between analyses in one click from the sidebar — no extra navigation.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyses.map((item, index) => (
          <Card
            key={item.title}
            title={item.title}
            description={item.description}
            isHighlight={index === 1}
          />
        ))}
      </div>
    </section>
  )
}
