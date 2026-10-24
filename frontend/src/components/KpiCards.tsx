import React from 'react'
import { MetricsResponse } from '../types'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle, Info, ShieldAlert } from 'lucide-react'

interface KpiCardsProps {
  metrics: MetricsResponse | undefined
  isLoading: boolean
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics, isLoading }) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl p-4 animate-pulse">
            <div className="h-3 w-20 bg-slate-800 rounded mb-3"></div>
            <div className="h-7 w-28 bg-slate-800 rounded mb-2"></div>
            <div className="h-3 w-16 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const formatMw = (val: number) =>
    new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(val)

  const isOver = metrics.bias > 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. MAE */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-400" />
            Mean Abs Error (MAE)
          </span>
          <span
            className="text-slate-500 hover:text-slate-300 cursor-help"
            title="Average absolute magnitude of difference between forecast and actual generation. Primary benchmark for day-ahead balancing requirements."
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-mono">
          {formatMw(metrics.mae)} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
          <span>{metrics.nmae_pct}% of mean</span>
          <span className="text-[11px] text-slate-500 font-mono">sMAPE {metrics.smape_pct}%</span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* 2. RMSE */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-indigo-400" />
            Root Mean Sq (RMSE)
          </span>
          <span
            className="text-slate-500 hover:text-slate-300 cursor-help"
            title="Heavily penalizes large forecasting blunders/outliers. Crucial for assessing tail risks during extreme wind ramps."
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-mono">
          {formatMw(metrics.rmse)} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-1 text-xs text-slate-400">
          Penalty delta: <strong className="text-indigo-300 font-mono">+{formatMw(metrics.rmse - metrics.mae)} MW</strong>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* 3. Bias */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            {isOver ? (
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            )}
            Net Bias (Signed Error)
          </span>
          <span
            className="text-slate-500 hover:text-slate-300 cursor-help"
            title="Systematic over- or under-forecasting bias. Positive indicates the model predicted higher than reality, leading to short positions."
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-mono">
          {metrics.bias > 0 ? `+${formatMw(metrics.bias)}` : formatMw(metrics.bias)}{' '}
          <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-1 text-xs flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
              isOver ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isOver ? 'OVER-FORECAST' : 'UNDER-FORECAST'}
          </span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* 4. P90 Absolute Error */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            P90 Planning Buffer
          </span>
          <span
            className="text-slate-500 hover:text-slate-300 cursor-help"
            title="In 90% of hours, absolute error was below this value. Use as the empirical thermal reserve buffer."
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-mono">
          ±{formatMw(metrics.p90_abs_error)} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
          <span>P95 buffer:</span>
          <strong className="text-purple-300 font-mono">±{formatMw(metrics.p95_abs_error)} MW</strong>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* 5. Target Coverage */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-teal-400" />
            Data Coverage
          </span>
          <span
            className="text-slate-500 hover:text-slate-300 cursor-help"
            title="Proportion of target delivery hours with aligned pre-decision forecasts and verified outturns."
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-mono">
          {metrics.coverage_pct}%
        </div>
        <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
          <span>Target sample:</span>
          <strong className="text-teal-300 font-mono">{metrics.count} hours</strong>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
      </div>
    </div>
  )
}
