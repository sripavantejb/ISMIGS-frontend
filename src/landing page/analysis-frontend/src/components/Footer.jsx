import { Link } from 'react-router-dom'

const quickLinks = {
  Product: [
    { label: 'Overview', to: '/' },
    { label: 'Dashboards', to: '/dashboard' },
    { label: 'Analysis & Predictions', to: '/' },
  ],
  Resources: [
    { label: 'Admin', to: '/admin' },
    { label: 'About', to: '#' },
    { label: 'Contact', to: '#' },
  ],
  Legal: [
    { label: 'Privacy', to: '#' },
    { label: 'Terms', to: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="relative z-10 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Logo and tagline */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-baseline gap-0.5 text-foreground font-bold text-2xl tracking-tight hover:opacity-90 transition-opacity">
              <span>ISMIGS</span>
              <span className="text-primary">.</span>
            </Link>
            <p className="text-muted-foreground text-sm mt-3 max-w-xs">
              India State Macro Intelligence & Governance System. Macro-economic and energy intelligence for India.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              {quickLinks.Product.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm inline-block hover:translate-x-0.5">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-3">
              {quickLinks.Resources.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm inline-block hover:translate-x-0.5">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              {quickLinks.Legal.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm inline-block hover:translate-x-0.5">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} ISMIGS. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Official data. Real insights.
          </p>
        </div>
      </div>
    </footer>
  )
}
