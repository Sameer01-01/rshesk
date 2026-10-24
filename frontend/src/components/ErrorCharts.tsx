import React, { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid, Cell,
} from 'recharts'
import { ComparisonRecord } from '../types'
import { BarChart3, TrendingDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface ErrorChartsProps {
  data: ComparisonRecord[]
}

export const ErrorCharts: React.FC<ErrorChartsProps> = ({ data }) => {
  const { chart } = useTheme()

  const timeData = useMemo(() =>
    data.map(d => ({
      time: d.startTime.substring(5, 16).replace('T', ' '),
      error: Math.round(d.error),
    })), [data])

  const histogramData = useMemo(() => {
    if (!data.length) return []
    const binSize = 1000
    const errors = data.map(d => d.error)
    const minErr = Math.floor(Math.min(...errors) / binSize) * binSize
    const maxErr = Math.ceil(Math.max(...errors) / binSize) * binSize
    const bins: Record<number, number> = {}
    for (let b = minErr; b <= maxErr; b += binSize) bins[b] = 0
    errors.forEach(e => {
      const b = Math.floor(e / binSize) * binSize
      if (bins[b] !== undefined) bins[b]++
    })
    return Object.entries(bins).map(([k, count]) => {
      const s = Number(k)
      return {
        bin: `${s >= 0 ? '+' : ''}${s / 1000}k→${(s + binSize) >= 0 ? '+' : ''}${(s + binSize) / 1000}k`,
        count,
        binStart: s,
      }
    })
  }, [data])

  if (!data.length) return null

  const ChartCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; accentColor: string; children: React.ReactNode }> = ({ title, subtitle, icon, accentColor, children }) => (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-lg shrink-0" style={{ background: `${accentColor}18`, color: accentColor }}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )

  const tooltipStyle = {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    color: chart.tooltipText,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Signed Error Over Time (Forecast − Actual)"
        subtitle="Positive values = over-forecast (shortage risk) · Negative = under-forecast (spill risk)"
        icon={<TrendingDown className="w-4 h-4" />}
        accentColor="#38bdf8"
      >
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="time" stroke={chart.axis} fontSize={10} minTickGap={30} tickLine={false} tick={{ fill: chart.axis }} />
              <YAxis
                stroke={chart.axis}
                fontSize={10}
                tickFormatter={v => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                tick={{ fill: chart.axis }}
              />
              <ReferenceLine y={0} stroke={chart.axis} strokeWidth={1.5} strokeOpacity={0.7} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={tooltipStyle}>
                      <div style={{ color: 'var(--text-2)', marginBottom: 4 }}>{d.time} UTC</div>
                      <div style={{ color: d.error >= 0 ? '#f59e0b' : '#34d399', fontWeight: 700 }}>
                        Error: {d.error > 0 ? `+${d.error.toLocaleString()}` : d.error.toLocaleString()} MW
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="error" radius={[2, 2, 0, 0]}>
                {timeData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.error >= 0 ? '#f59e0b' : '#34d399'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Error Frequency Distribution"
        subtitle="Sample count per 1,000 MW signed error bin — reveals skewness & kurtosis"
        icon={<BarChart3 className="w-4 h-4" />}
        accentColor="#818cf8"
      >
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis
                dataKey="bin"
                stroke={chart.axis}
                fontSize={9}
                interval={0}
                angle={-28}
                textAnchor="end"
                height={48}
                tickLine={false}
                tick={{ fill: chart.axis }}
              />
              <YAxis stroke={chart.axis} fontSize={10} tickLine={false} tick={{ fill: chart.axis }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={tooltipStyle}>
                      <div style={{ color: 'var(--text-2)', marginBottom: 4 }}>Bin: {d.bin} MW</div>
                      <div style={{ color: '#818cf8', fontWeight: 700 }}>Hours: {d.count}</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" fill="#818cf8" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
