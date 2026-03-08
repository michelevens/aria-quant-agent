import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine,
} from 'recharts'
import { CalendarDays, TrendingUp, Clock, CheckCircle, Target } from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface EarningsEvent {
  symbol: string
  company: string
  date: string
  dateObj: Date
  time: 'BMO' | 'AMC'
  epsEstimate: number
  epsActual: number | null
  revenueEstimate: number
  revenueActual: number | null
  surprise: number | null
  revSurprise: number | null
  status: 'upcoming' | 'reported'
  afterMove: number | null
}

const EARNINGS_COMPANIES = [
  { symbol: 'NVDA', company: 'NVIDIA Corp', epsBase: 5.16, revBase: 22.1 },
  { symbol: 'AAPL', company: 'Apple Inc', epsBase: 2.10, revBase: 94.9 },
  { symbol: 'MSFT', company: 'Microsoft Corp', epsBase: 3.32, revBase: 65.6 },
  { symbol: 'GOOGL', company: 'Alphabet Inc', epsBase: 2.12, revBase: 88.3 },
  { symbol: 'AMZN', company: 'Amazon.com Inc', epsBase: 1.43, revBase: 170.0 },
  { symbol: 'META', company: 'Meta Platforms', epsBase: 6.03, revBase: 40.6 },
  { symbol: 'TSLA', company: 'Tesla Inc', epsBase: 0.73, revBase: 25.2 },
  { symbol: 'JPM', company: 'JPMorgan Chase', epsBase: 4.81, revBase: 43.3 },
  { symbol: 'AMD', company: 'AMD Inc', epsBase: 0.92, revBase: 6.8 },
  { symbol: 'CRM', company: 'Salesforce Inc', epsBase: 2.56, revBase: 9.4 },
  { symbol: 'NFLX', company: 'Netflix Inc', epsBase: 4.88, revBase: 9.8 },
  { symbol: 'V', company: 'Visa Inc', epsBase: 2.75, revBase: 9.6 },
  { symbol: 'UNH', company: 'UnitedHealth', epsBase: 7.14, revBase: 99.8 },
  { symbol: 'MA', company: 'Mastercard Inc', epsBase: 3.54, revBase: 7.3 },
  { symbol: 'COST', company: 'Costco', epsBase: 3.92, revBase: 60.5 },
  { symbol: 'LLY', company: 'Eli Lilly', epsBase: 3.28, revBase: 11.3 },
  { symbol: 'WMT', company: 'Walmart Inc', epsBase: 1.80, revBase: 167.5 },
  { symbol: 'AVGO', company: 'Broadcom Inc', epsBase: 12.42, revBase: 14.1 },
  { symbol: 'HD', company: 'Home Depot', epsBase: 3.81, revBase: 40.2 },
  { symbol: 'PG', company: 'Procter & Gamble', epsBase: 1.84, revBase: 21.7 },
]

function generateEarnings(): EarningsEvent[] {
  const rand = seededRandom(999)
  const events: EarningsEvent[] = []
  const now = new Date()

  for (const co of EARNINGS_COMPANIES) {
    // Past quarter (reported)
    const pastDays = Math.floor(10 + rand() * 50)
    const pastDate = new Date(now.getTime() - pastDays * 86400000)
    const surprise = (rand() - 0.4) * 15 // slight positive bias
    const revSurprise = (rand() - 0.45) * 8
    const afterMove = surprise > 0 ? rand() * 8 : -(rand() * 10)

    events.push({
      symbol: co.symbol,
      company: co.company,
      date: pastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateObj: pastDate,
      time: rand() > 0.5 ? 'BMO' : 'AMC',
      epsEstimate: co.epsBase,
      epsActual: Math.round(co.epsBase * (1 + surprise / 100) * 100) / 100,
      revenueEstimate: co.revBase,
      revenueActual: Math.round(co.revBase * (1 + revSurprise / 100) * 10) / 10,
      surprise: Math.round(surprise * 10) / 10,
      revSurprise: Math.round(revSurprise * 10) / 10,
      status: 'reported',
      afterMove: Math.round(afterMove * 10) / 10,
    })

    // Upcoming quarter
    const futureDays = Math.floor(5 + rand() * 60)
    const futureDate = new Date(now.getTime() + futureDays * 86400000)

    events.push({
      symbol: co.symbol,
      company: co.company,
      date: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateObj: futureDate,
      time: rand() > 0.5 ? 'BMO' : 'AMC',
      epsEstimate: Math.round(co.epsBase * (1 + rand() * 0.1) * 100) / 100,
      epsActual: null,
      revenueEstimate: Math.round(co.revBase * (1 + rand() * 0.05) * 10) / 10,
      revenueActual: null,
      surprise: null,
      revSurprise: null,
      status: 'upcoming',
      afterMove: null,
    })
  }

  return events.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
}

type Tab = 'upcoming' | 'reported' | 'all'

export function EarningsCalendar() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const allEvents = useMemo(() => generateEarnings(), [])

  const filtered = useMemo(() => {
    if (tab === 'upcoming') return allEvents.filter((e) => e.status === 'upcoming')
    if (tab === 'reported') return allEvents.filter((e) => e.status === 'reported')
    return allEvents
  }, [allEvents, tab])

  const reported = allEvents.filter((e) => e.status === 'reported')
  const upcoming = allEvents.filter((e) => e.status === 'upcoming')
  const beats = reported.filter((e) => (e.surprise ?? 0) > 0).length
  const misses = reported.filter((e) => (e.surprise ?? 0) < 0).length
  const avgSurprise = reported.length > 0
    ? reported.reduce((s, e) => s + (e.surprise ?? 0), 0) / reported.length
    : 0

  // Surprise chart for reported
  const surpriseChart = useMemo(() =>
    reported.map((e) => ({
      symbol: e.symbol,
      surprise: e.surprise ?? 0,
    })).sort((a, b) => b.surprise - a.surprise),
    [reported],
  )

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <CalendarDays className="h-5 w-5" />
        Earnings Calendar
      </h2>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-lg font-bold">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">earnings this quarter</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Beat Rate</p>
              <p className="text-lg font-bold text-emerald-500">
                {reported.length > 0 ? ((beats / reported.length) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">{beats} beats / {misses} misses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <Target className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg EPS Surprise</p>
              <p className={`text-lg font-bold ${avgSurprise >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {avgSurprise >= 0 ? '+' : ''}{avgSurprise.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">vs consensus</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <TrendingUp className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Post-Earnings Move</p>
              {(() => {
                const moves = reported.filter((e) => e.afterMove !== null)
                const avg = moves.length > 0 ? moves.reduce((s, e) => s + (e.afterMove ?? 0), 0) / moves.length : 0
                return (
                  <>
                    <p className={`text-lg font-bold ${avg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {avg >= 0 ? '+' : ''}{avg.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">next-day</p>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EPS Surprise Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">EPS Surprise (% vs Estimate)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={surpriseChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="symbol" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, 'EPS Surprise']}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="surprise" radius={[4, 4, 0, 0]}>
                {surpriseChart.map((d, i) => (
                  <Cell key={i} fill={d.surprise >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs + Table */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-1 text-xs">
            <Clock className="h-3.5 w-3.5" /> Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="reported" className="gap-1 text-xs">
            <CheckCircle className="h-3.5 w-3.5" /> Reported ({reported.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1 text-xs">
            All ({allEvents.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e, i) => (
          <Card key={`${e.symbol}-${e.status}-${i}`} className="transition-all hover:shadow-md">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{e.symbol}</p>
                    <Badge variant="outline" className="text-xs">
                      {e.time === 'BMO' ? 'Before Open' : 'After Close'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{e.date}</p>
                  {e.status === 'upcoming' ? (
                    <Badge variant="outline" className="text-xs" style={{ color: '#3b82f6', borderColor: '#3b82f6' }}>
                      Upcoming
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs" style={{
                      color: (e.surprise ?? 0) >= 0 ? '#10b981' : '#ef4444',
                      borderColor: (e.surprise ?? 0) >= 0 ? '#10b981' : '#ef4444',
                    }}>
                      {(e.surprise ?? 0) >= 0 ? 'Beat' : 'Miss'}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">EPS Est: </span>
                  <span className="font-medium">${e.epsEstimate.toFixed(2)}</span>
                </div>
                {e.epsActual !== null ? (
                  <div>
                    <span className="text-muted-foreground">Actual: </span>
                    <span className={`font-medium ${(e.surprise ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      ${e.epsActual.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Pending</div>
                )}
                <div>
                  <span className="text-muted-foreground">Rev Est: </span>
                  <span className="font-medium">${e.revenueEstimate.toFixed(1)}B</span>
                </div>
                {e.revenueActual !== null ? (
                  <div>
                    <span className="text-muted-foreground">Actual: </span>
                    <span className={`font-medium ${(e.revSurprise ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      ${e.revenueActual.toFixed(1)}B
                    </span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Pending</div>
                )}
              </div>

              {e.status === 'reported' && (
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="text-xs" style={{
                    color: (e.surprise ?? 0) >= 0 ? '#10b981' : '#ef4444',
                    borderColor: (e.surprise ?? 0) >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    EPS: {(e.surprise ?? 0) >= 0 ? '+' : ''}{e.surprise?.toFixed(1)}%
                  </Badge>
                  {e.afterMove !== null && (
                    <Badge variant="outline" className="text-xs" style={{
                      color: e.afterMove >= 0 ? '#10b981' : '#ef4444',
                      borderColor: e.afterMove >= 0 ? '#10b981' : '#ef4444',
                    }}>
                      Move: {e.afterMove >= 0 ? '+' : ''}{e.afterMove.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No earnings events in this view</p>
      )}
    </div>
  )
}
