import React from 'react'
import { Sparkles, ShieldCheck, ArrowRight, Zap } from 'lucide-react'

interface InsightsPanelProps {
  insights: string[]
  isLoading: boolean
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-800 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-800 rounded"></div>
          <div className="h-3 w-3/4 bg-slate-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!insights.length) return null

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3 text-sky-400">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider text-[11px]">
          Automated Trading Desk Insights & Planning Guidelines
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/30 transition-colors flex items-start gap-3"
          >
            <div className="mt-0.5 p-1 rounded-md bg-sky-500/10 text-sky-400 shrink-0">
              {idx === 0 ? (
                <ShieldCheck className="w-4 h-4" />
              ) : idx === 1 ? (
                <Zap className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  )
}
