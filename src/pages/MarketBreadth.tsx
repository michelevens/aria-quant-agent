import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, Cell,
} from 'recharts'
import {
  Activity, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateAdvDecLine() {
  const rand = seededRandom(555)
  const points: { date: string; adLine: number; advances: number; declines: number }[] = []
  let cumulative = 0
  const start = new Date(2024, 6, 1)
  for (let d = 0; d < 180; d++) {
    const dt = new Date(start.getTime() + d * 86400000)
    if (dt.getDay() === 0 || dt.getDay() === 6) continue
    const advances = Math.round(200 + rand() * 300)
    const declines = Math.round(150 + rand() * 350)
    cumulative += advances - declines
    points.push({
      date: `${dt.getMonth() + 1}/${dt.getDate()}`,
      adLine: cumulative,
      advances,
      declines,
    })
  }
  return points
}

function generateNewHighsLows() {
  const rand = seededRandom(888)
  const points: { date: string; highs: number; lows: number }[] = []
  const start = new Date(2024, 9, 1)
  for (let d = 0; d < 90; d++) {
    const dt = new Date(start.getTime() + d * 86400000)
    if (dt.getDay() === 0 || dt.getDay() === 6) continue
    points.push({
      date: `${dt.getMonth() + 1}/${dt.getDate()}`,
      highs: Math.round(20 + rand() * 80),
      lows: Math.round(10 + rand() * 60),
    })
  }
  return points
}

const SECTOR_ROTATION = [
  { sector: 'Technology', current: 8.2, prev: 5.1, momentum: 'leading' as const },
  { sector: 'Healthcare', current: 3.4, prev: 4.8, momentum: 'weakening' as const },
  { sector: 'Financials', current: 5.1, prev: 2.3, momentum: 'improving' as const },
  { sector: 'Consumer Disc.', current: -1.2, prev: 3.5, momentum: 'lagging' as const },
  { sector: 'Energy', current: 2.8, prev: -1.4, momentum: 'improving' as const },
  { sector: 'Industrials', current: 4.5, prev: 3.2, momentum: 'leading' as const },
  { sector: 'Materials', current: -0.8, prev: 1.2, momentum: 'lagging' as const },
  { sector: 'Utilities', current: 1.5, prev: 2.8, momentum: 'weakening' as const },
  { sector: 'Real Estate', current: -2.1, prev: -0.5, momentum: 'lagging' as const },
  { sector: 'Comm. Services', current: 6.3, prev: 4.1, momentum: 'leading' as const },
  { sector: 'Consumer Staples', current: 0.9, prev: 1.5, momentum: 'weakening' as const },
]

const MARKET_INTERNALS: { label: string; value: string; status: 'bullish' | 'bearish' | 'neutral' }[] = [
  { label: 'S&P 500 Above 200 DMA', value: '68%', status: 'bullish' },
  { label: 'S&P 500 Above 50 DMA', value: '55%', status: 'neutral' },
  { label: 'McClellan Oscillator', value: '+42', status: 'bullish' },
  { label: 'Arms Index (TRIN)', value: '0.85', status: 'bullish' },
  { label: 'Bullish Percent Index', value: '62%', status: 'bullish' },
  { label: 'Up/Down Volume', value: '1.4x', status: 'bullish' },
  { label: 'NYSE Composite %', value: '-0.3%', status: 'neutral' },
  { label: 'Margin Debt Growth', value: '+2.1%', status: 'neutral' },
]

const momentumColor = {
  leading: '#10b981',
  improving: '#3b82f6',
  weakening: '#f59e0b',
  lagging: '#ef4444',
}

export function MarketBreadth() {
  const adLine = useMemo(() => generateAdvDecLine(), [])
  const newHighsLows = useMemo(() => generateNewHighsLows(), [])

  const latestAD = adLine[adLine.length - 1]
  const totalAdvances = latestAD?.advances ?? 0
  const totalDeclines = latestAD?.declines ?? 0
  const adRatio = totalDeclines > 0 ? (totalAdvances / totalDeclines).toFixed(2) : '—'

  const latestHL = newHighsLows[newHighsLows.length - 1]
  const totalHighs = latestHL?.highs ?? 0
  const totalLows = latestHL?.lows ?? 0

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Activity className="h-5 w-5" />
        Market Breadth
      </h2>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BreadthCard
          label="Advances"
          value={totalAdvances.toString()}
          sub="NYSE today"
          icon={ArrowUpRight}
          color="text-emerald-500"
        />
        <BreadthCard
          label="Declines"
          value={totalDeclines.toString()}
          sub="NYSE today"
          icon={ArrowDownRight}
          color="text-red-500"
        />
        <BreadthCard
          label="A/D Ratio"
          value={adRatio}
          sub={Number(adRatio) > 1 ? 'Positive breadth' : 'Negative breadth'}
          icon={BarChart3}
          color={Number(adRatio) > 1 ? 'text-emerald-500' : 'text-red-500'}
        />
        <BreadthCard
          label="New Highs / Lows"
          value={`${totalHighs} / ${totalLows}`}
          sub={totalHighs > totalLows ? 'Bullish signal' : 'Bearish signal'}
          icon={Activity}
          color={totalHighs > totalLows ? 'text-emerald-500' : 'text-red-500'}
        />
      </div>

      {/* Advance/Decline Line */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Advance/Decline Line (NYSE)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={adLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={15} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => [Number(v).toLocaleString(), name === 'adLine' ? 'A/D Line' : String(name)]}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Area type="monotone" dataKey="adLine" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* New Highs vs Lows */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New 52-Week Highs vs Lows</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newHighsLows.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="highs" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="lows" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Market Internals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Market Internals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MARKET_INTERNALS.map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{m.value}</span>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      color: m.status === 'bullish' ? '#10b981' : m.status === 'bearish' ? '#ef4444' : '#f59e0b',
                      borderColor: m.status === 'bullish' ? '#10b981' : m.status === 'bearish' ? '#ef4444' : '#f59e0b',
                    }}
                  >
                    {m.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sector Rotation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sector Rotation (1-Month Performance)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={SECTOR_ROTATION} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
              <YAxis dataKey="sector" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}%`]}
              />
              <ReferenceLine x={0} stroke="var(--border)" />
              <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]}>
                {SECTOR_ROTATION.map((s, i) => (
                  <Cell key={i} fill={s.current >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap gap-2">
            {SECTOR_ROTATION.map((s) => (
              <Badge
                key={s.sector}
                variant="outline"
                className="text-xs"
                style={{ color: momentumColor[s.momentum], borderColor: momentumColor[s.momentum] }}
              >
                {s.sector}: {s.momentum}
                {s.momentum === 'leading' || s.momentum === 'improving' ? (
                  <TrendingUp className="ml-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rotation legend */}
      <div className="flex flex-wrap gap-3">
        {(['leading', 'improving', 'weakening', 'lagging'] as const).map((phase) => (
          <div key={phase} className="flex items-center gap-1.5 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: momentumColor[phase] }} />
            <span className="capitalize text-muted-foreground">{phase}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BreadthCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: typeof Activity; color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}
