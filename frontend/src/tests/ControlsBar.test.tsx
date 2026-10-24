import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ControlsBar } from '../components/ControlsBar'
import { FilterParams } from '../types'

const mockFilters: FilterParams = {
  start: '2026-01-01T00:00:00Z',
  end: '2026-01-31T23:59:59Z',
  mode: 'decision',
  cutoffHour: 9,
  horizonHours: 24,
}

describe('ControlsBar component', () => {
  it('renders presets and fires filter change on preset click', () => {
    const onFiltersChange = vi.fn()
    const onReset = vi.fn()

    render(
      <ControlsBar
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        onReset={onReset}
      />
    )

    const week1Button = screen.getByRole('button', { name: /Week 1/i })
    expect(week1Button).toBeInTheDocument()

    fireEvent.click(week1Button)
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        start: '2026-01-01T00:00:00Z',
        end: '2026-01-07T23:59:59Z',
      })
    )
  })

  it('triggers mode switch', () => {
    const onFiltersChange = vi.fn()
    const onReset = vi.fn()

    render(
      <ControlsBar
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        onReset={onReset}
      />
    )

    const fixedHorizonBtn = screen.getByRole('button', { name: /Fixed Horizon/i })
    fireEvent.click(fixedHorizonBtn)
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'horizon',
      })
    )
  })
})
