import React from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import { HorizonMetric } from '../types'
import { Hourglass, TrendingUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface HorizonAnalysisChartProps {
  data: HorizonMetric[]
  isLoading: boolean
}

export const HorizonAnalysisChart: React.FC<HorizonAnalysisChartProps> = ({ data, isLoading }) => {
  const { chart } = useTheme()

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-72 flex items-center justify-center animate-pulse">
        <div className="skeleton h-6 w-56 rounded-lg" />
      </div>
    )
  }

  if (!data.length) return null

  const h0  = data[0]
  const h48 = data[data.length - 1]
  const growthPct = h0?.mae > 0 ? (((h48.mae - h0.mae) / h0.mae) * 100).toFixed(1) : '0'

  const tooltipStyle = {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    color: chart.tooltipText,
    minWidth: 220,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
            <Hourglass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
              Accuracy Degradation vs Forecast Horizon (0–48 h)
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              How error compounds as lead time grows from real-time dispatch to day-ahead gate closure
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0"
          style={{
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.25)',
            color: '#38bdf8',
          }}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          +{growthPct}% error from 0h → {h48.horizonHours}h
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="horizonHours"
              stroke={chart.axis}
              fontSize={11}
              unit="h"
              tickLine={false}
              tick={{ fill: chart.axis }}
            />
            <YAxis
              stroke={chart.axis}
              fontSize={11}
              tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
              tickLine={false}
              unit=" MW"
              tick={{ fill: chart.axis }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as HorizonMetric
                return (
                  <div style={tooltipStyle}>
                    <div className="font-bold border-b pb-2 mb-2" style={{ borderColor: chart.tooltipBorder, color: chart.tooltipText }}>
                      Horizon: {d.horizonHours}h Lead Time
                    </div>
                    {[
                      { label: 'MAE', value: `${d.mae.toLocaleString()} MW`, color: '#38bdf8' },
                      { label: 'RMSE', value: `${d.rmse.toLocaleString()} MW`, color: '#818cf8' },
                      { label: 'Bias', value: `${d.bias > 0 ? '+' : ''}${d.bias.toLocaleString()} MW`, color: '#f59e0b' },
                      { label: 'P90', value: `±${d.p90AbsError.toLocaleString()} MW`, color: '#c084fc' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between gap-6 mt-1">
                        <span style={{ color: 'var(--text-2)' }}>{row.label}:</span>
                        <strong style={{ color: row.color }}>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '12px', color: chart.axis }} />
            <Line type="monotone" dataKey="mae"         stroke="#38bdf8" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="MAE" />
            <Line type="monotone" dataKey="rmse"        stroke="#818cf8" strokeWidth={2}   dot={false} strokeDasharray="5 5" name="RMSE" />
            <Line type="monotone" dataKey="p90AbsError" stroke="#c084fc" strokeWidth={1.5} dot={false} strokeDasharray="2 3" name="P90 Buffer" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
