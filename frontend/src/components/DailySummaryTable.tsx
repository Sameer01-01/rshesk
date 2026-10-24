import React, { useState, useMemo } from 'react'
import { DailyMetric, ComparisonRecord } from '../types'
import { Download, Table, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

interface DailySummaryTableProps {
  dailyData: DailyMetric[]
  comparisonData: ComparisonRecord[]
}

type SortField = 'date' | 'mae' | 'bias' | 'peakActual' | 'peakForecast' | 'count'
type SortOrder = 'asc' | 'desc'

export const DailySummaryTable: React.FC<DailySummaryTableProps> = ({
  dailyData,
  comparisonData,
}) => {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc') // Default to highest error/value first on click
    }
  }

  const sortedData = useMemo(() => {
    return [...dailyData].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [dailyData, sortField, sortOrder])

  // Download CSV of comparison dataset
  const handleDownloadCsv = () => {
    if (!comparisonData.length) return

    const headers = [
      'targetStartTimeUTC',
      'actualGenerationMW',
      'forecastGenerationMW',
      'errorMW',
      'absoluteErrorMW',
      'forecastPublishTimeUTC',
      'horizonHours',
    ]

    const rows = comparisonData.map((r) => [
      r.startTime,
      r.actual,
      r.forecast,
      r.error,
      r.absError,
      r.publishTime,
      r.horizonHours,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `wind_forecast_comparison_jan2026.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500" />
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-sky-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-sky-400" />
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-sky-400" />
            Daily Accuracy Summary & Day-Ahead Outturn Ledger
          </h3>
          <p className="text-xs text-slate-400">
            Per-delivery-day accuracy breakdown, peak load, and deviation records for January 2026
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={!comparisonData.length}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Export Aligned CSV ({comparisonData.length} rows)</span>
        </button>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 border-b border-slate-800 uppercase text-[11px] font-semibold">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Delivery Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>
              <th
                onClick={() => handleSort('mae')}
                className="py-3 px-4 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>MAE (MW)</span>
                  {renderSortIcon('mae')}
                </div>
              </th>
              <th
                onClick={() => handleSort('bias')}
                className="py-3 px-4 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Bias (MW)</span>
                  {renderSortIcon('bias')}
                </div>
              </th>
              <th
                onClick={() => handleSort('peakActual')}
                className="py-3 px-4 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Peak Actual (MW)</span>
                  {renderSortIcon('peakActual')}
                </div>
              </th>
              <th
                onClick={() => handleSort('peakForecast')}
                className="py-3 px-4 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Peak Forecast (MW)</span>
                  {renderSortIcon('peakForecast')}
                </div>
              </th>
              <th
                onClick={() => handleSort('count')}
                className="py-3 px-4 cursor-pointer hover:text-white text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Hours</span>
                  {renderSortIcon('count')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sortedData.map((row) => (
              <tr key={row.date} className="hover:bg-slate-850/50 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-white">{row.date}</td>
                <td className="py-2.5 px-4 text-right text-sky-400 font-semibold">
                  {row.mae.toLocaleString()}
                </td>
                <td
                  className={`py-2.5 px-4 text-right font-semibold ${
                    row.bias > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {row.bias > 0 ? `+${row.bias.toLocaleString()}` : row.bias.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-400">
                  {row.peakActual.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right text-sky-300">
                  {row.peakForecast.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-center text-slate-400">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
