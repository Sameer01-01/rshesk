import React from 'react'
import { Sparkles, ShieldCheck, Zap, ArrowRight, TrendingDown } from 'lucide-react'

interface InsightsPanelProps {
  insights: string[]
  isLoading: boolean
}

const INSIGHT_ICONS = [ShieldCheck, Zap, TrendingDown, ArrowRight]
const INSIGHT_COLORS = ['#38bdf8', '#f59e0b', '#c084fc', '#34d399']

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-5 w-5 rounded-md" />
          <div className="skeleton h-4 w-52 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <div className="skeleton h-3 w-full rounded-full" />
              <div className="skeleton h-3 w-4/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!insights.length) return null

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, var(--bg-card) 60%)',
        border: '1px solid var(--border-accent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%)' }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 relative">
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          Automated Trading Desk Insights &amp; Planning Guidelines
        </h3>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
        {insights.map((insight, idx) => {
          const Icon = INSIGHT_ICONS[idx % INSIGHT_ICONS.length]
          const color = INSIGHT_COLORS[idx % INSIGHT_COLORS.length]
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="mt-0.5 p-1.5 rounded-lg shrink-0"
                style={{ background: `${color}15`, color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {insight}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
