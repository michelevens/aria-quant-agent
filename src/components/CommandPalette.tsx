import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  LayoutDashboard, TrendingUp, Briefcase, LineChart, Eye, ListOrdered,
  Search, Newspaper, Bot, Settings, FlaskConical, Bell, Shield, LayoutGrid,
  BookOpen, BarChart3,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const nav = useCallback((path: string) => {
    navigate(path)
    setOpen(false)
  }, [navigate])

  const commands: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, action: () => nav('/'), keywords: ['home', 'overview'] },
    { id: 'trade', label: 'Trade', icon: <TrendingUp className="h-4 w-4" />, action: () => nav('/trade'), keywords: ['buy', 'sell', 'order'] },
    { id: 'portfolio', label: 'Portfolio', icon: <Briefcase className="h-4 w-4" />, action: () => nav('/portfolio'), keywords: ['holdings', 'positions'] },
    { id: 'charts', label: 'Charts', icon: <LineChart className="h-4 w-4" />, action: () => nav('/charts'), keywords: ['graph', 'candlestick', 'price'] },
    { id: 'watchlist', label: 'Watchlist', icon: <Eye className="h-4 w-4" />, action: () => nav('/watchlist'), keywords: ['watch', 'track', 'monitor'] },
    { id: 'orders', label: 'Orders', icon: <ListOrdered className="h-4 w-4" />, action: () => nav('/orders'), keywords: ['history', 'filled', 'open'] },
    { id: 'screener', label: 'Screener', icon: <Search className="h-4 w-4" />, action: () => nav('/screener'), keywords: ['filter', 'scan', 'stock'] },
    { id: 'news', label: 'News', icon: <Newspaper className="h-4 w-4" />, action: () => nav('/news'), keywords: ['market', 'headlines'] },
    { id: 'agent', label: 'AI Agent', icon: <Bot className="h-4 w-4" />, action: () => nav('/agent'), keywords: ['ai', 'analysis', 'signal'] },
    { id: 'backtest', label: 'Backtest', icon: <FlaskConical className="h-4 w-4" />, action: () => nav('/backtest'), keywords: ['strategy', 'simulate'] },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="h-4 w-4" />, action: () => nav('/alerts'), keywords: ['notification', 'price alert'] },
    { id: 'risk', label: 'Risk Dashboard', icon: <Shield className="h-4 w-4" />, action: () => nav('/risk'), keywords: ['var', 'drawdown', 'exposure'] },
    { id: 'heatmap', label: 'Heat Map', icon: <LayoutGrid className="h-4 w-4" />, action: () => nav('/heatmap'), keywords: ['sector', 'performance'] },
    { id: 'journal', label: 'Trade Journal', icon: <BookOpen className="h-4 w-4" />, action: () => nav('/journal'), keywords: ['log', 'diary', 'history'] },
    { id: 'analytics', label: 'Performance Analytics', icon: <BarChart3 className="h-4 w-4" />, action: () => nav('/analytics'), keywords: ['returns', 'sharpe', 'monthly'] },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, action: () => nav('/settings'), keywords: ['config', 'api', 'theme'] },
  ]

  const filtered = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase()
        return cmd.label.toLowerCase().includes(q) || cmd.keywords.some((k) => k.includes(q))
      })
    : commands

  useEffect(() => { setSelectedIndex(0) }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
        <div className="fixed inset-0 bg-black/50" />
        <div
          className="relative z-50 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, symbols, actions..."
              className="h-11 border-0 text-sm shadow-none focus-visible:ring-0"
            />
            <kbd className="ml-2 shrink-0 rounded border border-border bg-accent px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              Esc
            </kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
            ) : (
              filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    i === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  {cmd.icon}
                  <span className="font-medium">{cmd.label}</span>
                </button>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <span>Navigate with arrow keys</span>
            <span>
              <kbd className="rounded border border-border bg-accent px-1 py-0.5 font-mono text-xs">Ctrl</kbd>
              {' + '}
              <kbd className="rounded border border-border bg-accent px-1 py-0.5 font-mono text-xs">K</kbd>
              {' to toggle'}
            </span>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
