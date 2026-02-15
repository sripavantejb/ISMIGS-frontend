import { useState } from 'react'
import { Link } from 'react-router-dom'

const analysisItems = [
  { label: 'Industrial production (IIP)', to: '/dashboard' },
  { label: 'Energy analytics', to: '/dashboard' },
  { label: 'Wholesale inflation (WPI)', to: '/dashboard' },
  { label: 'GVA', to: '/dashboard' },
  { label: 'GDP and accounts', to: '/dashboard' },
]

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-6 md:px-12">
      <nav className="max-w-4xl mx-auto rounded-lg border border-white/10 bg-ismigs-dark/90 bg-black/40 backdrop-blur-xl shadow-xl shadow-black/30 py-2.5 px-5 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-0.5 text-white font-bold text-xl tracking-tight">
          <span>ISMIGS</span>
          <span className="text-ismigs-purple">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
            Overview
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              onBlur={() => setDropdownOpen(false)}
              className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors duration-200 text-sm"
            >
              Analysis & Predictions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[220px] rounded-lg border border-white/10 bg-ismigs-dark/95 backdrop-blur-xl py-2 shadow-xl z-50">
                {analysisItems.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
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
          <Link to="/admin" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
            Admin
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 text-sm bg-ismigs-purple text-white rounded-lg hover:bg-ismigs-purple-bright hover:shadow-lg hover:shadow-ismigs-purple/25 transition-all duration-200"
          >
            Explore
          </Link>
        </div>
      </nav>
    </header>
  )
}
