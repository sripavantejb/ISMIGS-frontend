import { useState } from 'react'
import { Link } from 'react-router-dom'

const macroEnergyItems = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Industrial production (IIP)', to: '/iip' },
  { label: 'Energy analytics', to: '/energy' },
  { label: 'Wholesale inflation (WPI)', to: '/wpi' },
  { label: 'GVA', to: '/gva' },
  { label: 'GDP and accounts', to: '/gdp' },
  { label: 'Risk Intelligence', to: '/risk-intelligence' },
  { label: 'CPI Map', to: '/cpi-map' },
  { label: 'CPI Outlook', to: '/cpi-outlook' },
]

const agricultureItems = [
  { label: 'Agriculture', to: '/agriculture' },
]

export default function Header() {
  const [macroOpen, setMacroOpen] = useState(false)
  const [agriOpen, setAgriOpen] = useState(false)

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-6 md:px-12">
      <nav className="max-w-4xl mx-auto rounded-lg border border-border bg-background/90 backdrop-blur-xl shadow-xl py-2.5 px-5 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-0.5 text-foreground font-bold text-xl tracking-tight">
          <span>ISMIGS</span>
          <span className="text-primary">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
            Overview
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setMacroOpen((o) => !o); setAgriOpen(false); }}
              onBlur={() => setMacroOpen(false)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
            >
              Macro &amp; Energy
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {macroOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[220px] rounded-lg border border-border bg-background/95 backdrop-blur-xl py-2 shadow-xl z-50">
                {macroEnergyItems.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setMacroOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setAgriOpen((o) => !o); setMacroOpen(false); }}
              onBlur={() => setAgriOpen(false)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
            >
              Agriculture
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {agriOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[220px] rounded-lg border border-border bg-background/95 backdrop-blur-xl py-2 shadow-xl z-50">
                {agricultureItems.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setAgriOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
            Admin
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
          >
            Explore
          </Link>
        </div>
      </nav>
    </header>
  )
}
