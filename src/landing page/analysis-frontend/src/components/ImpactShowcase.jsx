import { Link } from 'react-router-dom'

const cards = [
  {
    tag: 'Energy',
    title: 'Energy analytics',
    description: 'Overview, IIP, Energy, WPI. Supply, production, imports, consumption by commodity. Official MoSPI data.',
  },
  {
    tag: 'Inflation & production',
    title: 'Inflation & production metrics',
    description: 'WPI, IIP, and industrial trends. CPI map and CPI outlook. One-click switch between analyses.',
  },
  {
    tag: 'Macro & risk',
    title: 'Macro & risk intelligence',
    description: 'GDP, GVA, national accounts, and Risk Intelligence with alerts.',
  },
  {
    tag: 'Agriculture',
    title: 'Agriculture & farmer tools',
    description: 'Crop recommendation, AI Crop Doctor, Cultivation cost (AI), Crop profitability, Loans, Government schemes, Market prices, Water & irrigation, Alerts, Expert consultation, Farm profile, Rural prices map.',
  },
]

function ShowcaseCard({ tag, title, description, isHighlight }) {
  return (
    <div
      className={`p-6 sm:p-8 rounded-2xl border shadow-md transition-all duration-300 cursor-default hover:-translate-y-0.5 hover:shadow-lg ${
        isHighlight
          ? 'bg-primary/20 border-primary'
          : 'bg-card border-border hover:border-primary/30 hover:shadow-primary/5'
      }`}
    >
      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider bg-muted/80 text-muted-foreground">{tag}</span>
      <h3 className="text-foreground font-semibold text-lg mt-3 mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{description}</p>
    </div>
  )
}

export default function ImpactShowcase() {
  return (
    <section className="py-16 md:py-20 px-6 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Real Impact. Proven Insights.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            How ISMIGS serves macro &amp; energy analysts and farmers — complete features for both sectors.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {cards.map((item, i) => (
            <ShowcaseCard
              key={item.title}
              {...item}
              isHighlight={i === 3}
            />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-md hover:bg-primary/90 hover:shadow-lg active:scale-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Explore Data Stories
          </Link>
          <Link
            to="/agriculture"
            className="inline-block px-6 py-3 border-2 border-primary text-primary font-medium rounded-xl hover:bg-primary/10 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Explore Agriculture
          </Link>
        </div>
      </div>
    </section>
  )
}
