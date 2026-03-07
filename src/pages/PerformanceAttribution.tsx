import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Target, Activity, BarChart3, Calendar,
} from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEARS = [2023, 2024, 2025]

function generateMonthlyReturns() {
  const rand = seededRandom(42)
  const data: { year: number; month: string; monthIdx: number; return: number }[] = []
  for (const year of YEARS) {
    const maxMonth = year === 2025 ? 2 : 11
    for (let m = 0; m <= maxMonth; m++) {
      data.push({
        year,
        month: MONTHS[m],
        monthIdx: m,
        return: parseFloat(((rand() - 0.45) * 12).toFixed(2)),
      })
    }
  }
  return data
}

function generateEquityCurve() {
  const rand = seededRandom(99)
  const points: { date: string; portfolio: number; benchmark: number }[] = []
  let pVal = 100000
  let bVal = 100000
  const start = new Date(2023, 0, 1)
  for (let w = 0; w < 115; w++) {
    const d = new Date(start.getTime() + w * 7 * 86400000)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    pVal *= 1 + (rand() - 0.45) * 0.04
    bVal *= 1 + (rand() - 0.47) * 0.03
    points.push({ date: label, portfolio: Math.round(pVal), benchmark: Math.round(bVal) })
  }
  return points
}

function generateDrawdown() {
  const equity = generateEquityCurve()
  let peak = equity[0].portfolio
  return equity.map((p) => {
    if (p.portfolio > peak) peak = p.portfolio
    const dd = ((p.portfolio - peak) / peak) * 100
    return { date: p.date, drawdown: parseFloat(dd.toFixed(2)) }
  })
}

function generateRollingSharpe() {
  const rand = seededRandom(200)
  const points: { date: string; sharpe: number }[] = []
  const start = new Date(2023, 0, 1)
  let sharpe = 1.2
  for (let w = 0; w < 115; w++) {
    const d = new Date(start.getTime() + w * 7 * 86400000)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    sharpe += (rand() - 0.5) * 0.3
    sharpe = Math.max(-0.5, Math.min(3, sharpe))
    points.push({ date: label, sharpe: parseFloat(sharpe.toFixed(2)) })
  }
  return points
}

const SECTORS = [
  { name: 'Technology', weight: 35, return: 18.5 },
  { name: 'Healthcare', weight: 15, return: 8.2 },
  { name: 'Financials', weight: 12, return: 12.1 },
  { name: 'Consumer Disc.', weight: 10, return: -3.4 },
  { name: 'Energy', weight: 8, return: 6.7 },
  { name: 'Industrials', weight: 7, return: 9.3 },
  { name: 'Communications', weight: 6, return: 14.8 },
  { name: 'Other', weight: 7, return: 4.1 },
]

function cellColor(val: number): string {
  if (val >= 5) return '#059669'
  if (val >= 2) return '#34d399'
  if (val >= 0) return '#6ee7b7'
  if (val >= -2) return '#fca5a5'
  if (val >= -5) return '#f87171'
  return '#dc2626'
}

export function PerformanceAttribution() {
  const { totals } = usePortfolioContext()

  const monthlyReturns = useMemo(() => generateMonthlyReturns(), [])
  const equityCurve = useMemo(() => generateEquityCurve(), [])
  const drawdown = useMemo(() => generateDrawdown(), [])
  const rollingSharpe = useMemo(() => generateRollingSharpe(), [])

  const totalReturn = equityCurve.length > 0
    ? (((equityCurve[equityCurve.length - 1].portfolio - equityCurve[0].portfolio) / equityCurve[0].portfolio) * 100)
    : 0
  const benchmarkReturn = equityCurve.length > 0
    ? (((equityCurve[equityCurve.length - 1].benchmark - equityCurve[0].benchmark) / equityCurve[0].benchmark) * 100)
    : 0
  const alpha = totalReturn - benchmarkReturn
  const maxDD = drawdown.reduce((min, d) => Math.min(min, d.drawdown), 0)
  const avgSharpe = rollingSharpe.length > 0
    ? rollingSharpe.reduce((s, p) => s + p.sharpe, 0) / rollingSharpe.length
    : 0

  const stats = [
    { label: 'Total Return', value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%`, icon: TrendingUp, positive: totalReturn >= 0 },
    { label: 'Alpha vs SPY', value: `${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}%`, icon: Target, positive: alpha >= 0 },
    { label: 'Max Drawdown', value: `${maxDD.toFixed(1)}%`, icon: TrendingDown, positive: false },
    { label: 'Avg Sharpe', value: avgSharpe.toFixed(2), icon: Activity, positive: avgSharpe >= 1 },
  ]

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <BarChart3 className="h-5 w-5" />
        Performance Attribution
      </h2>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${s.positive ? 'text-emerald-500' : s.label === 'Max Drawdown' ? 'text-red-500' : ''}`}>
                  {s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equity Curve */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            Portfolio vs Benchmark (SPY)
            <Badge variant="outline" className="text-xs">Since Jan 2023</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={10} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => [`$${Number(v).toLocaleString()}`, name === 'portfolio' ? 'Portfolio' : 'SPY Benchmark']}
              />
              <Area type="monotone" dataKey="portfolio" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
              <Area type="monotone" dataKey="benchmark" stroke="#6366f1" fill="#6366f120" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Returns Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Monthly Returns Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-1 py-1 text-left text-muted-foreground">Year</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="px-1 py-1 text-center text-muted-foreground">{m}</th>
                    ))}
                    <th className="px-1 py-1 text-center text-muted-foreground">YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {YEARS.map((year) => {
                    const yearData = monthlyReturns.filter((d) => d.year === year)
                    const ytd = yearData.reduce((s, d) => s + d.return, 0)
                    return (
                      <tr key={year}>
                        <td className="px-1 py-1 font-medium">{year}</td>
                        {MONTHS.map((m, mi) => {
                          const cell = yearData.find((d) => d.monthIdx === mi)
                          if (!cell) return <td key={m} className="px-1 py-1" />
                          return (
                            <td
                              key={m}
                              className="px-1 py-1 text-center font-medium text-white"
                              style={{
                                backgroundColor: cellColor(cell.return),
                                borderRadius: 4,
                                minWidth: 36,
                              }}
                            >
                              {cell.return > 0 ? '+' : ''}{cell.return}%
                            </td>
                          )
                        })}
                        <td
                          className="px-1 py-1 text-center font-bold text-white"
                          style={{ backgroundColor: cellColor(ytd), borderRadius: 4 }}
                        >
                          {ytd > 0 ? '+' : ''}{ytd.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Drawdown Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Drawdown Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={drawdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={15} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Drawdown']}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#ef444430" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Rolling Sharpe */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rolling Sharpe Ratio (12w)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rollingSharpe}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={15} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [Number(v).toFixed(2), 'Sharpe']}
                />
                <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Good', fontSize: 10, fill: '#f59e0b' }} />
                <Area type="monotone" dataKey="sharpe" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector Attribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sector Attribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SECTORS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [`${v}%`, name === 'return' ? 'Return' : 'Weight']}
                />
                <Bar dataKey="return" radius={[0, 4, 4, 0]}>
                  {SECTORS.map((s, i) => (
                    <Cell key={i} fill={s.return >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <Badge key={s.name} variant="outline" className="text-xs">
                  {s.name}: {s.weight}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Win Rate" value={`${totals.positionCount > 0 ? ((totals.winners / totals.positionCount) * 100).toFixed(0) : 0}%`} sub="Profitable positions" />
        <MetricCard label="Sortino Ratio" value="1.85" sub="Downside risk-adjusted" />
        <MetricCard label="Calmar Ratio" value={(totalReturn / Math.abs(maxDD || 1)).toFixed(2)} sub="Return / Max DD" />
        <MetricCard label="Beta" value="0.92" sub="vs S&P 500" />
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}
