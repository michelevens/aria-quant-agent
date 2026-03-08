import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { UserCheck, TrendingUp, TrendingDown, DollarSign, Search, Filter } from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface InsiderTrade {
  id: number
  symbol: string
  company: string
  insider: string
  title: string
  type: 'Buy' | 'Sell'
  shares: number
  price: number
  value: number
  date: string
  filingDate: string
  ownershipChange: number
}

const COMPANIES = [
  { symbol: 'NVDA', company: 'NVIDIA Corp', insiders: ['Jensen Huang', 'Colette Kress', 'Debora Shoquist'], titles: ['CEO', 'CFO', 'EVP Operations'] },
  { symbol: 'AAPL', company: 'Apple Inc', insiders: ['Tim Cook', 'Luca Maestri', 'Jeff Williams'], titles: ['CEO', 'CFO', 'COO'] },
  { symbol: 'MSFT', company: 'Microsoft Corp', insiders: ['Satya Nadella', 'Amy Hood', 'Brad Smith'], titles: ['CEO', 'CFO', 'President'] },
  { symbol: 'GOOGL', company: 'Alphabet Inc', insiders: ['Sundar Pichai', 'Ruth Porat', 'Prabhakar Raghavan'], titles: ['CEO', 'CFO', 'SVP'] },
  { symbol: 'AMZN', company: 'Amazon.com Inc', insiders: ['Andy Jassy', 'Brian Olsavsky', 'Adam Selipsky'], titles: ['CEO', 'CFO', 'CEO AWS'] },
  { symbol: 'META', company: 'Meta Platforms', insiders: ['Mark Zuckerberg', 'Susan Li', 'Andrew Bosworth'], titles: ['CEO', 'CFO', 'CTO'] },
  { symbol: 'TSLA', company: 'Tesla Inc', insiders: ['Elon Musk', 'Vaibhav Taneja', 'Drew Baglino'], titles: ['CEO', 'CFO', 'SVP Powertrain'] },
  { symbol: 'JPM', company: 'JPMorgan Chase', insiders: ['Jamie Dimon', 'Jeremy Barnum', 'Daniel Pinto'], titles: ['CEO', 'CFO', 'President'] },
  { symbol: 'AMD', company: 'AMD Inc', insiders: ['Lisa Su', 'Jean Hu', 'Mark Papermaster'], titles: ['CEO', 'CFO', 'CTO'] },
  { symbol: 'CRM', company: 'Salesforce Inc', insiders: ['Marc Benioff', 'Amy Weaver', 'Bret Taylor'], titles: ['CEO', 'CFO', 'Co-CEO'] },
]

function generateTrades(): InsiderTrade[] {
  const rand = seededRandom(777)
  const trades: InsiderTrade[] = []

  for (let i = 0; i < 80; i++) {
    const co = COMPANIES[Math.floor(rand() * COMPANIES.length)]
    const insiderIdx = Math.floor(rand() * co.insiders.length)
    const isBuy = rand() > 0.65 // 35% buys (insider buys are rarer)
    const shares = Math.round((1000 + rand() * 50000) / 100) * 100
    const priceBase = co.symbol === 'NVDA' ? 120 : co.symbol === 'AAPL' ? 185 : co.symbol === 'MSFT' ? 415
      : co.symbol === 'GOOGL' ? 165 : co.symbol === 'AMZN' ? 185 : co.symbol === 'META' ? 510
      : co.symbol === 'TSLA' ? 260 : co.symbol === 'JPM' ? 195 : co.symbol === 'AMD' ? 155 : 280
    const price = priceBase * (0.9 + rand() * 0.2)
    const daysAgo = Math.floor(rand() * 90)
    const dt = new Date(Date.now() - daysAgo * 86400000)
    const filingDt = new Date(dt.getTime() + Math.floor(rand() * 3) * 86400000)

    trades.push({
      id: i,
      symbol: co.symbol,
      company: co.company,
      insider: co.insiders[insiderIdx],
      title: co.titles[insiderIdx],
      type: isBuy ? 'Buy' : 'Sell',
      shares,
      price: Math.round(price * 100) / 100,
      value: Math.round(shares * price),
      date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      filingDate: filingDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ownershipChange: isBuy ? Math.round(rand() * 15 * 10) / 10 : -Math.round(rand() * 20 * 10) / 10,
    })
  }

  return trades.sort((a, b) => b.id - a.id)
}

type FilterType = 'all' | 'buy' | 'sell'

export function InsiderTrades() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const allTrades = useMemo(() => generateTrades(), [])

  const filtered = useMemo(() => {
    let list = allTrades
    if (filter === 'buy') list = list.filter((t) => t.type === 'Buy')
    if (filter === 'sell') list = list.filter((t) => t.type === 'Sell')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.symbol.toLowerCase().includes(q) || t.insider.toLowerCase().includes(q) || t.company.toLowerCase().includes(q))
    }
    return list
  }, [allTrades, filter, search])

  const totalBuyValue = allTrades.filter((t) => t.type === 'Buy').reduce((s, t) => s + t.value, 0)
  const totalSellValue = allTrades.filter((t) => t.type === 'Sell').reduce((s, t) => s + t.value, 0)
  const buyCount = allTrades.filter((t) => t.type === 'Buy').length
  const sellCount = allTrades.filter((t) => t.type === 'Sell').length

  // Aggregate by symbol
  const bySymbol = useMemo(() => {
    const map = new Map<string, { symbol: string; buyVal: number; sellVal: number }>()
    for (const t of allTrades) {
      const entry = map.get(t.symbol) ?? { symbol: t.symbol, buyVal: 0, sellVal: 0 }
      if (t.type === 'Buy') entry.buyVal += t.value
      else entry.sellVal += t.value
      map.set(t.symbol, entry)
    }
    return [...map.values()].sort((a, b) => (b.buyVal + b.sellVal) - (a.buyVal + a.sellVal)).slice(0, 10)
  }, [allTrades])

  // Net buy/sell by symbol for chart
  const netChart = useMemo(() =>
    bySymbol.map((s) => ({
      symbol: s.symbol,
      net: Math.round((s.buyVal - s.sellVal) / 1000),
    })),
    [bySymbol],
  )

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <UserCheck className="h-5 w-5" />
        Insider Trades Monitor
      </h2>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Insider Buys</p>
              <p className="text-lg font-bold text-emerald-500">{buyCount}</p>
              <p className="text-xs text-muted-foreground">${(totalBuyValue / 1e6).toFixed(1)}M total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Insider Sells</p>
              <p className="text-lg font-bold text-red-500">{sellCount}</p>
              <p className="text-xs text-muted-foreground">${(totalSellValue / 1e6).toFixed(1)}M total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <DollarSign className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Activity</p>
              <p className={`text-lg font-bold ${totalBuyValue > totalSellValue ? 'text-emerald-500' : 'text-red-500'}`}>
                ${(Math.abs(totalBuyValue - totalSellValue) / 1e6).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground">{totalBuyValue > totalSellValue ? 'Net buying' : 'Net selling'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Buy/Sell Ratio</p>
              <p className="text-lg font-bold">{sellCount > 0 ? (buyCount / sellCount).toFixed(2) : '---'}</p>
              <p className="text-xs text-muted-foreground">{buyCount + sellCount} total trades</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Insider Flow Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Net Insider Flow by Symbol ($K)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={netChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="symbol" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${Number(v).toLocaleString()}K`, 'Net']}
              />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {netChart.map((d, i) => (
                  <Cell key={i} fill={d.net >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters + Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm">Recent Filings</CardTitle>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-7 w-40 pl-7 text-xs"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'buy', 'sell'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs capitalize"
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="text-xs">Insider</TableHead>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-right text-xs">Shares</TableHead>
                <TableHead className="text-right text-xs">Price</TableHead>
                <TableHead className="text-right text-xs">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 40).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="text-sm font-medium">{t.symbol}</TableCell>
                  <TableCell className="text-sm">{t.insider}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.title}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${t.type === 'Buy' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{t.shares.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">${t.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    ${t.value >= 1e6 ? `${(t.value / 1e6).toFixed(1)}M` : `${(t.value / 1e3).toFixed(0)}K`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No trades match your filters</p>
          )}
          {filtered.length > 40 && (
            <p className="py-2 text-center text-xs text-muted-foreground">Showing 40 of {filtered.length} trades</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
