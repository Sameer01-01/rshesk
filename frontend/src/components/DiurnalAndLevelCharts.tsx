import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { HourMetric, LevelMetric } from '../types'
import { Clock, Gauge } from 'lucide-react'

interface DiurnalAndLevelChartsProps {
  hourData: HourMetric[]
  levelData: LevelMetric[]
}

export const DiurnalAndLevelCharts: React.FC<DiurnalAndLevelChartsProps> = ({
  hourData,
  levelData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 1. Hour-of-Day Diurnal Error Profile */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Diurnal Error Profile (Hour of Day UTC)
            </h3>
            <p className="text-xs text-slate-400">
              Mean absolute error across the 24 hours of delivery day
            </p>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(h) => `${String(h).padStart(2, '0')}h`}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const d = payload[0].payload as HourMetric
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 shadow-lg text-xs font-mono space-y-1">
                      <div className="text-white font-bold">{String(d.hour).padStart(2, '0')}:00 UTC</div>
                      <div className="text-sky-400">MAE: {d.mae.toLocaleString()} MW</div>
                      <div className="text-amber-400">Bias: {d.bias > 0 ? `+${d.bias.toLocaleString()}` : d.bias.toLocaleString()} MW</div>
                      <div className="text-slate-400 text-[10px]">Mean Gen: {d.meanActual.toLocaleString()} MW</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="mae" fill="#0284c7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Error by Actual Generation Regime */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              Forecast Accuracy by Wind Generation Regime
            </h3>
            <p className="text-xs text-slate-400">
              Low (&lt;7 GW), Medium (7–13 GW), and High (&gt;13 GW) system load regimes
            </p>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="regime" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const d = payload[0].payload as LevelMetric
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 shadow-lg text-xs font-mono space-y-1">
                      <div className="text-white font-bold">{d.regime}</div>
                      <div className="text-sky-400">MAE: {d.mae.toLocaleString()} MW ({d.nmaePct}% of regime mean)</div>
                      <div className="text-indigo-400">RMSE: {d.rmse.toLocaleString()} MW</div>
                      <div className="text-amber-400">Bias: {d.bias > 0 ? `+${d.bias.toLocaleString()}` : d.bias.toLocaleString()} MW</div>
                      <div className="text-slate-400 text-[10px]">Hours Evaluated: {d.count}</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="mae" radius={[4, 4, 0, 0]}>
                {levelData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={['#38bdf8', '#818cf8', '#c084fc'][index % 3]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
