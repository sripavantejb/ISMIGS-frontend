const items = [
  { num: '01', title: 'Real Data (no mock data)', description: 'MoSPI and related official sources only.' },
  { num: '02', title: 'Easy switch between analyses', description: 'One click in the sidebar changes the view.' },
  { num: '03', title: 'AI Chatbot integration', description: 'ISMIGS AI answers Energy, WPI, IIP, GDP, GVA, macro, and agriculture (crops, schemes, prices).' },
  { num: '04', title: 'Admin panel for governance', description: 'Sector emails, LinkedIn/social posting with approval.' },
  { num: '05', title: 'Agriculture & farmer tools', description: 'Crop recommendation, AI Crop Doctor, cultivation cost, profitability, loans, schemes, market prices, water & irrigation, alerts, expert consultation.' },
]

function TrustCard({ num, title, description }) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-md transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
      <span className="text-2xl font-bold text-primary/80 mb-3 block">{num}</span>
      <h3 className="text-foreground font-semibold text-base sm:text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}

export default function BuiltOnTrust() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-primary/90">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            Built on Trust. Driven by Results.
          </h2>
          <p className="text-primary-foreground/90 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Macro &amp; Energy and Agriculture — real data, easy switching, AI chatbot, and admin governance. No mock data.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {items.map((item) => (
            <TrustCard key={item.num} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
