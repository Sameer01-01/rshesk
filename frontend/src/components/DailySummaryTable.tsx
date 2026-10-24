import React, { useState, useMemo } from 'react'
import { DailyMetric, ComparisonRecord } from '../types'
import { Download, Table2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

interface DailySummaryTableProps {
  dailyData: DailyMetric[]
  comparisonData: ComparisonRecord[]
}

type SortField = 'date' | 'mae' | 'bias' | 'peakActual' | 'peakForecast' | 'count'
type SortOrder = 'asc' | 'desc'

export const DailySummaryTable: React.FC<DailySummaryTableProps> = ({ dailyData, comparisonData }) => {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = useMemo(() => {
    return [...dailyData].sort((a, b) => {
      const av = a[sortField], bv = b[sortField]
      if (av < bv) return sortOrder === 'asc' ? -1 : 1
      if (av > bv) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [dailyData, sortField, sortOrder])

  const handleDownloadCsv = () => {
    if (!comparisonData.length) return
    const headers = ['targetStartTimeUTC', 'actualGenerationMW', 'forecastGenerationMW', 'errorMW', 'absoluteErrorMW', 'forecastPublishTimeUTC', 'horizonHours']
    const rows = comparisonData.map(r => [r.startTime, r.actual, r.forecast, r.error, r.absError, r.publishTime, r.horizonHours])
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', 'wind_forecast_comparison_jan2026.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3" style={{ color: 'var(--accent)' }} />
      : <ChevronDown className="w-3 h-3" style={{ color: 'var(--accent)' }} />
  }

  const ThCell: React.FC<{ field: SortField; align?: 'left' | 'right' | 'center'; children: React.ReactNode }> = ({ field, align = 'left', children }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ color: 'var(--text-3)', background: 'var(--bg-subtle)', cursor: 'pointer', userSelect: 'none' }}
      className={`py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-colors hover:text-[var(--text-1)]`}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  )

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
            <Table2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
              Daily Accuracy Summary &amp; Outturn Ledger
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Per-delivery-day performance breakdown for January 2026 · Click column headers to sort
            </p>
          </div>
        </div>

        <button
          id="btn-export-csv"
          onClick={handleDownloadCsv}
          disabled={!comparisonData.length}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 shrink-0"
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
          }}
        >
          <Download className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          Export CSV ({comparisonData.length} rows)
        </button>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl"
        style={{ border: '1px solid var(--border)' }}
      >
        <table className="w-full text-left text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <thead className="sticky top-0 z-10" style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              <ThCell field="date" align="left">Date</ThCell>
              <ThCell field="mae" align="right">MAE (MW)</ThCell>
              <ThCell field="bias" align="right">Bias (MW)</ThCell>
              <ThCell field="peakActual" align="right">Peak Actual</ThCell>
              <ThCell field="peakForecast" align="right">Peak Forecast</ThCell>
              <ThCell field="count" align="center">Hours</ThCell>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={row.date}
                className="transition-colors"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)')}
              >
                <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-1)', fontFamily: 'Inter, sans-serif' }}>{row.date}</td>
                <td className="py-3 px-4 text-right font-semibold" style={{ color: '#38bdf8' }}>
                  {row.mae.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-semibold" style={{ color: row.bias > 0 ? '#f59e0b' : '#34d399' }}>
                  {row.bias > 0 ? `+${row.bias.toLocaleString()}` : row.bias.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right" style={{ color: '#34d399' }}>{row.peakActual.toLocaleString()}</td>
                <td className="py-3 px-4 text-right" style={{ color: '#7dd3fc' }}>{row.peakForecast.toLocaleString()}</td>
                <td className="py-3 px-4 text-center" style={{ color: 'var(--text-3)' }}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
