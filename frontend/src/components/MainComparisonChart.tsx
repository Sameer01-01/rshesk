import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, Tooltip, Legend, Brush, CartesianGrid,
} from 'recharts'
import { ComparisonRecord, MetricsResponse } from '../types'
import { Eye, EyeOff, Layers } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface MainComparisonChartProps {
  data: ComparisonRecord[]
  metrics?: MetricsResponse
  isLoading: boolean
}

export const MainComparisonChart: React.FC<MainComparisonChartProps> = ({ data, metrics, isLoading }) => {
  const { chart, isDark } = useTheme()
  const [showBand, setShowBand] = useState(true)

  const chartData = useMemo(() => {
    if (!data.length) return []
    const p5  = metrics?.error_p5 ?? -1000
    const p95 = metrics?.error_p95 ?? 4000
    return data.map(item => ({
      ...item,
      timeFormatted: item.startTime.substring(5, 16).replace('T', ' '),
      band: [
        Math.round(Math.max(0, item.forecast - (p95 > 0 ? p95 : 0))),
        Math.round(item.forecast - (p5 < 0 ? p5 : 0)),
      ],
    }))
  }, [data, metrics])

  const SectionHeader = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <span className="w-1 h-5 rounded-full inline-block" style={{ background: 'linear-gradient(180deg, #38bdf8, #818cf8)' }} />
          Actual Generation vs Decision-Time Forecast
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
          Day-ahead locked forecast vs real-time outturns — All timestamps UTC
        </p>
      </div>
      <button
        id="btn-toggle-band"
        onClick={() => setShowBand(!showBand)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
        style={
          showBand
            ? { background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }
            : { background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-2)' }
        }
      >
        {showBand ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {showBand ? 'Hide P5–P95 Band' : 'Show P5–P95 Band'}
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        {SectionHeader}
        <div className="h-[400px] flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
          <div className="flex items-center gap-2 text-sm">
            <Layers className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
            Loading time series data…
          </div>
        </div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-[400px] flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
        No generation data available for this range.
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {SectionHeader}

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="timeFormatted"
              stroke={chart.axis}
              fontSize={11}
              tickLine={false}
              minTickGap={36}
              tick={{ fill: chart.axis }}
            />
            <YAxis
              stroke={chart.axis}
              fontSize={11}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
              unit=" MW"
              tick={{ fill: chart.axis }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as typeof chartData[0]
                const err = d.error
                return (
                  <div
                    className="rounded-xl p-4 shadow-2xl text-xs space-y-2 min-w-[250px]"
                    style={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, color: chart.tooltipText }}
                  >
                    <div className="font-semibold border-b pb-2" style={{ borderColor: chart.tooltipBorder }}>
                      Target:{' '}
                      <span className="font-mono" style={{ color: 'var(--accent)' }}>
                        {d.startTime.replace('T', ' ').replace('Z', ' UTC')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <span style={{ color: 'var(--text-2)' }}>Actual:</span>
                      <span className="text-right font-mono font-bold" style={{ color: '#34d399' }}>{d.actual.toLocaleString()} MW</span>
                      <span style={{ color: 'var(--text-2)' }}>Forecast:</span>
                      <span className="text-right font-mono font-bold" style={{ color: '#38bdf8' }}>{d.forecast.toLocaleString()} MW</span>
                      <span style={{ color: 'var(--text-2)' }}>Error (F−A):</span>
                      <span
                        className="text-right font-mono font-bold"
                        style={{ color: err > 0 ? '#f59e0b' : '#34d399' }}
                      >
                        {err > 0 ? `+${err.toLocaleString()}` : err.toLocaleString()} MW
                      </span>
                      <span style={{ color: 'var(--text-2)' }}>Horizon:</span>
                      <span className="text-right font-mono" style={{ color: '#c084fc' }}>{d.horizonHours}h</span>
                    </div>
                    <div className="pt-1.5 border-t text-[10px]" style={{ borderColor: chart.tooltipBorder, color: 'var(--text-3)' }}>
                      Published: {d.publishTime.replace('T', ' ').replace('Z', ' UTC')}
                    </div>
                  </div>
                )
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '4px', color: chart.axis }}
            />

            {showBand && (
              <Area
                type="monotone"
                dataKey="band"
                stroke="none"
                fill={isDark ? '#38bdf8' : '#0284c7'}
                fillOpacity={isDark ? 0.07 : 0.06}
                name="Empirical Planning Envelope (P5–P95)"
                legendType="rect"
              />
            )}

            <Line
              type="monotone"
              dataKey="actual"
              stroke="#34d399"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 5, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
              name="Actual Generation"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={isDark ? '#38bdf8' : '#0284c7'}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 5, fill: isDark ? '#38bdf8' : '#0284c7', stroke: '#0c4a6e', strokeWidth: 2 }}
              name="Decision-Time Forecast"
            />

            <Brush
              dataKey="timeFormatted"
              height={28}
              stroke={chart.brushStroke}
              fill={chart.brushFill}
              tickFormatter={() => ''}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
