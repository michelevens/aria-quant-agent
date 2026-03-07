import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp,
  Clock, Globe, BarChart3, DollarSign, CheckCircle2, XCircle,
} from 'lucide-react'

type Impact = 'high' | 'medium' | 'low'

interface EconomicEvent {
  id: string
  date: string
  time: string
  country: string
  event: string
  impact: Impact
  actual?: string
  forecast?: string
  previous?: string
}

const impactConfig: Record<Impact, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  medium: { label: 'Med', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  low: { label: 'Low', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
}

function generateEvents(weekStart: Date): EconomicEvent[] {
  const events: EconomicEvent[] = []
  const templates = [
    { event: 'Non-Farm Payrolls', impact: 'high' as Impact, country: 'US', time: '08:30' },
    { event: 'CPI (YoY)', impact: 'high' as Impact, country: 'US', time: '08:30' },
    { event: 'Fed Interest Rate Decision', impact: 'high' as Impact, country: 'US', time: '14:00' },
    { event: 'GDP (QoQ)', impact: 'high' as Impact, country: 'US', time: '08:30' },
    { event: 'Unemployment Rate', impact: 'high' as Impact, country: 'US', time: '08:30' },
    { event: 'Core PCE Price Index', impact: 'high' as Impact, country: 'US', time: '08:30' },
    { event: 'ISM Manufacturing PMI', impact: 'medium' as Impact, country: 'US', time: '10:00' },
    { event: 'Retail Sales (MoM)', impact: 'medium' as Impact, country: 'US', time: '08:30' },
    { event: 'Initial Jobless Claims', impact: 'medium' as Impact, country: 'US', time: '08:30' },
    { event: 'Consumer Confidence', impact: 'medium' as Impact, country: 'US', time: '10:00' },
    { event: 'ECB Interest Rate Decision', impact: 'high' as Impact, country: 'EU', time: '07:45' },
    { event: 'EU CPI (YoY)', impact: 'medium' as Impact, country: 'EU', time: '05:00' },
    { event: 'BOE Interest Rate Decision', impact: 'high' as Impact, country: 'UK', time: '07:00' },
    { event: 'UK GDP (QoQ)', impact: 'medium' as Impact, country: 'UK', time: '02:00' },
    { event: 'BOJ Interest Rate Decision', impact: 'high' as Impact, country: 'JP', time: '23:00' },
    { event: 'China Manufacturing PMI', impact: 'medium' as Impact, country: 'CN', time: '01:00' },
    { event: 'Durable Goods Orders', impact: 'medium' as Impact, country: 'US', time: '08:30' },
    { event: 'Existing Home Sales', impact: 'low' as Impact, country: 'US', time: '10:00' },
    { event: 'Building Permits', impact: 'low' as Impact, country: 'US', time: '08:30' },
    { event: 'Industrial Production (MoM)', impact: 'low' as Impact, country: 'US', time: '09:15' },
    { event: 'FOMC Meeting Minutes', impact: 'high' as Impact, country: 'US', time: '14:00' },
    { event: 'PPI (MoM)', impact: 'medium' as Impact, country: 'US', time: '08:30' },
    { event: 'Michigan Consumer Sentiment', impact: 'medium' as Impact, country: 'US', time: '10:00' },
    { event: 'ADP Nonfarm Employment', impact: 'medium' as Impact, country: 'US', time: '08:15' },
    { event: 'Trade Balance', impact: 'low' as Impact, country: 'US', time: '08:30' },
  ]

  // Seed-based pseudo-random using week start
  const seed = weekStart.getTime()
  let rng = seed
  const rand = () => { rng = (rng * 16807 + 0) % 2147483647; return rng / 2147483647 }

  for (let day = 0; day < 5; day++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + day)
    const dateStr = d.toISOString().slice(0, 10)

    // 2-5 events per day
    const count = 2 + Math.floor(rand() * 4)
    const shuffled = [...templates].sort(() => rand() - 0.5).slice(0, count)

    shuffled.forEach((t, i) => {
      const actual = rand() > 0.4 ? (rand() * 5 - 1).toFixed(1) + '%' : undefined
      const forecast = (rand() * 4 - 0.5).toFixed(1) + '%'
      const previous = (rand() * 4 - 0.5).toFixed(1) + '%'

      events.push({
        id: `${dateStr}-${i}`,
        date: dateStr,
        time: t.time,
        country: t.country,
        event: t.event,
        impact: t.impact,
        actual,
        forecast,
        previous,
      })
    })
  }

  return events.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

const FILTERS: Impact[] = ['high', 'medium', 'low']
const COUNTRIES = ['All', 'US', 'EU', 'UK', 'JP', 'CN']

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function countryFlag(c: string) {
  const map: Record<string, string> = { US: 'USD', EU: 'EUR', UK: 'GBP', JP: 'JPY', CN: 'CNY' }
  return map[c] ?? c
}

// --- Earnings Calendar ---

interface EarningsEntry {
  id: string
  symbol: string
  company: string
  date: string
  time: 'BMO' | 'AMC'
  epsEstimate: number
  epsActual?: number
  revenueEstimate: string
  revenueActual?: string
  surprise?: number
}

function generateEarnings(weekStart: Date): EarningsEntry[] {
  const companies = [
    { symbol: 'AAPL', company: 'Apple Inc.', eps: 1.52, rev: '$94.2B' },
    { symbol: 'MSFT', company: 'Microsoft Corp.', eps: 2.82, rev: '$61.9B' },
    { symbol: 'NVDA', company: 'NVIDIA Corp.', eps: 0.74, rev: '$22.1B' },
    { symbol: 'GOOGL', company: 'Alphabet Inc.', eps: 1.45, rev: '$76.7B' },
    { symbol: 'AMZN', company: 'Amazon.com Inc.', eps: 0.98, rev: '$143.3B' },
    { symbol: 'META', company: 'Meta Platforms Inc.', eps: 4.71, rev: '$36.5B' },
    { symbol: 'TSLA', company: 'Tesla Inc.', eps: 0.85, rev: '$25.2B' },
    { symbol: 'JPM', company: 'JPMorgan Chase', eps: 4.33, rev: '$39.6B' },
    { symbol: 'V', company: 'Visa Inc.', eps: 2.33, rev: '$8.6B' },
    { symbol: 'JNJ', company: 'Johnson & Johnson', eps: 2.56, rev: '$21.4B' },
    { symbol: 'WMT', company: 'Walmart Inc.', eps: 1.53, rev: '$161.0B' },
    { symbol: 'PG', company: 'Procter & Gamble', eps: 1.68, rev: '$20.6B' },
    { symbol: 'UNH', company: 'UnitedHealth Group', eps: 6.73, rev: '$92.4B' },
    { symbol: 'HD', company: 'Home Depot Inc.', eps: 3.81, rev: '$37.3B' },
    { symbol: 'BAC', company: 'Bank of America', eps: 0.82, rev: '$25.2B' },
    { symbol: 'DIS', company: 'Walt Disney Co.', eps: 1.21, rev: '$22.3B' },
    { symbol: 'NFLX', company: 'Netflix Inc.', eps: 4.52, rev: '$8.8B' },
    { symbol: 'CRM', company: 'Salesforce Inc.', eps: 2.11, rev: '$8.7B' },
    { symbol: 'AMD', company: 'AMD Inc.', eps: 0.68, rev: '$5.8B' },
    { symbol: 'INTC', company: 'Intel Corp.', eps: 0.22, rev: '$12.9B' },
  ]

  const seed = weekStart.getTime()
  let rng = seed
  const rand = () => { rng = (rng * 16807 + 0) % 2147483647; return rng / 2147483647 }

  const entries: EarningsEntry[] = []
  const shuffled = [...companies].sort(() => rand() - 0.5).slice(0, 8 + Math.floor(rand() * 5))

  shuffled.forEach((c, i) => {
    const dayIdx = Math.floor(rand() * 5)
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dayIdx)
    const time = rand() > 0.5 ? 'BMO' as const : 'AMC' as const
    const hasActual = rand() > 0.5
    const surprise = (rand() * 20 - 5)
    const epsActual = hasActual ? +(c.eps + c.eps * surprise / 100).toFixed(2) : undefined

    entries.push({
      id: `earn-${i}`,
      symbol: c.symbol,
      company: c.company,
      date: d.toISOString().slice(0, 10),
      time,
      epsEstimate: c.eps,
      epsActual,
      revenueEstimate: c.rev,
      revenueActual: hasActual ? c.rev.replace(/[\d.]+/, (m) => (parseFloat(m) * (1 + surprise / 100)).toFixed(1)) : undefined,
      surprise: hasActual ? +surprise.toFixed(1) : undefined,
    })
  })

  return entries.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

function EarningsTab({ weekStart }: { weekStart: Date }) {
  const earnings = useMemo(() => generateEarnings(weekStart), [weekStart])

  const beats = earnings.filter((e) => e.surprise !== undefined && e.surprise > 0).length
  const misses = earnings.filter((e) => e.surprise !== undefined && e.surprise < 0).length
  const pending = earnings.filter((e) => e.surprise === undefined).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{earnings.length}</p>
              <p className="text-xs text-muted-foreground">Reporting</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-lg font-bold">{beats}</p>
              <p className="text-xs text-muted-foreground">Beats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-lg font-bold">{misses}</p>
              <p className="text-xs text-muted-foreground">Misses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Earnings Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Company</th>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-right font-medium">EPS Est.</th>
                  <th className="px-4 py-2 text-right font-medium">EPS Act.</th>
                  <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Rev Est.</th>
                  <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Rev Act.</th>
                  <th className="px-4 py-2 text-right font-medium">Surprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {earnings.map((e) => (
                  <tr key={e.id} className="hover:bg-accent/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{e.symbol}</span>
                        <span className="hidden text-xs text-muted-foreground lg:inline">{e.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <Badge variant="outline" className="h-4 px-1 text-xs">
                          {e.time}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">${e.epsEstimate.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {e.epsActual !== undefined ? `$${e.epsActual.toFixed(2)}` : '—'}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right sm:table-cell">{e.revenueEstimate}</td>
                    <td className="hidden px-4 py-2.5 text-right sm:table-cell">{e.revenueActual ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      {e.surprise !== undefined ? (
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-xs"
                          style={{ color: e.surprise >= 0 ? '#10b981' : '#ef4444' }}
                        >
                          {e.surprise >= 0 ? '+' : ''}{e.surprise.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Main Page ---

type Tab = 'economic' | 'earnings'

export function EconomicCalendar() {
  const [tab, setTab] = useState<Tab>('economic')
  const [weekOffset, setWeekOffset] = useState(0)
  const [impactFilter, setImpactFilter] = useState<Set<Impact>>(new Set(FILTERS))
  const [countryFilter, setCountryFilter] = useState('All')

  const weekStart = useMemo(() => {
    const m = getMonday(new Date())
    m.setDate(m.getDate() + weekOffset * 7)
    return m
  }, [weekOffset])

  const events = useMemo(() => generateEvents(weekStart), [weekStart])

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (!impactFilter.has(e.impact)) return false
      if (countryFilter !== 'All' && e.country !== countryFilter) return false
      return true
    })
  }, [events, impactFilter, countryFilter])

  const groupedByDay = useMemo(() => {
    const groups: Record<string, EconomicEvent[]> = {}
    for (let i = 0; i < 5; i++) {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      groups[key] = []
    }
    filtered.forEach((e) => {
      if (groups[e.date]) groups[e.date].push(e)
    })
    return groups
  }, [filtered, weekStart])

  const weekLabel = (() => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 4)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(weekStart)} - ${fmt(end)}, ${end.getFullYear()}`
  })()

  const toggleImpact = (imp: Impact) => {
    setImpactFilter((prev) => {
      const next = new Set(prev)
      if (next.has(imp)) next.delete(imp)
      else next.add(imp)
      return next
    })
  }

  const highCount = filtered.filter((e) => e.impact === 'high').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Calendar className="h-5 w-5" />
          {tab === 'economic' ? 'Economic Calendar' : 'Earnings Calendar'}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setWeekOffset(0)}>
            This Week
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-accent/50 p-1">
        <Button
          variant={tab === 'economic' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={() => setTab('economic')}
        >
          Economic Events
        </Button>
        <Button
          variant={tab === 'earnings' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={() => setTab('earnings')}
        >
          Earnings Reports
        </Button>
      </div>

      <div className="text-sm font-medium text-muted-foreground">{weekLabel}</div>

      {tab === 'earnings' ? (
        <EarningsTab weekStart={weekStart} />
      ) : (
      <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Impact:</span>
        {FILTERS.map((imp) => {
          const cfg = impactConfig[imp]
          const active = impactFilter.has(imp)
          return (
            <Button
              key={imp}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => toggleImpact(imp)}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
            </Button>
          )
        })}
        <span className="ml-2 text-xs font-medium text-muted-foreground">Country:</span>
        {COUNTRIES.map((c) => (
          <Button
            key={c}
            variant={countryFilter === c ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setCountryFilter(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <AlertTriangle className="h-4 w-4" style={{ color: '#ef4444' }} />
            <div>
              <p className="text-lg font-bold">{highCount}</p>
              <p className="text-xs text-muted-foreground">High Impact</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{new Set(filtered.map((e) => e.country)).size}</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 py-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-lg font-bold">{filtered.filter((e) => e.actual).length}</p>
              <p className="text-xs text-muted-foreground">Released</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar grid */}
      {Object.entries(groupedByDay).map(([dateStr, dayEvents], dayIdx) => {
        const d = new Date(dateStr + 'T12:00:00')
        const isToday = new Date().toISOString().slice(0, 10) === dateStr
        return (
          <Card key={dateStr}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="font-bold">{dayNames[dayIdx]}</span>
                <span className="text-muted-foreground">
                  {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {isToday && <Badge variant="secondary" className="h-5 text-xs">Today</Badge>}
                <Badge variant="outline" className="ml-auto h-5 text-xs">{dayEvents.length} events</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dayEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No events match filters
                </div>
              ) : (
                <ScrollArea>
                  <div className="divide-y divide-border">
                    {dayEvents.map((ev) => {
                      const cfg = impactConfig[ev.impact]
                      return (
                        <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex w-12 shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {ev.time}
                          </div>
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-xs">
                            {countryFlag(ev.country)}
                          </Badge>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{ev.event}</span>
                          <div className="hidden items-center gap-4 text-xs sm:flex">
                            <div className="w-16 text-right">
                              <span className="text-muted-foreground">Act: </span>
                              <span className={ev.actual ? 'font-semibold' : 'text-muted-foreground'}>
                                {ev.actual ?? '—'}
                              </span>
                            </div>
                            <div className="w-16 text-right">
                              <span className="text-muted-foreground">Fcst: </span>
                              <span>{ev.forecast}</span>
                            </div>
                            <div className="w-16 text-right">
                              <span className="text-muted-foreground">Prev: </span>
                              <span>{ev.previous}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )
      })}
      </>
      )}
    </div>
  )
}
