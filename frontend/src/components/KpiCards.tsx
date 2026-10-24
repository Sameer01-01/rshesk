import React from 'react'
import { MetricsResponse } from '../types'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle, Info, ShieldAlert } from 'lucide-react'

interface KpiCardsProps {
  metrics: MetricsResponse | undefined
  isLoading: boolean
}

const Skeleton: React.FC = () => (
  <div className="glass-panel card-lift rounded-2xl p-5 flex flex-col gap-3">
    <div className="skeleton h-3 w-24 rounded-full" />
    <div className="skeleton h-8 w-32 rounded-lg" />
    <div className="skeleton h-3 w-20 rounded-full" />
  </div>
)

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  tooltip: string
  accentColor: string
  glowColor: string
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, tooltip, accentColor, glowColor }) => (
  <div
    className="glass-panel card-lift gradient-border rounded-2xl p-5 relative overflow-hidden group"
    title={tooltip}
  >
    {/* Background glow orb */}
    <div
      className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-500 opacity-40 group-hover:opacity-70"
      style={{ background: glowColor }}
    />

    {/* Icon + label row */}
    <div className="flex items-center justify-between mb-2 relative">
      <div className="flex items-center gap-2">
        <div
          className="p-1.5 rounded-lg"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {label}
        </span>
      </div>
      <Info className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity cursor-help" style={{ color: 'var(--text-2)' }} />
    </div>

    {/* Value */}
    <div className="relative font-mono text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>
      {value}
    </div>

    {/* Sub-info */}
    <div className="mt-1.5 text-[11px] relative" style={{ color: 'var(--text-3)' }}>
      {sub}
    </div>

    {/* Bottom accent bar */}
    <div
      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
    />
  </div>
)

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics, isLoading }) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    )
  }

  const fmt = (v: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(v)
  const isOver = metrics.bias > 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard
        icon={<Activity className="w-4 h-4" />}
        label="MAE"
        tooltip="Mean Absolute Error — average forecast deviation from actual generation. Primary day-ahead benchmark."
        accentColor="#38bdf8"
        glowColor="rgba(56, 189, 248, 0.25)"
        value={<>{fmt(metrics.mae)} <span className="text-sm font-normal" style={{ color: 'var(--text-3)' }}>MW</span></>}
        sub={<span>{metrics.nmae_pct}% of mean &nbsp;·&nbsp; sMAPE {metrics.smape_pct}%</span>}
      />

      <KpiCard
        icon={<AlertTriangle className="w-4 h-4" />}
        label="RMSE"
        tooltip="Root Mean Square Error — penalises large spikes and ramps. Crucial for tail-risk assessment."
        accentColor="#818cf8"
        glowColor="rgba(129, 140, 248, 0.25)"
        value={<>{fmt(metrics.rmse)} <span className="text-sm font-normal" style={{ color: 'var(--text-3)' }}>MW</span></>}
        sub={
          <span>
            Outlier premium:{' '}
            <span style={{ color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>+{fmt(metrics.rmse - metrics.mae)} MW</span>
          </span>
        }
      />

      <KpiCard
        icon={isOver ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        label="Net Bias"
        tooltip="Systematic over- or under-forecasting. Positive → over-forecast → short position risk."
        accentColor={isOver ? '#f59e0b' : '#34d399'}
        glowColor={isOver ? 'rgba(245, 158, 11, 0.25)' : 'rgba(52, 211, 153, 0.25)'}
        value={
          <>
            {metrics.bias > 0 ? `+${fmt(metrics.bias)}` : fmt(metrics.bias)}{' '}
            <span className="text-sm font-normal" style={{ color: 'var(--text-3)' }}>MW</span>
          </>
        }
        sub={
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: isOver ? 'rgba(245,158,11,0.12)' : 'rgba(52,211,153,0.12)',
              color: isOver ? '#f59e0b' : '#34d399',
              border: `1px solid ${isOver ? 'rgba(245,158,11,0.25)' : 'rgba(52,211,153,0.25)'}`,
            }}
          >
            {isOver ? '▲ Over-forecast' : '▼ Under-forecast'}
          </span>
        }
      />

      <KpiCard
        icon={<ShieldAlert className="w-4 h-4" />}
        label="P90 Buffer"
        tooltip="In 90% of hours, absolute error was below this threshold — the empirical thermal reserve target."
        accentColor="#c084fc"
        glowColor="rgba(192, 132, 252, 0.25)"
        value={<>±{fmt(metrics.p90_abs_error)} <span className="text-sm font-normal" style={{ color: 'var(--text-3)' }}>MW</span></>}
        sub={
          <span>
            P95:{' '}
            <span style={{ color: '#c084fc', fontFamily: 'JetBrains Mono, monospace' }}>±{fmt(metrics.p95_abs_error)} MW</span>
          </span>
        }
      />

      <KpiCard
        icon={<CheckCircle className="w-4 h-4" />}
        label="Coverage"
        tooltip="Proportion of target delivery hours with matched forecast and outturn records."
        accentColor="#2dd4bf"
        glowColor="rgba(45, 212, 191, 0.25)"
        value={<>{metrics.coverage_pct}<span className="text-lg font-normal" style={{ color: 'var(--text-3)' }}>%</span></>}
        sub={
          <span>
            Sample:{' '}
            <span style={{ color: '#2dd4bf', fontFamily: 'JetBrains Mono, monospace' }}>{metrics.count} hours</span>
          </span>
        }
      />
    </div>
  )
}
