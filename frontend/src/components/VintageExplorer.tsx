import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { History, Calendar, CheckCircle, Clock } from 'lucide-react'

interface VintageExplorerProps {
  cutoffHour: number
}

// Sample target times for quick selection in January 2026
const SAMPLE_TARGETS = [
  { label: 'Jan 05 12:00 UTC', val: '2026-01-05T12:00:00Z' },
  { label: 'Jan 10 18:00 UTC (Ramp)', val: '2026-01-10T18:00:00Z' },
  { label: 'Jan 15 14:00 UTC (Peak)', val: '2026-01-15T14:00:00Z' },
  { label: 'Jan 20 08:00 UTC', val: '2026-01-20T08:00:00Z' },
  { label: 'Jan 25 20:00 UTC', val: '2026-01-25T20:00:00Z' },
  { label: 'Jan 30 12:00 UTC', val: '2026-01-30T12:00:00Z' },
]

export const VintageExplorer: React.FC<VintageExplorerProps> = ({ cutoffHour }) => {
  const [targetTime, setTargetTime] = useState<string>('2026-01-15T14:00:00Z')

  const { data, isLoading } = useQuery({
    queryKey: ['vintages', targetTime, cutoffHour],
    queryFn: () => api.getVintages(targetTime, cutoffHour),
  })

  const chartData = (data?.vintages || []).map((v) => ({
    publishFormatted: v.publishTime.substring(5, 16).replace('T', ' '),
    publishTime: v.publishTime,
    forecast: v.forecast,
    horizonHours: v.horizonHours,
    isDecisionSelected: v.isDecisionSelected,
    isBeforeCutoff: v.isBeforeCutoff,
  }))

  const selectedVintage = data?.vintages.find((v) => v.isDecisionSelected)

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            Forecast Vintage Explorer (Evolution Prior to Delivery)
          </h3>
          <p className="text-xs text-slate-400">
            Inspect how successive forecast publications evolved over 72h before gate closure locked the decision
          </p>
        </div>

        {/* Target Time Quick Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            Target:
          </span>
          {SAMPLE_TARGETS.map((s) => (
            <button
              key={s.val}
              onClick={() => setTargetTime(s.val)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                targetTime === s.val
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Delivery Status Header */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400">Target Delivery Time:</span>
            <div className="text-sm font-bold text-white font-mono mt-0.5">
              {data.targetTime.replace('T', ' ').replace('Z', ' UTC')}
            </div>
          </div>

          <div>
            <span className="text-slate-400">Decision Cutoff (D-1):</span>
            <div className="text-sm font-bold text-sky-400 font-mono mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {data.cutoffTime.replace('T', ' ').replace('Z', ' UTC')}
            </div>
          </div>

          <div>
            <span className="text-slate-400">Actual Outturn Generation:</span>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {data.actualGeneration !== null ? `${data.actualGeneration.toLocaleString()} MW` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm animate-pulse">
          Loading forecast vintages...
        </div>
      ) : !chartData.length ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          No vintages recorded for this target time.
        </div>
      ) : (
        <div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="publishFormatted"
                  stroke="#64748b"
                  fontSize={10}
                  angle={-25}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  unit=" MW"
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const d = payload[0].payload as (typeof chartData)[0]
                    return (
                      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 font-mono">
                        <div className="text-slate-300 font-bold border-b border-slate-800 pb-1">
                          Published: {d.publishTime.replace('T', ' ').replace('Z', ' UTC')}
                        </div>
                        <div className="text-purple-400">Forecast: {d.forecast.toLocaleString()} MW</div>
                        <div className="text-slate-400">Lead Horizon: {d.horizonHours} hours</div>
                        {d.isDecisionSelected && (
                          <div className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            ★ Selected Decision Cutoff Forecast
                          </div>
                        )}
                        {!d.isBeforeCutoff && (
                          <div className="text-amber-400 font-semibold text-[10px]">
                            ⚠ Post-Cutoff (Look-Ahead Leakage if used)
                          </div>
                        )}
                      </div>
                    )
                  }}
                />

                {/* Actual Outturn Line */}
                {data && data.actualGeneration !== null && data.actualGeneration !== undefined && (
                  <ReferenceLine
                    y={data.actualGeneration}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{
                      value: `Actual Outturn: ${data.actualGeneration.toLocaleString()} MW`,
                      fill: '#10b981',
                      fontSize: 11,
                      position: 'insideTopRight',
                    }}
                  />
                )}

                {/* Evolution Line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    if (payload.isDecisionSelected) {
                      return (
                        <circle
                          key={`dot-${payload.publishTime}`}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#38bdf8"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )
                    }
                    return (
                      <circle
                        key={`dot-${payload.publishTime}`}
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill="#c084fc"
                      />
                    )
                  }}
                  name="Forecast Evolution"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Decision Locked Callout */}
          {selectedVintage && (
            <div className="mt-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between text-xs text-sky-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-400" />
                <span>
                  <strong>Locked Decision Forecast:</strong> {selectedVintage.forecast.toLocaleString()} MW published at{' '}
                  {selectedVintage.publishTime.replace('T', ' ').replace('Z', ' UTC')} ({selectedVintage.horizonHours}h lead time).
                </span>
              </div>
              {data && data.actualGeneration !== null && data.actualGeneration !== undefined && (
                <span className="font-mono font-bold">
                  Error: {(selectedVintage.forecast - data.actualGeneration > 0 ? '+' : '')}
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
