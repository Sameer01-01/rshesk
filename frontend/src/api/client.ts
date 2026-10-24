import {
  ComparisonResponse,
  DailyMetric,
  FilterParams,
  ForecastVintageResponse,
  HorizonMetric,
  HourMetric,
  LevelMetric,
  MetaResponse,
  MetricsResponse,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function fetchJson<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = BASE_URL.startsWith('http')
    ? new URL(`${BASE_URL.replace(/\/$/, '')}${endpoint}`)
    : new URL(`${BASE_URL}${endpoint}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errJson = await response.json()
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore
    }
    throw new Error(`API Error (${response.status}): ${errorDetail}`)
  }

  return response.json()
}

export const api = {
  getMeta: () => fetchJson<MetaResponse>('/api/meta'),
  getComparison: (filters: FilterParams) =>
    fetchJson<ComparisonResponse>('/api/comparison', {
      start: filters.start,
      end: filters.end,
      mode: filters.mode,
      cutoffHour: filters.cutoffHour,
      horizonHours: filters.horizonHours,
    }),
  getMetrics: (filters: FilterParams) =>
    fetchJson<MetricsResponse>('/api/metrics', {
      start: filters.start,
      end: filters.end,
      mode: filters.mode,
      cutoffHour: filters.cutoffHour,
      horizonHours: filters.horizonHours,
    }),
  getMetricsByHorizon: (filters: FilterParams) =>
    fetchJson<HorizonMetric[]>('/api/metrics/by-horizon', {
      start: filters.start,
      end: filters.end,
    }),
  getMetricsByHour: (filters: FilterParams) =>
    fetchJson<HourMetric[]>('/api/metrics/by-hour', {
      start: filters.start,
      end: filters.end,
      mode: filters.mode,
      cutoffHour: filters.cutoffHour,
      horizonHours: filters.horizonHours,
    }),
  getMetricsByLevel: (filters: FilterParams) =>
    fetchJson<LevelMetric[]>('/api/metrics/by-level', {
      start: filters.start,
      end: filters.end,
      mode: filters.mode,
      cutoffHour: filters.cutoffHour,
      horizonHours: filters.horizonHours,
    }),
  getDailyMetrics: (filters: FilterParams) =>
    fetchJson<DailyMetric[]>('/api/metrics/daily', {
      start: filters.start,
      end: filters.end,
      cutoffHour: filters.cutoffHour,
    }),
  getVintages: (targetTime: string, cutoffHour: number) =>
    fetchJson<ForecastVintageResponse>('/api/forecast-vintages', {
      targetTime,
      cutoffHour,
    }),
  getInsights: (filters: FilterParams) =>
    fetchJson<{ insights: string[] }>('/api/insights', {
      start: filters.start,
      end: filters.end,
      mode: filters.mode,
      cutoffHour: filters.cutoffHour,
      horizonHours: filters.horizonHours,
    }),
}
