import React, { useEffect } from 'react'
import { X, ShieldAlert, BookOpen, Clock, Target, Layers } from 'lucide-react'

interface MethodologyModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  // Trap keyboard escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sections = [
    {
      icon: <Clock className="w-4 h-4" />,
      title: '1. Day-Ahead Decision Cutoff & Zero Look-Ahead Leakage',
      color: '#38bdf8',
      content: (
        <>
          <p className="mb-2">
            UK wholesale electricity auctions (EPEX SPOT & Nord Pool GB Day-Ahead) close at 11:00 UTC on D-1.
            Power procurement desks finalize purchase orders by late morning to submit optimal physical bids.
          </p>
          <p className="mb-2">
            <strong>Strict Decision Rule:</strong> For any delivery hour on date <em>D</em>, the decision-time forecast is:
          </p>
          <div
            className="p-3 rounded-lg text-[11px] mb-2"
            style={{
              background: 'rgba(56,189,248,0.06)',
              border: '1px solid rgba(56,189,248,0.2)',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#38bdf8',
            }}
          >
            Selected(T) = argmax_{'publishTime'} [ WINDFOR(publish, T) | publish ≤ Cutoff(D-1 09:00 UTC) ]
          </div>
          <p>Any forecast published after 09:00 UTC on D-1 is strictly excluded to prevent look-ahead bias.</p>
        </>
      ),
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: '2. Quantitative Error Metric Definitions',
      color: '#34d399',
      content: (
        <ul className="space-y-2 list-disc list-inside">
          {[
            ['Error', 'eᵢ = Forecastᵢ − Actualᵢ', 'Positive = over-forecast (thermal top-up required).'],
            ['MAE', '(1/N) Σ |eᵢ|', 'Expected day-ahead volume deviation — primary trading benchmark.'],
            ['RMSE', '√((1/N) Σ eᵢ²)', 'Penalises large ramp misses — key for tail-risk sizing.'],
            ['NMAE', 'MAE / Mean(Actual) × 100%', 'Error relative to actual wind output — regime comparable.'],
            ['sMAPE', '(100%/N) Σ (2|F−A|/(|A|+|F|))', 'Percentage error guarded against division by zero.'],
            ['P90 Buffer', '90th pctile of |eᵢ|', 'Empirical thermal reserve — 90% historical coverage confidence.'],
          ].map(([name, formula, desc]) => (
            <li key={name}>
              <strong style={{ color: 'var(--text-1)' }}>{name}:</strong>{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#34d399', fontSize: 11 }}>{formula}</span>{' '}
              — {desc}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: <Layers className="w-4 h-4" />,
      title: '3. Dataset Resolution & Alignment Strategy',
      color: '#c084fc',
      content: (
        <>
          <p className="mb-2">
            Elexon BMRS provides <strong>FUELHH</strong> (actual outturns) at 30-minute settlement period resolution
            (1,488 records in Jan 2026) and <strong>WINDFOR</strong> (forecasts) at 60-minute hourly resolution.
          </p>
          <p>
            An exact inner join on <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c084fc' }}>startTime</span>{' '}
            evaluates all <strong>744 hourly delivery targets</strong> in January 2026 (100% hourly coverage).
          </p>
        </>
      ),
    },
    {
      icon: <ShieldAlert className="w-4 h-4" />,
      title: '4. Timezone & Offline Guarantees',
      color: '#f59e0b',
      content: (
        <>
          <p className="mb-1">• In January, the UK observes GMT — UTC is identical to local clock time.</p>
          <p>• The application runs completely offline using bundled Parquet files. Zero external API dependencies at runtime.</p>
        </>
      ),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Close button */}
        <button
          id="btn-close-methodology"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl transition-all duration-200 hover:scale-110 z-10"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>
                Methodology &amp; Operational Assumptions
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                Technical specifications for the UK Day-Ahead Wind Forecast Monitor
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="p-6 space-y-4">
          {sections.map(sec => (
            <div
              key={sec.title}
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
            >
              <h3
                className="text-sm font-bold flex items-center gap-2 mb-3"
                style={{ color: sec.color }}
              >
                {sec.icon}
                {sec.title}
              </h3>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {sec.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', boxShadow: '0 2px 12px rgba(14,165,233,0.3)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
