import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Brush,
  CartesianGrid,
} from 'recharts'
import { ComparisonRecord, MetricsResponse } from '../types'
import { Eye, EyeOff, Layers } from 'lucide-react'

interface MainComparisonChartProps {
  data: ComparisonRecord[]
  metrics?: MetricsResponse
  isLoading: boolean
}

export const MainComparisonChart: React.FC<MainComparisonChartProps> = ({
  data,
  metrics,
  isLoading,
}) => {
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true)

  // Pre-calculate band boundaries for each point:
  // Forecast + P5 error to Forecast + P95 error
  const chartData = useMemo(() => {
    if (!data.length) return []
    const p5 = metrics?.error_p5 ?? -1000
    const p95 = metrics?.error_p95 ?? 4000

    return data.map((item) => {
      const lower = Math.max(0, item.forecast - (p95 > 0 ? p95 : 0))
      const upper = item.forecast - (p5 < 0 ? p5 : 0)
      return {
        ...item,
        timeFormatted: item.startTime.substring(5, 16).replace('T', ' '),
        band: [Math.round(lower), Math.round(upper)],
      }
    })
  }, [data, metrics])

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 mb-6 h-96 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse flex items-center gap-2">
          <Layers className="w-5 h-5 animate-spin text-sky-400" />
          Loading time series data...
        </div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="glass-panel rounded-2xl p-6 mb-6 h-96 flex items-center justify-center text-slate-500 text-sm">
        No generation data available for this range.
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            Actual Generation vs Decision-Time Forecast
          </h2>
          <p className="text-xs text-slate-400">
            Evaluating day-ahead locked forecast against real-time outturns (All timestamps UTC)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              showConfidenceBand
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showConfidenceBand ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showConfidenceBand ? 'Hide Empirical Band' : 'Show Empirical Band (P5–P95)'}</span>
          </button>
        </div>
      </div>

      {/* Main Recharts ComposedChart */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timeFormatted"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={35}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
              unit=" MW"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const d = payload[0].payload as (typeof chartData)[0]
                const err = d.error
                return (
                  <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[240px]">
                    <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5">
                      Target Time: <span className="text-white font-mono">{d.startTime.replace('T', ' ').replace('Z', ' UTC')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
                      <div>Actual Generation:</div>
                      <div className="text-right font-mono font-bold text-emerald-400">
                        {d.actual.toLocaleString()} MW
                      </div>

                      <div>Selected Forecast:</div>
                      <div className="text-right font-mono font-bold text-sky-400">
                        {d.forecast.toLocaleString()} MW
                      </div>

                      <div>Signed Error (F - A):</div>
                      <div
                        className={`text-right font-mono font-bold ${
                          err > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {err > 0 ? `+${err.toLocaleString()}` : err.toLocaleString()} MW
                      </div>

                      <div>Lead Horizon:</div>
                      <div className="text-right font-mono text-purple-300">
                        {d.horizonHours} hours
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-500">
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
              wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
            />

            {/* Shaded typical error range (P5 to P95 error band) */}
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="band"
                stroke="none"
                fill="#38bdf8"
                fillOpacity={0.08}
                name="Empirical Planning Envelope (P5–P95)"
                legendType="rect"
              />
            )}

            {/* Actual Outturn Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
              name="Actual Generation"
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#38bdf8"
              strokeWidth={2.2}
              dot={false}
              strokeDasharray={showConfidenceBand ? undefined : undefined}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0c4a6e', strokeWidth: 2 }}
              name="Decision-Time Forecast"
            />

            {/* Brush for zooming and timeline panning */}
            <Brush
              dataKey="timeFormatted"
              height={30}
              stroke="#38bdf8"
              fill="#0f172a"
              tickFormatter={() => ''}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
