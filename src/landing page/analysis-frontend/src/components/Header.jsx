import { useState } from 'react'
import { Link } from 'react-router-dom'

const analysisItems = [
  { label: 'Industrial production (IIP)', to: '/dashboard' },
  { label: 'Energy analytics', to: '/dashboard' },
  { label: 'Wholesale inflation (WPI)', to: '/dashboard' },
  { label: 'GVA', to: '/dashboard' },
  { label: 'GDP and accounts', to: '/dashboard' },
  { label: 'Agriculture', to: '/agriculture' },
]

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)

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
              onClick={() => setDropdownOpen((o) => !o)}
              onBlur={() => setDropdownOpen(false)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
            >
              Analysis & Predictions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[220px] rounded-lg border border-border bg-background/95 backdrop-blur-xl py-2 shadow-xl z-50">
                {analysisItems.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setDropdownOpen(false)}
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
