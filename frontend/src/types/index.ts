export interface ComparisonRecord {
  startTime: string
  actual: number
  forecast: number
  publishTime: string
  horizonHours: number
  error: number
  absError: number
}

export interface ComparisonResponse {
  data: ComparisonRecord[]
  diagnostics: {
    actuals_count: number
    forecasts_count: number
    aligned_count: number
    actuals_without_forecast: number
    forecasts_without_actual: number
  }
}

export interface MetricsResponse {
  count: number
  coverage_pct: number
  mean_actual: number
  mean_forecast: number
  bias: number
  bias_direction: 'OVER' | 'UNDER' | 'NEUTRAL'
  mae: number
  rmse: number
  nmae_pct: number
  smape_pct: number
  median_abs_error: number
  p90_abs_error: number
  p95_abs_error: number
  error_p5: number
  error_p50: number
  error_p95: number
  planning_buffer_p90: number
  planning_buffer_p95: number
}

export interface HorizonMetric {
  horizonHours: number
  mae: number
  rmse: number
  bias: number
  biasDirection: string
  nmaePct: number
  p90AbsError: number
  count: number
}

export interface HourMetric {
  hour: number
  mae: number
  rmse: number
  bias: number
  meanActual: number
  meanForecast: number
  count: number
}

export interface LevelMetric {
  regime: string
  mae: number
  rmse: number
  bias: number
  nmaePct: number
  meanActual: number
  minActual: number
  maxActual: number
  count: number
}

export interface DailyMetric {
  date: string
  mae: number
  bias: number
  peakActual: number
  peakForecast: number
  meanActual: number
  meanForecast: number
  count: number
}

export interface VintageEntry {
  publishTime: string
  forecast: number
  horizonHours: number
  isDecisionSelected: boolean
  isBeforeCutoff: boolean
}

export interface ForecastVintageResponse {
  targetTime: string
  deliveryDate: string
  cutoffTime: string
  cutoffHour: number
  actualGeneration: number | null
  vintages: VintageEntry[]
}

export interface MetaResponse {
  project_name: string
  version: string
  available_range: {
    start: string
    end: string
  }
  default_cutoff_hour: number
  data_quality: {
    actuals_total_rows: number
    actuals_min_mw: number
    actuals_max_mw: number
    actuals_mean_mw: number
    actuals_intervals_missing: number
    forecasts_total_rows: number
    forecasts_min_mw: number
    forecasts_max_mw: number
    forecasts_mean_mw: number
    resolution_actuals: string
    resolution_forecasts: string
    timezone: string
  }
}

export interface FilterParams {
  start: string
  end: string
  mode: 'decision' | 'horizon'
  cutoffHour: number
  horizonHours: number
}
