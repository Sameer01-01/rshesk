import React from 'react'
import { Wind, HelpCircle, Database, CheckCircle2 } from 'lucide-react'

interface HeaderProps {
  onOpenMethodology: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenMethodology }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-500 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Wind className="w-5 h-5 text-sky-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Wind Forecast Monitor
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  UK National Desk
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Day-ahead wholesale market decision verification & empirical forecast error evaluation
            </p>
          </div>
        </div>

        {/* Right Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Elexon BMRS (FUELHH & WINDFOR)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Jan 2026 UTC Verified</span>
          </div>

          <button
            onClick={onOpenMethodology}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-sm transition-all duration-150"
            title="View Decision Cutoff & Methodology Documentation"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Methodology</span>
          </button>
        </div>
      </div>
    </header>
  )
}
