import React from 'react'
import { Wind, HelpCircle, Database, CheckCircle2, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface HeaderProps {
  onOpenMethodology: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenMethodology }) => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl"
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: isDark
          ? '0 1px 32px rgba(0,0,0,0.35)'
          : '0 1px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* ── Brand ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5">
          {/* Animated logo orb */}
          <div className="relative w-10 h-10 shrink-0">
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-60"
              style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}
            />
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(129,140,248,0.15))',
                border: '1px solid rgba(56,189,248,0.3)',
              }}
            >
              <Wind
                className="w-5 h-5"
                style={{ color: 'var(--accent)' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: 'var(--text-1)' }}
              >
                Wind Forecast Monitor
              </h1>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-accent)',
                }}
              >
                UK NATIONAL DESK
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Day-ahead decision verification &amp; empirical forecast error evaluation
            </p>
          </div>
        </div>

        {/* ── Right Actions ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Data badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
            }}
          >
            <Database className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>Elexon BMRS</span>
          </div>

          {/* Verified badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              color: '#34d399',
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Jan 2026 Verified</span>
          </div>

          {/* Methodology button */}
          <button
            id="btn-methodology"
            onClick={onOpenMethodology}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
              boxShadow: '0 2px 12px rgba(14, 165, 233, 0.35)',
            }}
            title="View Methodology Documentation"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Methodology</span>
          </button>

          {/* ── Theme Toggle ─────────────────────────────────────────────────── */}
          <button
            id="btn-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="theme-toggle flex items-center"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                : 'linear-gradient(135deg, #fef3c7, #fde68a)',
            }}
          >
            {/* Track icons */}
            <span
              className="absolute left-2 text-[10px] transition-opacity duration-300"
              style={{ opacity: isDark ? 0 : 1 }}
              aria-hidden="true"
            >
              ☀️
            </span>
            <span
              className="absolute right-2 text-[10px] transition-opacity duration-300"
              style={{ opacity: isDark ? 1 : 0 }}
              aria-hidden="true"
            >
              🌙
            </span>

            {/* Sliding thumb */}
            <div
              className="theme-toggle-thumb"
              style={{
                transform: isDark ? 'translateX(26px)' : 'translateX(3px)',
                background: isDark
                  ? 'linear-gradient(135deg, #818cf8, #6366f1)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(99, 102, 241, 0.5)'
                  : '0 2px 8px rgba(245, 158, 11, 0.5)',
              }}
            >
              {isDark ? (
                <Moon className="w-3 h-3 text-white" />
              ) : (
                <Sun className="w-3 h-3 text-white" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
