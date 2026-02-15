import { Link } from 'react-router-dom'

const cards = [
  {
    tag: 'Energy',
    title: 'Energy analytics',
    description: 'Supply, production, imports, consumption by commodity. Official MoSPI data.',
  },
  {
    tag: 'Inflation & production',
    title: 'Inflation & production metrics',
    description: 'WPI, IIP, and industrial trends. One-click switch between analyses.',
  },
  {
    tag: 'Macro & risk',
    title: 'Macro & risk intelligence',
    description: 'GDP, GVA, national accounts, and risk views with alerts.',
  },
]

function ShowcaseCard({ tag, title, description, isHighlight }) {
  return (
    <div
      className={`p-6 rounded-xl border transition-all duration-300 cursor-default hover:scale-[1.02] hover:shadow-lg hover:shadow-ismigs-purple/10 ${
        isHighlight
          ? 'bg-ismigs-purple/20 border-ismigs-purple'
          : 'bg-ismigs-card border-white/10 hover:bg-ismigs-purple/20 hover:border-ismigs-purple'
      }`}
    >
      <span className="text-xs text-white/70 uppercase tracking-wider">{tag}</span>
      <h3 className="text-white font-semibold text-lg mt-2 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

export default function ImpactShowcase() {
  return (
    <section className="py-16 md:py-20 px-6 md:px-8 bg-ismigs-dark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Real Impact. Proven Insights.
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            How ISMIGS helps analysts with Energy, WPI, IIP, GDP, GVA, and macro outlooks.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cards.map((item, i) => (
            <ShowcaseCard
              key={item.title}
              {...item}
              isHighlight={i === 1}
            />
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-ismigs-purple text-white font-medium rounded-lg hover:bg-ismigs-purple-bright hover:shadow-lg hover:shadow-ismigs-purple/25 hover:scale-105 active:scale-100 transition-all duration-200"
          >
            Explore Data Stories
          </Link>
        </div>
      </div>
    </section>
  )
}
