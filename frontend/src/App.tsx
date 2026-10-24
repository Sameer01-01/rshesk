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
  // Sync state with URL search parameters
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

  // Update browser URL query string whenever filters change
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('start', filters.start)
    params.set('end', filters.end)
    params.set('mode', filters.mode)
    params.set('cutoffHour', String(filters.cutoffHour))
    params.set('horizonHours', String(filters.horizonHours))

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [filters])

  // Queries
  const comparisonQuery = useQuery({
    queryKey: ['comparison', filters],
    queryFn: () => api.getComparison(filters),
  })

  const metricsQuery = useQuery({
    queryKey: ['metrics', filters],
    queryFn: () => api.getMetrics(filters),
  })

  const horizonQuery = useQuery({
    queryKey: ['metrics-horizon', filters.start, filters.end],
    queryFn: () => api.getMetricsByHorizon(filters),
  })

  const hourQuery = useQuery({
    queryKey: ['metrics-hour', filters],
    queryFn: () => api.getMetricsByHour(filters),
  })

  const levelQuery = useQuery({
    queryKey: ['metrics-level', filters],
    queryFn: () => api.getMetricsByLevel(filters),
  })

  const dailyQuery = useQuery({
    queryKey: ['metrics-daily', filters.start, filters.end, filters.cutoffHour],
    queryFn: () => api.getDailyMetrics(filters),
  })

  const insightsQuery = useQuery({
    queryKey: ['insights', filters],
    queryFn: () => api.getInsights(filters),
  })

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const hasError = comparisonQuery.isError || metricsQuery.isError
  const errorMessage =
    (comparisonQuery.error as Error)?.message || (metricsQuery.error as Error)?.message

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <Header onOpenMethodology={() => setIsMethodologyOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls Bar */}
        <ControlsBar
          filters={filters}
          onFiltersChange={setFilters}
          onReset={handleResetFilters}
        />

        {/* Global Error Banner */}
        {hasError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage || 'Failed to fetch analytics data.'}</span>
            </div>
            <button
              onClick={() => {
                comparisonQuery.refetch()
                metricsQuery.refetch()
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Automated Narrative Trading Insights */}
        <InsightsPanel
          insights={insightsQuery.data?.insights || []}
          isLoading={insightsQuery.isLoading}
        />

        {/* Executive KPI Cards */}
        <KpiCards
          metrics={metricsQuery.data}
          isLoading={metricsQuery.isLoading}
        />

        {/* Main Actual vs Decision-Time Forecast Time Series Chart */}
        <MainComparisonChart
          data={comparisonQuery.data?.data || []}
          metrics={metricsQuery.data}
          isLoading={comparisonQuery.isLoading}
        />

        {/* Error Timeline & Frequency Distribution */}
        <ErrorCharts data={comparisonQuery.data?.data || []} />

        {/* Horizon Degradation Curve (0 to 48 Hours) */}
        <HorizonAnalysisChart
          data={horizonQuery.data || []}
          isLoading={horizonQuery.isLoading}
        />

        {/* Diurnal Profile (Hour of Day) & Wind Load Regime Breakdown */}
        <DiurnalAndLevelCharts
          hourData={hourQuery.data || []}
          levelData={levelQuery.data || []}
        />

        {/* Sortable Daily Summary Ledger & CSV Export */}
        <DailySummaryTable
          dailyData={dailyQuery.data || []}
          comparisonData={comparisonQuery.data?.data || []}
        />

        {/* Forecast Vintage Explorer */}
        <VintageExplorer cutoffHour={filters.cutoffHour} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Wind Forecast Monitor &copy; 2026. Built for UK Energy Wholesale Trading Desks.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Data: Elexon BMRS (Jan 2026)</span>
            <span>•</span>
            <span>Zero Look-Ahead Leakage Protected</span>
            <span>•</span>
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="text-sky-400 hover:underline"
            >
              Methodology & Definitions
            </button>
          </div>
        </div>
      </footer>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  )
}
