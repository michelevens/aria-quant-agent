import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeState {
  theme: Theme
  resolved: 'dark' | 'light'
  setTheme: (t: Theme) => void
}

const THEME_KEY = 'aria-quant-theme'

const ThemeContext = createContext<ThemeState | null>(null)

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'dark' | 'light' {
  return theme === 'system' ? getSystemTheme() : theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as Theme) ?? 'dark'
    } catch {
      return 'dark'
    }
  })

  const [resolved, setResolved] = useState<'dark' | 'light'>(() => resolveTheme(theme))

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }, [])

  useEffect(() => {
    const r = resolveTheme(theme)
    setResolved(r)

    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(r)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setResolved(getSystemTheme())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
