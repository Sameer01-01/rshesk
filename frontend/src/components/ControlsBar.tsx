import React from 'react'
import { Calendar, Clock, Sliders, Info, RotateCcw } from 'lucide-react'
import { FilterParams } from '../types'

interface ControlsBarProps {
  filters: FilterParams
  onFiltersChange: (newFilters: FilterParams) => void
  onReset: () => void
}

const PRESETS = [
  { label: 'Full Month', start: '2026-01-01T00:00:00Z', end: '2026-01-31T23:59:59Z' },
  { label: 'Week 1', start: '2026-01-01T00:00:00Z', end: '2026-01-07T23:59:59Z' },
  { label: 'Week 2', start: '2026-01-08T00:00:00Z', end: '2026-01-14T23:59:59Z' },
  { label: 'Week 3', start: '2026-01-15T00:00:00Z', end: '2026-01-21T23:59:59Z' },
  { label: 'Week 4', start: '2026-01-22T00:00:00Z', end: '2026-01-28T23:59:59Z' },
  { label: 'Peak Volatility (Jan 15)', start: '2026-01-15T00:00:00Z', end: '2026-01-15T23:59:59Z' },
]

export const ControlsBar: React.FC<ControlsBarProps> = ({ filters, onFiltersChange, onReset }) => {
  const activePreset = PRESETS.find(
    (p) => p.start === filters.start && p.end === filters.end
  )

  const handlePresetClick = (preset: (typeof PRESETS)[0]) => {
    onFiltersChange({
      ...filters,
      start: preset.start,
      end: preset.end,
    })
  }

  // Format datetime-local strings
  const toLocalInputValue = (isoStr: string) => {
    try {
      return isoStr.substring(0, 16)
    } catch {
      return '2026-01-01T00:00'
    }
  }

  const handleStartChange = (val: string) => {
    if (!val) return
    onFiltersChange({
      ...filters,
      start: `${val}:00Z`,
    })
  }

  const handleEndChange = (val: string) => {
    if (!val) return
    onFiltersChange({
      ...filters,
      end: `${val}:59Z`,
    })
  }

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Presets:
          </span>
          {PRESETS.map((p) => {
            const isActive = activePreset?.label === p.label
            return (
              <button
                key={p.label}
                onClick={() => handlePresetClick(p)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Reset Action */}
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors self-end lg:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Primary Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* Date Range Start */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Window Start (UTC, Jan 2026)
          </label>
          <input
            type="datetime-local"
            min="2026-01-01T00:00"
            max="2026-01-31T23:59"
            value={toLocalInputValue(filters.start)}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        {/* Date Range End */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Window End (UTC, Jan 2026)
          </label>
          <input
            type="datetime-local"
            min="2026-01-01T00:00"
            max="2026-01-31T23:59"
            value={toLocalInputValue(filters.end)}
            onChange={(e) => handleEndChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        {/* Mode Toggle & Cutoff / Horizon Controls */}
        <div className="sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Mode Segmented Toggle */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Evaluation Mode
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, mode: 'decision' })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filters.mode === 'decision'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Day-Ahead Cutoff
              </button>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, mode: 'horizon' })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filters.mode === 'horizon'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fixed Horizon
              </button>
            </div>
          </div>

          {/* Conditional Control: Cutoff selector vs Horizon slider */}
          {filters.mode === 'decision' ? (
            <div className="w-full sm:w-44">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Cutoff on D-1
                </label>
                <span
                  className="cursor-pointer text-slate-400 hover:text-sky-400"
                  title="Day-ahead auction gate closure margin. Orders are placed late morning, 09:00 UTC allows margin to prepare bids."
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <select
                value={filters.cutoffHour}
                onChange={(e) => onFiltersChange({ ...filters, cutoffHour: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00 UTC (D-1) {i === 9 ? '★ Default' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full sm:w-48">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  Lead Horizon: <strong className="text-sky-300 font-mono">{filters.horizonHours}h</strong>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="1"
                value={filters.horizonHours}
                onChange={(e) => onFiltersChange({ ...filters, horizonHours: Number(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
