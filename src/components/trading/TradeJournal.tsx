import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTradingContext } from '@/contexts/TradingContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BookOpen, TrendingUp, TrendingDown, Target, Flame } from 'lucide-react'

interface SymbolStats {
  symbol: string
  trades: number
  volume: number
  buyVolume: number
  sellVolume: number
  avgPrice: number
}

interface DailyPnl {
  date: string
  volume: number
  trades: number
}

export function TradeJournal() {
  const { trades } = useTradingContext()

  const symbolStats = useMemo(() => {
    const map = new Map<string, SymbolStats>()
    trades.forEach((t) => {
      const existing = map.get(t.symbol) ?? {
        symbol: t.symbol,
        trades: 0,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        avgPrice: 0,
      }
      existing.trades += 1
      existing.volume += t.total
      if (t.side === 'BUY') existing.buyVolume += t.total
      else existing.sellVolume += t.total
      existing.avgPrice = existing.volume / existing.trades
      map.set(t.symbol, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.volume - a.volume)
  }, [trades])

  const dailyData = useMemo(() => {
    const map = new Map<string, DailyPnl>()
    trades.forEach((t) => {
      const date = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const existing = map.get(date) ?? { date, volume: 0, trades: 0 }
      existing.volume += t.total
      existing.trades += 1
      map.set(date, existing)
    })
    return Array.from(map.values()).reverse().slice(-14)
  }, [trades])

  const streaks = useMemo(() => {
    if (trades.length === 0) return { current: 0, best: 0, type: 'none' as const }
    // Group consecutive buy/sell streaks
    let currentStreak = 1
    let bestStreak = 1
    let currentType = trades[0]?.side ?? 'BUY'

    for (let i = 1; i < trades.length; i++) {
      if (trades[i].side === trades[i - 1].side) {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 1
        currentType = trades[i].side
      }
    }

    return { current: currentStreak, best: bestStreak, type: currentType }
  }, [trades])

  const totalVolume = trades.reduce((s, t) => s + t.total, 0)
  const buyVolume = trades.filter((t) => t.side === 'BUY').reduce((s, t) => s + t.total, 0)
  const sellVolume = trades.filter((t) => t.side === 'SELL').reduce((s, t) => s + t.total, 0)
  const avgTradeSize = trades.length > 0 ? totalVolume / trades.length : 0

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No trades yet. Place orders from the Trade page to build your journal.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="text-sm font-bold">${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Buy Volume</p>
              <p className="text-sm font-bold text-emerald-500">${buyVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sell Volume</p>
              <p className="text-sm font-bold text-red-500">${sellVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-sm font-bold">{streaks.current} {streaks.type} (Best: {streaks.best})</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Volume']}
                  />
                  <Bar dataKey="volume" radius={[3, 3, 0, 0]}>
                    {dailyData.map((_, index) => (
                      <Cell key={index} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Per-Symbol Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto" style={{ maxHeight: '260px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Symbol</TableHead>
                    <TableHead className="text-right text-xs">Trades</TableHead>
                    <TableHead className="text-right text-xs">Volume</TableHead>
                    <TableHead className="text-right text-xs">Buy</TableHead>
                    <TableHead className="text-right text-xs">Sell</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {symbolStats.map((s) => (
                    <TableRow key={s.symbol}>
                      <TableCell className="text-sm font-bold">{s.symbol}</TableCell>
                      <TableCell className="text-right text-sm">{s.trades}</TableCell>
                      <TableCell className="text-right text-sm">${s.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-500">${s.buyVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right text-sm text-red-500">${s.sellVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Trade History</span>
            <Badge variant="outline" className="text-xs">{trades.length} trades | Avg: ${avgTradeSize.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto" style={{ maxHeight: '300px' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Symbol</TableHead>
                  <TableHead className="text-xs">Side</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Price</TableHead>
                  <TableHead className="text-right text-xs">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.slice(0, 100).map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(trade.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold ${trade.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trade.side}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{trade.quantity}</TableCell>
                    <TableCell className="text-right text-sm">${trade.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
