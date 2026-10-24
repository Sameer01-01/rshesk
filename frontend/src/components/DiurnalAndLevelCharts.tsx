import React from 'react'
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'
import { HourMetric, LevelMetric } from '../types'
import { Clock, Gauge } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface DiurnalAndLevelChartsProps {
  hourData: HourMetric[]
  levelData: LevelMetric[]
}

export const DiurnalAndLevelCharts: React.FC<DiurnalAndLevelChartsProps> = ({ hourData, levelData }) => {
  const { chart } = useTheme()

  const tooltipBase = {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    color: chart.tooltipText,
  }

  const CardHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; color: string }> = ({ icon, title, subtitle, color }) => (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-lg shrink-0" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{title}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{subtitle}</p>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Diurnal Profile */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <CardHeader
          icon={<Clock className="w-4 h-4" />}
          title="Diurnal Error Profile (Hour of Day UTC)"
          subtitle="Mean absolute error across delivery hours — reveals systematic time-of-day forecast patterns"
          color="#38bdf8"
        />
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis
                dataKey="hour"
                stroke={chart.axis}
                fontSize={10}
                tickFormatter={h => `${String(h).padStart(2, '0')}h`}
                tickLine={false}
                tick={{ fill: chart.axis }}
              />
              <YAxis
                stroke={chart.axis}
                fontSize={10}
                tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                tickLine={false}
                tick={{ fill: chart.axis }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as HourMetric
                  return (
                    <div style={tooltipBase}>
                      <div style={{ fontWeight: 700, color: chart.tooltipText, marginBottom: 6 }}>
                        {String(d.hour).padStart(2, '0')}:00 UTC
                      </div>
                      <div style={{ color: '#38bdf8' }}>MAE: {d.mae.toLocaleString()} MW</div>
                      <div style={{ color: '#f59e0b' }}>Bias: {d.bias > 0 ? `+${d.bias.toLocaleString()}` : d.bias.toLocaleString()} MW</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 4 }}>
                        Mean Gen: {d.meanActual.toLocaleString()} MW
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="mae" fill="#0284c7" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wind Regime Breakdown */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <CardHeader
          icon={<Gauge className="w-4 h-4" />}
          title="Accuracy by Wind Generation Regime"
          subtitle="Low (&lt;7 GW), Medium (7–13 GW), High (&gt;13 GW) — reveals conditional error patterns"
          color="#34d399"
        />
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="regime" stroke={chart.axis} fontSize={10} tickLine={false} tick={{ fill: chart.axis }} />
              <YAxis
                stroke={chart.axis}
                fontSize={10}
                tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                tickLine={false}
                tick={{ fill: chart.axis }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as LevelMetric
                  return (
                    <div style={tooltipBase}>
                      <div style={{ fontWeight: 700, color: chart.tooltipText, marginBottom: 6 }}>{d.regime}</div>
                      <div style={{ color: '#38bdf8' }}>MAE: {d.mae.toLocaleString()} MW ({d.nmaePct}% of mean)</div>
                      <div style={{ color: '#818cf8' }}>RMSE: {d.rmse.toLocaleString()} MW</div>
                      <div style={{ color: '#f59e0b' }}>Bias: {d.bias > 0 ? `+${d.bias.toLocaleString()}` : d.bias.toLocaleString()} MW</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 4 }}>
                        Hours: {d.count}
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="mae" radius={[4, 4, 0, 0]}>
                {levelData.map((_, i) => (
                  <Cell key={i} fill={['#38bdf8', '#818cf8', '#c084fc'][i % 3]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
