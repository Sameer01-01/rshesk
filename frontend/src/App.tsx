import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api/client'
import { FilterParams } from './types'
import { Header } from './components/Header'
import { ControlsBar } from './components/ControlsBar'
import { KpiCards } from './components/KpiCards'
import { MainComparisonChart } from './components/MainComparisonChart'
import { ErrorCharts } from './components/ErrorCharts'
import { HorizonAnalysisChart } from './components/HorizonAnalysisChart'
import { DiurnalAndLevelCharts } from './components/DiurnalAndLevelCharts'
import { DailySummaryTable } from './components/DailySummaryTable'
import { VintageExplorer } from './components/VintageExplorer'
import { InsightsPanel } from './components/InsightsPanel'
import { MethodologyModal } from './components/MethodologyModal'
import { AlertCircle, RefreshCw } from 'lucide-react'

const DEFAULT_FILTERS: FilterParams = {
  start: '2026-01-01T00:00:00Z',
  end: '2026-01-31T23:59:59Z',
  mode: 'decision',
  cutoffHour: 9,
  horizonHours: 24,
}

export const App: React.FC = () => {
  const [filters, setFilters] = useState<FilterParams>(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      start: params.get('start') || DEFAULT_FILTERS.start,
      end: params.get('end') || DEFAULT_FILTERS.end,
      mode: (params.get('mode') as 'decision' | 'horizon') || DEFAULT_FILTERS.mode,
      cutoffHour: params.has('cutoffHour') ? Number(params.get('cutoffHour')) : DEFAULT_FILTERS.cutoffHour,
      horizonHours: params.has('horizonHours') ? Number(params.get('horizonHours')) : DEFAULT_FILTERS.horizonHours,
    }
  })

  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('start', filters.start)
    params.set('end', filters.end)
    params.set('mode', filters.mode)
    params.set('cutoffHour', String(filters.cutoffHour))
    params.set('horizonHours', String(filters.horizonHours))
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }, [filters])

  const comparisonQuery = useQuery({ queryKey: ['comparison', filters], queryFn: () => api.getComparison(filters) })
  const metricsQuery    = useQuery({ queryKey: ['metrics', filters],    queryFn: () => api.getMetrics(filters) })
  const horizonQuery    = useQuery({ queryKey: ['metrics-horizon', filters.start, filters.end], queryFn: () => api.getMetricsByHorizon(filters) })
  const hourQuery       = useQuery({ queryKey: ['metrics-hour', filters], queryFn: () => api.getMetricsByHour(filters) })
  const levelQuery      = useQuery({ queryKey: ['metrics-level', filters], queryFn: () => api.getMetricsByLevel(filters) })
  const dailyQuery      = useQuery({ queryKey: ['metrics-daily', filters.start, filters.end, filters.cutoffHour], queryFn: () => api.getDailyMetrics(filters) })
  const insightsQuery   = useQuery({ queryKey: ['insights', filters], queryFn: () => api.getInsights(filters) })

  const handleResetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const hasError = comparisonQuery.isError || metricsQuery.isError
  const errorMessage = (comparisonQuery.error as Error)?.message || (metricsQuery.error as Error)?.message

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden" style={{ background: 'var(--bg-app)' }}>
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />
      <div className="bg-orb bg-orb-3" aria-hidden="true" />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onOpenMethodology={() => setIsMethodologyOpen(true)} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <ControlsBar
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />

          {hasError && (
            <div
              className="p-4 rounded-2xl flex items-center justify-between text-xs animate-fade-in-up"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--text-2)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage || 'Failed to fetch analytics data.'}</span>
              </div>
              <button
                onClick={() => { comparisonQuery.refetch(); metricsQuery.refetch() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <InsightsPanel insights={insightsQuery.data?.insights || []} isLoading={insightsQuery.isLoading} />
          <KpiCards metrics={metricsQuery.data} isLoading={metricsQuery.isLoading} />
          <MainComparisonChart data={comparisonQuery.data?.data || []} metrics={metricsQuery.data} isLoading={comparisonQuery.isLoading} />
          <ErrorCharts data={comparisonQuery.data?.data || []} />
          <HorizonAnalysisChart data={horizonQuery.data || []} isLoading={horizonQuery.isLoading} />
          <DiurnalAndLevelCharts hourData={hourQuery.data || []} levelData={levelQuery.data || []} />
          <DailySummaryTable dailyData={dailyQuery.data || []} comparisonData={comparisonQuery.data?.data || []} />
          <VintageExplorer cutoffHour={filters.cutoffHour} />
        </main>

        <footer
          className="relative z-10 border-t py-6 text-center text-xs"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-3)' }}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div style={{ color: 'var(--text-3)' }}>
              Wind Forecast Monitor &copy; 2026 &nbsp;·&nbsp; UK Energy Wholesale Trading Desk
            </div>
            <div className="flex items-center gap-4" style={{ color: 'var(--text-2)' }}>
              <span>Elexon BMRS · Jan 2026</span>
              <span style={{ color: 'var(--text-3)' }}>•</span>
              <span>Zero Look-Ahead Leakage Protected</span>
              <span style={{ color: 'var(--text-3)' }}>•</span>
              <button
                onClick={() => setIsMethodologyOpen(true)}
                className="hover:underline transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                Methodology
              </button>
            </div>
          </div>
        </footer>
      </div>

      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
    </div>
  )
}
