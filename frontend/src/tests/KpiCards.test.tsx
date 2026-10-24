import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiCards } from '../components/KpiCards'
import { MetricsResponse } from '../types'

const mockMetrics: MetricsResponse = {
  count: 744,
  coverage_pct: 100,
  mean_actual: 11581.11,
  mean_forecast: 13432.64,
  bias: 1851.53,
  bias_direction: 'OVER',
  mae: 2127.48,
  rmse: 2606.07,
  nmae_pct: 18.37,
  smape_pct: 18.72,
  median_abs_error: 1758.5,
  p90_abs_error: 4306.4,
  p95_abs_error: 5350.9,
  error_p5: -1038.65,
  error_p50: 1694.0,
  error_p95: 5350.9,
  planning_buffer_p90: 4306.4,
  planning_buffer_p95: 5350.9,
}

describe('KpiCards component', () => {
  it('renders MAE, RMSE, Bias, and P90 buffer correctly', () => {
    render(<KpiCards metrics={mockMetrics} isLoading={false} />)

    // Verify key titles and values exist
    expect(screen.getByText(/Mean Abs Error \(MAE\)/i)).toBeInTheDocument()
    expect(screen.getByText('2,127')).toBeInTheDocument()

    expect(screen.getByText(/Root Mean Sq \(RMSE\)/i)).toBeInTheDocument()
    expect(screen.getByText('2,606')).toBeInTheDocument()

    expect(screen.getByText(/Net Bias \(Signed Error\)/i)).toBeInTheDocument()
    expect(screen.getByText('+1,852')).toBeInTheDocument()
    expect(screen.getByText('OVER-FORECAST')).toBeInTheDocument()

    expect(screen.getByText(/P90 Planning Buffer/i)).toBeInTheDocument()
    expect(screen.getByText('±4,306')).toBeInTheDocument()

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('renders loading skeleton when loading', () => {
    const { container } = render(<KpiCards metrics={undefined} isLoading={true} />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
