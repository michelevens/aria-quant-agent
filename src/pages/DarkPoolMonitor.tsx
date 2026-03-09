import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import {
  Eye, TrendingUp, TrendingDown, Search, RefreshCw, AlertTriangle, Zap,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface DarkPoolPrint {
  id: number
  symbol: string
  price: number
  size: number
  notional: number
  time: string
  side: 'buy' | 'sell'
  venue: string
  premium: number
}

interface BlockTrade {
  symbol: string
  totalVolume: number
  totalNotional: number
  prints: number
  netSide: 'buy' | 'sell'
  avgPremium: number
}

const SYMBOLS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'AMD', 'SPY', 'QQQ', 'NFLX', 'JPM', 'BAC', 'V', 'COIN', 'PLTR']
const VENUES = ['UBSS', 'CODA', 'JPMX', 'MSPL', 'SGMT', 'DBSX', 'XDKP', 'IEXG']

function generatePrints(count: number): DarkPoolPrint[] {
  const rand = seededRandom(Date.now() % 10000 + 42)
  const prints: DarkPoolPrint[] = []
  const baseHour = 10

  for (let i = 0; i < count; i++) {
    const symbol = SYMBOLS[Math.floor(rand() * SYMBOLS.length)]
    const basePrice = symbol === 'NVDA' ? 890 : symbol === 'AAPL' ? 230 : symbol === 'TSLA' ? 380 : symbol === 'MSFT' ? 415 : symbol === 'AMZN' ? 205 : symbol === 'META' ? 510 : symbol === 'GOOGL' ? 175 : symbol === 'AMD' ? 165 : symbol === 'SPY' ? 525 : symbol === 'QQQ' ? 450 : symbol === 'NFLX' ? 680 : symbol === 'JPM' ? 195 : symbol === 'BAC' ? 38 : symbol === 'V' ? 280 : symbol === 'COIN' ? 240 : 22
    const price = basePrice * (1 + (rand() - 0.5) * 0.02)
    const isBlock = rand() > 0.7
    const size = isBlock ? Math.round(5000 + rand() * 95000) : Math.round(100 + rand() * 4900)
    const side = rand() > 0.48 ? 'buy' as const : 'sell' as const
    const premium = (rand() - 0.5) * 2
    const hour = baseHour + Math.floor(rand() * 6)
    const minute = Math.floor(rand() * 60)
    const second = Math.floor(rand() * 60)

    prints.push({
      id: i,
      symbol,
      price: parseFloat(price.toFixed(2)),
      size,
      notional: parseFloat((price * size).toFixed(0)),
      time: `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`,
      side,
      venue: VENUES[Math.floor(rand() * VENUES.length)],
      premium: parseFloat(premium.toFixed(2)),
    })
  }

  return prints.sort((a, b) => b.notional - a.notional)
}

function aggregateBlocks(prints: DarkPoolPrint[]): BlockTrade[] {
  const map = new Map<string, { buys: number; sells: number; vol: number; notional: number; count: number; premiumSum: number }>()
  for (const p of prints) {
    const existing = map.get(p.symbol) ?? { buys: 0, sells: 0, vol: 0, notional: 0, count: 0, premiumSum: 0 }
    existing.vol += p.size
    existing.notional += p.notional
    existing.count++
    existing.premiumSum += p.premium
    if (p.side === 'buy') existing.buys += p.notional
    else existing.sells += p.notional
    map.set(p.symbol, existing)
  }

  return [...map.entries()]
    .map(([symbol, d]) => ({
      symbol,
      totalVolume: d.vol,
      totalNotional: d.notional,
      prints: d.count,
      netSide: d.buys >= d.sells ? 'buy' as const : 'sell' as const,
      avgPremium: parseFloat((d.premiumSum / d.count).toFixed(2)),
    }))
    .sort((a, b) => b.totalNotional - a.totalNotional)
}

function formatMoney(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

export function DarkPoolMonitor() {
  const navigate = useNavigate()
  const [prints, setPrints] = useState(() => generatePrints(200))
  const [filter, setFilter] = useState('')
  const [minSize, setMinSize] = useState(0)

  const refresh = () => setPrints(generatePrints(200))

  const filtered = useMemo(() => {
    let result = prints
    if (filter) result = result.filter((p) => p.symbol.includes(filter.toUpperCase()))
    if (minSize > 0) result = result.filter((p) => p.size >= minSize)
    return result
  }, [prints, filter, minSize])

  const blocks = useMemo(() => aggregateBlocks(filtered), [filtered])

  const totalNotional = filtered.reduce((s, p) => s + p.notional, 0)
  const totalBuyNotional = filtered.filter((p) => p.side === 'buy').reduce((s, p) => s + p.notional, 0)
  const totalSellNotional = totalNotional - totalBuyNotional
  const blockPrints = filtered.filter((p) => p.size >= 10000)
  const avgPremium = filtered.length > 0 ? filtered.reduce((s, p) => s + p.premium, 0) / filtered.length : 0

  const chartData = blocks.slice(0, 10).map((b) => ({
    symbol: b.symbol,
    value: b.totalNotional / 1e6,
    side: b.netSide,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Eye className="h-5 w-5" />
          Dark Pool Monitor
        </h2>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Dark Pool Volume</p>
              <p className="text-lg font-bold">{formatMoney(totalNotional)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Buy Side</p>
              <p className="text-lg font-bold text-emerald-500">{formatMoney(totalBuyNotional)}</p>
              <p className="text-xs text-muted-foreground">{((totalBuyNotional / (totalNotional || 1)) * 100).toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <ArrowDownRight className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sell Side</p>
              <p className="text-lg font-bold text-red-500">{formatMoney(totalSellNotional)}</p>
              <p className="text-xs text-muted-foreground">{((totalSellNotional / (totalNotional || 1)) * 100).toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Block Trades (10K+)</p>
              <p className="text-lg font-bold">{blockPrints.length}</p>
              <p className="text-xs text-muted-foreground">Avg premium: {avgPremium >= 0 ? '+' : ''}{avgPremium.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Dark Pool Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Dark Pool Activity by Notional ($M)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="symbol" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v.toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${Number(v).toFixed(1)}M`, 'Notional']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.side === 'buy' ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Aggregated Blocks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Institutional Flow Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Symbol</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Notional</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Volume</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Prints</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Net Side</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Avg Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blocks.map((b) => (
                <tr key={b.symbol} className="cursor-pointer hover:bg-accent/30" onClick={() => navigate(`/quote?symbol=${b.symbol}`)}>
                  <td className="px-3 py-2 font-bold">{b.symbol}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(b.totalNotional)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{b.totalVolume.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{b.prints}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge className={`text-xs ${b.netSide === 'buy' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                      {b.netSide === 'buy' ? 'BUY' : 'SELL'}
                    </Badge>
                  </td>
                  <td className={`px-3 py-2 text-right font-medium ${b.avgPremium >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {b.avgPremium >= 0 ? '+' : ''}{b.avgPremium.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Filters + Tape */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter symbol..."
            className="h-8 w-32 pl-8 text-sm"
          />
        </div>
        <Button variant={minSize === 0 ? 'secondary' : 'ghost'} size="sm" className="h-8 text-xs" onClick={() => setMinSize(0)}>All</Button>
        <Button variant={minSize === 5000 ? 'secondary' : 'ghost'} size="sm" className="h-8 text-xs" onClick={() => setMinSize(5000)}>5K+</Button>
        <Button variant={minSize === 10000 ? 'secondary' : 'ghost'} size="sm" className="h-8 text-xs" onClick={() => setMinSize(10000)}>10K+</Button>
        <Button variant={minSize === 50000 ? 'secondary' : 'ghost'} size="sm" className="h-8 text-xs" onClick={() => setMinSize(50000)}>50K+</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Dark Pool Tape ({filtered.length} prints)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea style={{ height: '400px' }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Symbol</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Price</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Size</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Notional</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Side</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Venue</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.slice(0, 100).map((p) => (
                  <tr key={p.id} className="cursor-pointer hover:bg-accent/30" onClick={() => navigate(`/quote?symbol=${p.symbol}`)}>
                    <td className="px-3 py-1.5 text-muted-foreground">{p.time}</td>
                    <td className="px-3 py-1.5 font-bold">{p.symbol}</td>
                    <td className="px-3 py-1.5 text-right">${p.price.toFixed(2)}</td>
                    <td className={`px-3 py-1.5 text-right ${p.size >= 10000 ? 'font-bold text-yellow-500' : ''}`}>
                      {p.size.toLocaleString()}
                      {p.size >= 10000 && <Zap className="ml-1 inline h-3 w-3 text-yellow-500" />}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium">{formatMoney(p.notional)}</td>
                    <td className="px-3 py-1.5 text-center">
                      {p.side === 'buy' ? (
                        <TrendingUp className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="mx-auto h-3.5 w-3.5 text-red-500" />
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">{p.venue}</td>
                    <td className={`px-3 py-1.5 text-right ${p.premium >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {p.premium >= 0 ? '+' : ''}{p.premium.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
