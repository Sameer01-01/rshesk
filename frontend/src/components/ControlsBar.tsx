import React from 'react'
import { Calendar, Clock, Sliders, Info, RotateCcw } from 'lucide-react'
import { FilterParams } from '../types'

interface ControlsBarProps {
  filters: FilterParams
  onFiltersChange: (newFilters: FilterParams) => void
  onReset: () => void
}

const PRESETS = [
  { label: 'Full Month',  start: '2026-01-01T00:00:00Z', end: '2026-01-31T23:59:59Z' },
  { label: 'Week 1',      start: '2026-01-01T00:00:00Z', end: '2026-01-07T23:59:59Z' },
  { label: 'Week 2',      start: '2026-01-08T00:00:00Z', end: '2026-01-14T23:59:59Z' },
  { label: 'Week 3',      start: '2026-01-15T00:00:00Z', end: '2026-01-21T23:59:59Z' },
  { label: 'Week 4',      start: '2026-01-22T00:00:00Z', end: '2026-01-28T23:59:59Z' },
  { label: 'Peak Volatility', start: '2026-01-15T00:00:00Z', end: '2026-01-15T23:59:59Z' },
]

export const ControlsBar: React.FC<ControlsBarProps> = ({ filters, onFiltersChange, onReset }) => {
  const activePreset = PRESETS.find(p => p.start === filters.start && p.end === filters.end)

  const handlePresetClick = (p: typeof PRESETS[0]) =>
    onFiltersChange({ ...filters, start: p.start, end: p.end })

  const toLocalInputValue = (iso: string) => {
    try { return iso.substring(0, 16) } catch { return '2026-01-01T00:00' }
  }

  const handleStartChange = (v: string) => {
    if (!v) return
    onFiltersChange({ ...filters, start: `${v}:00Z` })
  }
  const handleEndChange = (v: string) => {
    if (!v) return
    onFiltersChange({ ...filters, end: `${v}:59Z` })
  }

  const labelStyle = { color: 'var(--text-2)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const }
  const sectionTitle = (icon: React.ReactNode, text: string) => (
    <div className="flex items-center gap-1.5 mb-2" style={labelStyle}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      {text}
    </div>
  )

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {/* ── Presets Row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          {sectionTitle(<Calendar className="w-3.5 h-3.5" />, 'Quick Periods')}
          {PRESETS.map(p => {
            const active = activePreset?.label === p.label
            return (
              <button
                key={p.label}
                onClick={() => handlePresetClick(p)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 active:scale-95"
                style={
                  active
                    ? {
                        background: 'var(--accent)',
                        color: '#ffffff',
                        boxShadow: '0 2px 12px var(--accent-soft)',
                      }
                    : {
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-2)',
                      }
                }
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 self-end lg:self-center"
          style={{ color: 'var(--text-2)', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* ── Configuration Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Window Start */}
        <div>
          {sectionTitle(<Calendar className="w-3.5 h-3.5" />, 'Window Start (UTC)')}
          <input
            type="datetime-local"
            min="2026-01-01T00:00"
            max="2026-01-31T23:59"
            value={toLocalInputValue(filters.start)}
            onChange={e => handleStartChange(e.target.value)}
            className="wfm-input"
          />
        </div>

        {/* Window End */}
        <div>
          {sectionTitle(<Calendar className="w-3.5 h-3.5" />, 'Window End (UTC)')}
          <input
            type="datetime-local"
            min="2026-01-01T00:00"
            max="2026-01-31T23:59"
            value={toLocalInputValue(filters.end)}
            onChange={e => handleEndChange(e.target.value)}
            className="wfm-input"
          />
        </div>

        {/* Mode Toggle */}
        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-5">
          <div className="flex-1">
            {sectionTitle(<Sliders className="w-3.5 h-3.5" />, 'Evaluation Mode')}
            <div
              className="grid grid-cols-2 p-1 rounded-xl"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
            >
              {(['decision', 'horizon'] as const).map(m => {
                const active = filters.mode === m
                return (
                  <button
                    key={m}
                    onClick={() => onFiltersChange({ ...filters, mode: m })}
                    className="py-2 text-xs font-semibold rounded-lg transition-all duration-200"
                    style={
                      active
                        ? {
                            background: 'var(--accent)',
                            color: '#ffffff',
                            boxShadow: '0 2px 10px var(--accent-soft)',
                          }
                        : { color: 'var(--text-3)' }
                    }
                  >
                    {m === 'decision' ? 'Day-Ahead Cutoff' : 'Fixed Horizon'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conditional: Cutoff selector or Horizon slider */}
          {filters.mode === 'decision' ? (
            <div className="w-full sm:w-48">
              <div className="flex items-center justify-between mb-2">
                {sectionTitle(<Clock className="w-3.5 h-3.5" />, 'Cutoff on D-1')}
                <Info
                  className="w-3.5 h-3.5 cursor-help mb-2"
                  style={{ color: 'var(--text-3)' }}
                  title="Day-ahead gate closure — 09:00 UTC allows preparation margin before UK D-1 auction."
                />
              </div>
              <select
                value={filters.cutoffHour}
                onChange={e => onFiltersChange({ ...filters, cutoffHour: Number(e.target.value) })}
                className="wfm-input"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00 UTC (D-1){i === 9 ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full sm:w-52">
              <div className="flex items-center justify-between mb-2">
                {sectionTitle(<Sliders className="w-3.5 h-3.5" />, `Horizon: ${filters.horizonHours}h`)}
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="1"
                value={filters.horizonHours}
                onChange={e => onFiltersChange({ ...filters, horizonHours: Number(e.target.value) })}
                className="w-full mt-1"
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
                <span>0h</span>
                <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{filters.horizonHours}h selected</span>
                <span>48h</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
