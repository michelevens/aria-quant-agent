import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Search, Wifi, Sun, Moon, Monitor, LogOut, TrendingUp, Loader2,
  Users, Coins, Zap, GraduationCap, LayoutGrid, BookOpen, BarChart3,
  Calendar, Puzzle, MoreHorizontal, Gauge, Activity, LineChart, Globe, Eye as EyeIcon,
  Grid3X3, Dice5, UserCheck, CalendarDays,
} from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAlpacaConnected, getAlpacaConfig } from '@/services/alpaca'

interface SearchResult {
  symbol: string
  name: string
  type: string
  exchange: string
}

async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return []
  const url = `https://corsproxy.io/?url=${encodeURIComponent(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`
  )}`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  const quotes = json.quotes ?? []
  return quotes
    .filter((q: Record<string, unknown>) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'INDEX')
    .map((q: Record<string, unknown>) => ({
      symbol: q.symbol as string,
      name: (q.shortname ?? q.longname ?? '') as string,
      type: (q.quoteType ?? '') as string,
      exchange: (q.exchDisp ?? q.exchange ?? '') as string,
    }))
}

function NavIcon({ to, icon: Icon, label }: { to: string; icon: typeof Users; label: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const active = location.pathname === to
  return (
    <button
      onClick={() => navigate(to)}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

export function TopBar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setResults([])
      setShowResults(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const r = await searchSymbols(q.trim())
      setResults(r)
      setShowResults(true)
      setSearching(false)
      setSelectedIdx(-1)
    }, 300)
  }, [])

  useEffect(() => {
    doSearch(query)
  }, [query, doSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectResult = (r: SearchResult) => {
    setQuery('')
    setShowResults(false)
    navigate(`/trade?symbol=${r.symbol}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault()
      selectResult(results[selectedIdx])
    } else if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  const typeColor = (type: string) => {
    if (type === 'ETF') return '#3b82f6'
    if (type === 'CRYPTOCURRENCY') return '#f59e0b'
    if (type === 'INDEX') return '#8b5cf6'
    return '#6b7280'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          {searching && (
            <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true) }}
            onKeyDown={handleKeyDown}
            placeholder="Search symbol, company..."
            className="h-8 w-40 pl-8 text-sm sm:w-72"
          />

          {showResults && results.length > 0 && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg sm:w-96"
            >
              {results.map((r, i) => (
                <button
                  key={r.symbol}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  style={i === selectedIdx ? { backgroundColor: 'var(--accent)' } : undefined}
                  onClick={() => selectResult(r)}
                  onMouseEnter={() => setSelectedIdx(i)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.symbol}</span>
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-xs"
                        style={{ color: typeColor(r.type), borderColor: typeColor(r.type) }}
                      >
                        {r.type === 'CRYPTOCURRENCY' ? 'CRYPTO' : r.type}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{r.name}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{r.exchange}</span>
                </button>
              ))}
              <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
                <kbd className="rounded border border-border px-1">↑↓</kbd> navigate
                <kbd className="ml-2 rounded border border-border px-1">↵</kbd> select
                <kbd className="ml-2 rounded border border-border px-1">esc</kbd> close
              </div>
            </div>
          )}

          {showResults && !searching && results.length === 0 && query.trim().length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg sm:w-96">
              No results for &quot;{query}&quot;
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Quick-access nav icons */}
        <div className="hidden items-center gap-0.5 md:flex">
          <NavIcon to="/crypto" icon={Coins} label="Crypto" />
          <NavIcon to="/options-flow" icon={Zap} label="Options Flow" />
          <NavIcon to="/social" icon={Users} label="Social Trading" />
          <NavIcon to="/learn" icon={GraduationCap} label="Learn" />
        </div>

        {/* More dropdown for remaining pages */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/heatmap')}>
              <LayoutGrid className="mr-2 h-3.5 w-3.5" /> Heat Map
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/journal')}>
              <BookOpen className="mr-2 h-3.5 w-3.5" /> Journal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/analytics')}>
              <BarChart3 className="mr-2 h-3.5 w-3.5" /> Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/calendar')}>
              <Calendar className="mr-2 h-3.5 w-3.5" /> Calendar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/strategy')}>
              <Puzzle className="mr-2 h-3.5 w-3.5" /> Strategy Builder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/performance')}>
              <LineChart className="mr-2 h-3.5 w-3.5" /> Performance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/sentiment')}>
              <Gauge className="mr-2 h-3.5 w-3.5" /> Sentiment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/breadth')}>
              <Activity className="mr-2 h-3.5 w-3.5" /> Market Breadth
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/forex')}>
              <Globe className="mr-2 h-3.5 w-3.5" /> Forex & Commodities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/darkpool')}>
              <EyeIcon className="mr-2 h-3.5 w-3.5" /> Dark Pool Monitor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/correlation')}>
              <Grid3X3 className="mr-2 h-3.5 w-3.5" /> Correlation Matrix
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/monte-carlo')}>
              <Dice5 className="mr-2 h-3.5 w-3.5" /> Monte Carlo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/insiders')}>
              <UserCheck className="mr-2 h-3.5 w-3.5" /> Insider Trades
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/earnings')}>
              <CalendarDays className="mr-2 h-3.5 w-3.5" /> Earnings Calendar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="flex md:hidden flex-col">
              <DropdownMenuItem onClick={() => navigate('/crypto')}>
                <Coins className="mr-2 h-3.5 w-3.5" /> Crypto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/options-flow')}>
                <Zap className="mr-2 h-3.5 w-3.5" /> Options Flow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/social')}>
                <Users className="mr-2 h-3.5 w-3.5" /> Social Trading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/learn')}>
                <GraduationCap className="mr-2 h-3.5 w-3.5" /> Learn
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="hidden items-center gap-1.5 text-xs sm:flex">
          {isAlpacaConnected() ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Alpaca</span>
              <Badge variant="outline" className="h-5 px-1.5 text-xs" style={{
                color: getAlpacaConfig()?.paper ? '#3b82f6' : '#10b981',
                borderColor: getAlpacaConfig()?.paper ? '#3b82f6' : '#10b981',
              }}>
                {getAlpacaConfig()?.paper ? 'PAPER' : 'LIVE'}
              </Badge>
            </>
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Simulated</span>
              <Badge variant="outline" className="h-5 px-1.5 text-xs text-muted-foreground">
                DEMO
              </Badge>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-3.5 w-3.5" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-3.5 w-3.5" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-3.5 w-3.5" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{user?.avatar ?? 'U'}</AvatarFallback>
            </Avatar>
            <span className="hidden text-xs sm:inline">{user?.name ?? 'User'}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem>
              <Badge variant="outline" className="mr-2 text-xs">{user?.plan?.toUpperCase()}</Badge>
              Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
