import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTradingContext } from '@/contexts/TradingContext'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Cell,
} from 'recharts'
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Analytics() {
  const { trades } = useTradingContext()
  const { holdings, totals } = usePortfolioContext()

  // Monthly returns heatmap data
  const monthlyData = useMemo(() => {
    const byMonth = new Map<string, number>()
    trades.forEach((t) => {
      const d = new Date(t.timestamp)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      byMonth.set(key, (byMonth.get(key) ?? 0) + (t.side === 'SELL' ? t.total : -t.total))
    })

    // Generate last 12 months
    const now = new Date()
    const months: { month: string; pnl: number; label: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({
        month: key,
        pnl: byMonth.get(key) ?? 0,
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
      })
    }
    return months
  }, [trades])

  // Win rate by day of week
  const dayOfWeekData = useMemo(() => {
    const stats = DAYS.map((d) => ({ day: d, wins: 0, losses: 0, total: 0 }))
    trades.forEach((t) => {
      const dow = new Date(t.timestamp).getDay()
      if (t.side === 'SELL') {
        const pnl = t.total - t.quantity * t.price // simplified
        if (pnl >= 0) stats[dow].wins++
        else stats[dow].losses++
        stats[dow].total++
      }
    })
    return stats.map((s) => ({
      ...s,
      winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0,
    }))
  }, [trades])

  // Rolling Sharpe (simulated from trade PnL)
  const rollingSharpData = useMemo(() => {
    if (trades.length < 5) return []
    const sellTrades = trades.filter((t) => t.side === 'SELL').sort((a, b) => a.timestamp - b.timestamp)
    const returns = sellTrades.map((t) => t.total * 0.01) // simplified returns
    const window = 10
    const data: { index: number; sharpe: number; label: string }[] = []

    for (let i = window; i <= returns.length; i++) {
      const slice = returns.slice(i - window, i)
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length
      const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length) || 0.01
      const sharpe = (mean / std) * Math.sqrt(252)
      data.push({
        index: i,
        sharpe: Math.max(-3, Math.min(3, sharpe)),
        label: new Date(sellTrades[i - 1].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }
    return data
  }, [trades])

  // Summary stats
  const stats = useMemo(() => {
    const sellTrades = trades.filter((t) => t.side === 'SELL')
    const totalPnl = monthlyData.reduce((s, m) => s + m.pnl, 0)
    const positiveMonths = monthlyData.filter((m) => m.pnl > 0).length
    const bestMonth = monthlyData.reduce((best, m) => m.pnl > best.pnl ? m : best, monthlyData[0])
    const worstMonth = monthlyData.reduce((worst, m) => m.pnl < worst.pnl ? m : worst, monthlyData[0])

    return {
      totalTrades: sellTrades.length,
      totalPnl,
      positiveMonths,
      totalMonths: monthlyData.length,
      bestMonth,
      worstMonth,
      avgTradesPerDay: trades.length > 0
        ? (trades.length / Math.max(1, new Set(trades.map((t) => new Date(t.timestamp).toDateString())).size)).toFixed(1)
        : '0',
    }
  }, [trades, monthlyData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <BarChart3 className="h-5 w-5" />
          Performance Analytics
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{stats.totalTrades} trades</Badge>
          <Badge variant="outline" className="text-xs">{holdings.length} holdings</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Portfolio Value"
          value={`$${totals.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          sub={`${totals.totalGainPercent >= 0 ? '+' : ''}${totals.totalGainPercent.toFixed(2)}% total return`}
          color={totals.totalGainPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Positive Months"
          value={`${stats.positiveMonths}/${stats.totalMonths}`}
          sub={`${stats.totalMonths > 0 ? ((stats.positiveMonths / stats.totalMonths) * 100).toFixed(0) : 0}% win rate`}
          color={stats.positiveMonths > stats.totalMonths / 2 ? 'text-emerald-500' : 'text-red-500'}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Best Month"
          value={stats.bestMonth ? `$${stats.bestMonth.pnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0'}
          sub={stats.bestMonth?.label ?? '-'}
          color="text-emerald-500"
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Avg Trades/Day"
          value={stats.avgTradesPerDay}
          sub={`${stats.totalTrades} total sells`}
          color="text-blue-500"
        />
      </div>

      {/* Monthly Returns Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly P&L (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.some((m) => m.pnl !== 0) ? (
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(0 0% 10%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={index} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Execute some trades to see monthly performance data.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Win Rate by Day of Week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Win Rate by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            {dayOfWeekData.some((d) => d.total > 0) ? (
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(0 0% 10%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '6px', fontSize: '12px' }}
                      formatter={(value, name) => [name === 'winRate' ? `${Number(value).toFixed(0)}%` : value, name === 'winRate' ? 'Win Rate' : name]}
                    />
                    <Bar dataKey="winRate" radius={[3, 3, 0, 0]}>
                      {dayOfWeekData.map((entry, index) => (
                        <Cell key={index} fill={entry.winRate >= 50 ? '#10b981' : entry.total > 0 ? '#ef4444' : 'hsl(0 0% 25%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Need sell trades to calculate win rates.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Rolling Sharpe */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rolling Sharpe Ratio (10-trade window)</CardTitle>
          </CardHeader>
          <CardContent>
            {rollingSharpData.length > 0 ? (
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rollingSharpData}>
                    <defs>
                      <linearGradient id="sharpeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(0 0% 10%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '6px', fontSize: '12px' }}
                      formatter={(value) => [Number(value).toFixed(2), 'Sharpe']}
                    />
                    <Area type="monotone" dataKey="sharpe" stroke="#3b82f6" strokeWidth={2} fill="url(#sharpeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Need at least 10 sell trades for rolling Sharpe.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holdings Performance Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Holdings Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {holdings.map((h) => (
              <div key={h.symbol} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-bold">{h.symbol}</p>
                  <p className="text-xs text-muted-foreground">{h.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${h.totalGainPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {h.totalGainPercent >= 0 ? '+' : ''}{h.totalGainPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${h.totalGain.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent">
          {icon}
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
