import React from 'react'
import { X, ShieldAlert, BookOpen, Clock, Target, Layers } from 'lucide-react'

interface MethodologyModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Methodology & Operational Assumptions</h2>
            <p className="text-xs text-slate-400">
              Technical specifications for the UK Day-Ahead Wind Forecast Monitor
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. Decision Cutoff Logic & Leakage Protection */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              1. Day-Ahead Decision Cutoff & Zero Look-Ahead Leakage
            </h3>
            <p className="mb-2">
              UK wholesale electricity auctions (EPEX SPOT & Nord Pool GB Day-Ahead) close at 11:00 UTC / 12:00 CET on day D-1.
              Power procurement desks finalize purchase orders by late morning to submit optimal physical bids.
            </p>
            <p className="mb-2">
              <strong>Strict Decision Rule:</strong> For any delivery hour on date <em>D</em>, the decision-time forecast is defined as:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-sky-300 border border-slate-800 mb-2">
              Selected Forecast(T) = argmax_{'{publishTime}'} [ WINDFOR(publishTime, T) | publishTime &le; Cutoff(D-1 09:00 UTC) ]
            </div>
            <p>
              Any forecast published after 09:00 UTC on D-1 is strictly excluded to prevent retrospective look-ahead bias.
            </p>
          </div>

          {/* 2. Metrics Definitions */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" />
              2. Quantitative Error Metric Definitions
            </h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>Error:</strong> <span className="font-mono text-slate-200">e_i = Forecast_i - Actual_i</span>. Positive means over-forecasting (requiring thermal top-up).
              </li>
              <li>
                <strong>Mean Absolute Error (MAE):</strong> <span className="font-mono text-slate-200">(1/N) &sum; |e_i|</span>. The expected day-ahead volume deviation.
              </li>
              <li>
                <strong>Root Mean Squared Error (RMSE):</strong> <span className="font-mono text-slate-200">&radic;((1/N) &sum; e_i&sup2;)</span>. Strongly penalizes large forecast ramp misses.
              </li>
              <li>
                <strong>Normalized MAE (NMAE):</strong> <span className="font-mono text-slate-200">MAE / Mean(Actual) &times; 100%</span>. Expresses error relative to actual national wind output.
              </li>
              <li>
                <strong>Symmetric MAPE (sMAPE):</strong> <span className="font-mono text-slate-200">(100%/N) &sum; (2|F - A| / (|A| + |F|))</span>. Division-by-zero guarded percentage error.
              </li>
              <li>
                <strong>P90 Planning Buffer:</strong> 90th percentile of absolute error. If traders maintain this reserve margin above the wind forecast, they have 90% empirical confidence against wind shortfall.
              </li>
            </ul>
          </div>

          {/* 3. Temporal Alignment & Data Coverage */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4" />
              3. Dataset Resolutions & Alignment Strategy
            </h3>
            <p className="mb-2">
              Elexon BMRS provides <strong>FUELHH</strong> (Actual outturns) at 30-minute settlement period resolution (1,488 records in Jan 2026) and <strong>WINDFOR</strong> (Forecasts) at 60-minute top-of-the-hour resolution (00:00, 01:00, ..., 23:00).
            </p>
            <p>
              An exact inner join on <span className="font-mono text-slate-200">startTime</span> evaluates all <strong>744 hourly delivery targets</strong> in January 2026 (100% hourly coverage). Intermediate half-hour actual outturns are reported in diagnostics without arbitrary interpolation.
            </p>
          </div>

          {/* 4. Timezone & Offline Independence */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4" />
              4. Timezone & Offline Guarantees
            </h3>
            <p className="mb-1">
              • In January, the UK observes Greenwich Mean Time (GMT), so UTC is identical to local clock time.
            </p>
            <p>
              • The application operates completely offline using bundled, clean Parquet files committed in the repository. It has zero external API dependencies at runtime.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors"
          >
            Close Methodology
          </button>
        </div>
      </div>
    </div>
  )
}
