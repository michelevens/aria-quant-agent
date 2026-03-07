import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface ShortcutAction {
  key: string
  ctrl?: boolean
  shift?: boolean
  description: string
  action: () => void
}

export function useKeyboardShortcuts(customActions?: ShortcutAction[]) {
  const navigate = useNavigate()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // Custom actions first
    if (customActions) {
      for (const action of customActions) {
        const ctrlMatch = action.ctrl ? (e.ctrlKey || e.metaKey) : true
        const shiftMatch = action.shift ? e.shiftKey : true
        if (e.key.toLowerCase() === action.key.toLowerCase() && ctrlMatch && shiftMatch) {
          e.preventDefault()
          action.action()
          return
        }
      }
    }

    // Global navigation shortcuts
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
      // Wait for next key
      return
    }

    // Direct shortcuts
    switch (e.key) {
      case '1': navigate('/'); break
      case '2': navigate('/trade'); break
      case '3': navigate('/portfolio'); break
      case '4': navigate('/charts'); break
      case '5': navigate('/watchlist'); break
      case '6': navigate('/orders'); break
      case '7': navigate('/screener'); break
      case '8': navigate('/news'); break
      case '9': navigate('/agent'); break
      case '0': navigate('/settings'); break
      case '/':
        e.preventDefault()
        // Focus symbol search if it exists
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="symbol" i], input[placeholder*="search" i]')
        if (searchInput) searchInput.focus()
        break
      case 'Escape':
        // Blur active input
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        break
    }
  }, [navigate, customActions])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export const SHORTCUT_MAP = [
  { key: '1', description: 'Dashboard' },
  { key: '2', description: 'Trade' },
  { key: '3', description: 'Portfolio' },
  { key: '4', description: 'Charts' },
  { key: '5', description: 'Watchlist' },
  { key: '6', description: 'Orders' },
  { key: '7', description: 'Screener' },
  { key: '8', description: 'News' },
  { key: '9', description: 'AI Agent' },
  { key: '0', description: 'Settings' },
  { key: '/', description: 'Focus search' },
  { key: 'Esc', description: 'Blur / Close' },
]
