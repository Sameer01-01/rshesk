import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { HorizonMetric } from '../types'
import { Hourglass, TrendingUp } from 'lucide-react'

interface HorizonAnalysisChartProps {
  data: HorizonMetric[]
  isLoading: boolean
}

export const HorizonAnalysisChart: React.FC<HorizonAnalysisChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 mb-6 h-72 flex items-center justify-center animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded"></div>
      </div>
    )
  }

  if (!data.length) return null

  const h0 = data[0]
  const h48 = data[data.length - 1]
  const growthPct =
    h0 && h48 && h0.mae > 0 ? (((h48.mae - h0.mae) / h0.mae) * 100).toFixed(1) : '0'

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-sky-400" />
            Accuracy Degradation vs Forecast Horizon (0 to 48 Hours)
          </h3>
          <p className="text-xs text-slate-400">
            How error compounds as lead time increases from real-time dispatch (0h) to day-ahead gate closure (24–36h)
          </p>
        </div>

        {/* Takeaway badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          <span>
            +{growthPct}% error degradation from 0h to {h48.horizonHours}h
          </span>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="horizonHours"
              stroke="#64748b"
              fontSize={11}
              unit="h"
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              tickLine={false}
              unit=" MW"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const d = payload[0].payload as HorizonMetric
                return (
                  <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[200px] font-mono">
                    <div className="font-bold text-white border-b border-slate-800 pb-1">
                      Horizon: {d.horizonHours} Hours Lead Time
                    </div>
                    <div className="flex justify-between text-sky-400">
                      <span>MAE:</span>
                      <strong>{d.mae.toLocaleString()} MW</strong>
                    </div>
                    <div className="flex justify-between text-indigo-400">
                      <span>RMSE:</span>
                      <strong>{d.rmse.toLocaleString()} MW</strong>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>Bias:</span>
                      <strong>{d.bias > 0 ? `+${d.bias.toLocaleString()}` : d.bias.toLocaleString()} MW</strong>
                    </div>
                    <div className="flex justify-between text-purple-400">
                      <span>P90 Error:</span>
                      <strong>±{d.p90AbsError.toLocaleString()} MW</strong>
                    </div>
                  </div>
                )
              }}
            />
            <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="mae"
              stroke="#38bdf8"
              strokeWidth={2.5}
              activeDot={{ r: 6 }}
              name="Mean Absolute Error (MAE)"
            />
            <Line
              type="monotone"
              dataKey="rmse"
              stroke="#818cf8"
              strokeWidth={2}
              strokeDasharray="4 4"
              name="RMSE (Outlier Penalized)"
            />
            <Line
              type="monotone"
              dataKey="p90AbsError"
              stroke="#c084fc"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              name="P90 Error Buffer"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
