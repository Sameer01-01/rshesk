import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts'
import { ComparisonRecord } from '../types'
import { BarChart3, TrendingDown } from 'lucide-react'

interface ErrorChartsProps {
  data: ComparisonRecord[]
}

export const ErrorCharts: React.FC<ErrorChartsProps> = ({ data }) => {
  // Timeline formatted data
  const timeData = useMemo(() => {
    return data.map((d) => ({
      time: d.startTime.substring(5, 16).replace('T', ' '),
      error: Math.round(d.error),
      actual: d.actual,
      forecast: d.forecast,
    }))
  }, [data])

  // Build histogram bins for signed error (e.g., bins of 1000 MW from -4000 to +8000)
  const histogramData = useMemo(() => {
    if (!data.length) return []
    const binSize = 1000
    const errors = data.map((d) => d.error)
    const minErr = Math.floor(Math.min(...errors) / binSize) * binSize
    const maxErr = Math.ceil(Math.max(...errors) / binSize) * binSize

    const bins: Record<number, number> = {}
    for (let b = minErr; b <= maxErr; b += binSize) {
      bins[b] = 0
    }

    errors.forEach((e) => {
      const b = Math.floor(e / binSize) * binSize
      if (bins[b] !== undefined) {
        bins[b]++
      }
    })

    return Object.entries(bins).map(([binStart, count]) => {
      const startNum = Number(binStart)
      return {
        bin: `${startNum >= 0 ? '+' : ''}${startNum / 1000}k to ${startNum + binSize >= 0 ? '+' : ''}${(startNum + binSize) / 1000}k`,
        count,
        binStart: startNum,
      }
    })
  }, [data])

  if (!data.length) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 1. Signed Error Over Time */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-sky-400" />
              Signed Error Over Time (Forecast − Actual)
            </h3>
            <p className="text-xs text-slate-400">
              Positive values indicate over-generation forecasts (shortage risk)
            </p>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} minTickGap={30} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`}
                tickLine={false}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 shadow-lg text-xs font-mono">
                      <div className="text-slate-400">{d.time} UTC</div>
                      <div className={d.error >= 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        Error: {d.error > 0 ? `+${d.error.toLocaleString()}` : d.error.toLocaleString()} MW
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="error" radius={[2, 2, 0, 0]}>
                {timeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.error >= 0 ? '#f59e0b' : '#10b981'}
                    fillOpacity={0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Error Distribution Histogram */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Error Frequency Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Sample count per 1,000 MW error bin (revealing skewness and kurtosis)
            </p>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="bin" stroke="#64748b" fontSize={9} interval={0} angle={-30} textAnchor="end" height={45} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 shadow-lg text-xs font-mono">
                      <div className="text-slate-300">Bin: {d.bin} MW</div>
                      <div className="text-purple-400 font-bold">Hours: {d.count}</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
