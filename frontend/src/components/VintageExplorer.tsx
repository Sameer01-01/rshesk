import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts'
import { History, Calendar, CheckCircle, Clock } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface VintageExplorerProps {
  cutoffHour: number
}

const SAMPLE_TARGETS = [
  { label: 'Jan 05 12:00', val: '2026-01-05T12:00:00Z' },
  { label: 'Jan 10 18:00 (Ramp)', val: '2026-01-10T18:00:00Z' },
  { label: 'Jan 15 14:00 (Peak)', val: '2026-01-15T14:00:00Z' },
  { label: 'Jan 20 08:00', val: '2026-01-20T08:00:00Z' },
  { label: 'Jan 25 20:00', val: '2026-01-25T20:00:00Z' },
  { label: 'Jan 30 12:00', val: '2026-01-30T12:00:00Z' },
]

export const VintageExplorer: React.FC<VintageExplorerProps> = ({ cutoffHour }) => {
  const { chart } = useTheme()
  const [targetTime, setTargetTime] = useState('2026-01-15T14:00:00Z')

  const { data, isLoading } = useQuery({
    queryKey: ['vintages', targetTime, cutoffHour],
    queryFn: () => api.getVintages(targetTime, cutoffHour),
  })

  const chartData = (data?.vintages || []).map(v => ({
    publishFormatted: v.publishTime.substring(5, 16).replace('T', ' '),
    publishTime: v.publishTime,
    forecast: v.forecast,
    horizonHours: v.horizonHours,
    isDecisionSelected: v.isDecisionSelected,
    isBeforeCutoff: v.isBeforeCutoff,
  }))

  const selectedVintage = data?.vintages.find(v => v.isDecisionSelected)

  const tooltipStyle = {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    color: chart.tooltipText,
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc' }}>
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
              Forecast Vintage Explorer
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              How forecast publications evolved over 72h before gate closure locked the day-ahead decision
            </p>
          </div>
        </div>

        {/* Target quick-selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold flex items-center gap-1 mr-1" style={{ color: 'var(--text-3)' }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />
            Target:
          </span>
          {SAMPLE_TARGETS.map(s => {
            const active = targetTime === s.val
            return (
              <button
                key={s.val}
                onClick={() => setTargetTime(s.val)}
                className="px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-200 active:scale-95"
                style={
                  active
                    ? { background: '#7c3aed', color: '#ffffff', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }
                    : { background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-2)' }
                }
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status info row */}
      {data && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 p-4 rounded-xl text-xs"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          {[
            {
              label: 'Target Delivery Time',
              value: data.targetTime.replace('T', ' ').replace('Z', ' UTC'),
              color: 'var(--text-1)',
              icon: null,
            },
            {
              label: 'Decision Cutoff (D-1)',
              value: data.cutoffTime.replace('T', ' ').replace('Z', ' UTC'),
              color: '#38bdf8',
              icon: <Clock className="w-3.5 h-3.5" />,
            },
            {
              label: 'Actual Outturn',
              value: data.actualGeneration !== null ? `${data.actualGeneration.toLocaleString()} MW` : 'N/A',
              color: '#34d399',
              icon: null,
            },
          ].map(item => (
            <div key={item.label}>
              <div style={{ color: 'var(--text-3)', marginBottom: 4 }}>{item.label}</div>
              <div
                className="text-sm font-bold flex items-center gap-1.5"
                style={{ color: item.color, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {item.icon}
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {isLoading ? (
        <div className="h-72 flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
          <div className="flex items-center gap-2 text-sm">
            <History className="w-4 h-4 animate-spin" style={{ color: '#c084fc' }} />
            Loading forecast vintages…
          </div>
        </div>
      ) : !chartData.length ? (
        <div className="h-72 flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>
          No vintages recorded for this target time.
        </div>
      ) : (
        <div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="publishFormatted"
                  stroke={chart.axis}
                  fontSize={10}
                  angle={-25}
                  textAnchor="end"
                  tickLine={false}
                  tick={{ fill: chart.axis }}
                />
                <YAxis
                  stroke={chart.axis}
                  fontSize={10}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  unit=" MW"
                  tickLine={false}
                  tick={{ fill: chart.axis }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as typeof chartData[0]
                    return (
                      <div style={tooltipStyle}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: chart.tooltipText }}>
                          Published: {d.publishTime.replace('T', ' ').replace('Z', ' UTC')}
                        </div>
                        <div style={{ color: '#c084fc' }}>Forecast: {d.forecast.toLocaleString()} MW</div>
                        <div style={{ color: 'var(--text-2)' }}>Lead: {d.horizonHours}h</div>
                        {d.isDecisionSelected && (
                          <div style={{ color: '#34d399', fontWeight: 700, marginTop: 6 }}>
                            ★ Selected Decision Forecast
                          </div>
                        )}
                        {!d.isBeforeCutoff && (
                          <div style={{ color: '#f59e0b', fontSize: 10, marginTop: 4 }}>
                            ⚠ Post-Cutoff (look-ahead leakage)
                          </div>
                        )}
                      </div>
                    )
                  }}
                />

                {data?.actualGeneration != null && (
                  <ReferenceLine
                    y={data.actualGeneration}
                    stroke="#34d399"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    label={{
                      value: `Actual: ${data.actualGeneration.toLocaleString()} MW`,
                      fill: '#34d399',
                      fontSize: 11,
                      position: 'insideTopRight',
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  name="Forecast Evolution"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    if (payload.isDecisionSelected) {
                      return (
                        <circle key={payload.publishTime} cx={cx} cy={cy} r={7}
                          fill="#38bdf8" stroke="#ffffff" strokeWidth={2.5}
                          style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }}
                        />
                      )
                    }
                    return <circle key={payload.publishTime} cx={cx} cy={cy} r={3} fill="#c084fc" opacity={0.8} />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {selectedVintage && (
            <div
              className="mt-4 p-3.5 rounded-xl flex items-center justify-between text-xs"
              style={{
                background: 'rgba(56,189,248,0.08)',
                border: '1px solid rgba(56,189,248,0.25)',
                color: 'var(--text-2)',
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#38bdf8' }} />
                <span>
                  <strong style={{ color: 'var(--text-1)' }}>Locked Forecast:</strong>{' '}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8' }}>
                    {selectedVintage.forecast.toLocaleString()} MW
                  </span>{' '}
                  · published {selectedVintage.publishTime.replace('T', ' ').replace('Z', ' UTC')} · {selectedVintage.horizonHours}h lead
                </span>
              </div>
              {data?.actualGeneration != null && (
                <span
                  className="font-bold shrink-0 ml-4"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: (selectedVintage.forecast - data.actualGeneration) > 0 ? '#f59e0b' : '#34d399',
                  }}
                >
                  Error: {selectedVintage.forecast - data.actualGeneration > 0 ? '+' : ''}
                  {(selectedVintage.forecast - data.actualGeneration).toLocaleString()} MW
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
