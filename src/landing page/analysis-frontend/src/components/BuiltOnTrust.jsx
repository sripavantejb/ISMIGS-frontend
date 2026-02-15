const items = [
  { num: '01', title: 'Real Data (no mock data)', description: 'MoSPI and related official sources only.' },
  { num: '02', title: 'Easy switch between analyses', description: 'One click in the sidebar changes the view.' },
  { num: '03', title: 'AI Chatbot integration', description: 'ISMIGS AI answers Energy, WPI, IIP, GDP, GVA, macro.' },
  { num: '04', title: 'Admin panel for governance', description: 'Sector emails, LinkedIn/social posting with approval.' },
]

function TrustCard({ num, title, description }) {
  return (
    <div className="group relative p-5 sm:p-6 rounded-xl bg-card border border-border transition-all duration-300 ease-out hover:border-primary hover:bg-muted/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02] cursor-default">
      <span className="absolute top-4 right-4 w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors duration-300">
        i
      </span>
      <span className="text-3xl sm:text-4xl font-bold text-foreground/90 mb-2 block group-hover:text-foreground transition-colors duration-300">{num}</span>
      <h3 className="text-foreground font-semibold text-base sm:text-lg mb-1 group-hover:text-foreground transition-colors duration-300">{title}</h3>
      <p className="text-muted-foreground text-xs sm:text-sm group-hover:text-foreground/80 transition-colors duration-300">{description}</p>
    </div>
  )
}

export default function BuiltOnTrust() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-primary/90">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            Built on Trust. Driven by Results.
          </h2>
          <p className="text-primary-foreground/90 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Real data, easy switching, AI chatbot, agriculture support, and admin governance — no mock data.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <TrustCard key={item.num} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
