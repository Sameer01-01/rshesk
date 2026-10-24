import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
  /** Pre-computed chart colors that adapt to the current theme */
  chart: {
    grid: string
    axis: string
    tooltipBg: string
    tooltipBorder: string
    tooltipText: string
    brushFill: string
    brushStroke: string
  }
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  chart: {
    grid: '#1e293b',
    axis: '#64748b',
    tooltipBg: '#0f172a',
    tooltipBorder: '#334155',
    tooltipText: '#f1f5f9',
    brushFill: '#0f172a',
    brushStroke: '#38bdf8',
  },
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('wfm-theme')
    return (saved === 'light' || saved === 'dark') ? saved : 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    localStorage.setItem('wfm-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const isDark = theme === 'dark'

  const chart = isDark
    ? {
        grid: '#1e293b',
        axis: '#64748b',
        tooltipBg: '#0f172a',
        tooltipBorder: '#1e293b',
        tooltipText: '#f1f5f9',
        brushFill: '#0f172a',
        brushStroke: '#38bdf8',
      }
    : {
        grid: '#e2e8f0',
        axis: '#94a3b8',
        tooltipBg: '#ffffff',
        tooltipBorder: '#e2e8f0',
        tooltipText: '#0f172a',
        brushFill: '#f8fafc',
        brushStroke: '#0284c7',
      }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, chart }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
