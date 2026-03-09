import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowUpDown, Search, Filter, TrendingUp, TrendingDown,
  Zap, BarChart3, Activity, DollarSign, AlertTriangle, Eye,
} from 'lucide-react'

type FlowType = 'Call' | 'Put'
type Sentiment = 'Bullish' | 'Bearish' | 'Neutral'
type FlowSize = 'Normal' | 'Unusual' | 'Sweep' | 'Block'

interface OptionFlow {
  id: string
  time: string
  symbol: string
  expiry: string
  strike: number
  type: FlowType
  sentiment: Sentiment
  size: FlowSize
  premium: number
  volume: number
  openInterest: number
  iv: number
  delta: number
  underlyingPrice: number
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateFlows(): OptionFlow[] {
  const rand = seededRandom(20260307)
  const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'SPY', 'QQQ', 'AMD', 'NFLX', 'JPM', 'BA', 'DIS', 'COIN']
  const prices: Record<string, number> = {
    AAPL: 189.5, NVDA: 875.3, TSLA: 245.8, MSFT: 415.2, AMZN: 178.9,
    META: 502.1, GOOGL: 156.7, SPY: 512.4, QQQ: 438.6, AMD: 168.3,
    NFLX: 612.5, JPM: 198.4, BA: 187.2, DIS: 112.8, COIN: 234.5,
  }
  const sizes: FlowSize[] = ['Normal', 'Normal', 'Normal', 'Unusual', 'Unusual', 'Sweep', 'Block']
  const flows: OptionFlow[] = []

  for (let i = 0; i < 60; i++) {
    const sym = symbols[Math.floor(rand() * symbols.length)]
    const price = prices[sym]
    const isCall = rand() > 0.45
    const strikeOffset = (Math.floor(rand() * 20) - 8) * 5
    const strike = Math.round((price + strikeOffset) / 5) * 5
    const daysOut = Math.floor(rand() * 90) + 7
    const expDate = new Date(2026, 2, 7 + daysOut)
    const size = sizes[Math.floor(rand() * sizes.length)]
    const vol = size === 'Block' ? Math.floor(rand() * 5000) + 2000
      : size === 'Sweep' ? Math.floor(rand() * 3000) + 1000
      : size === 'Unusual' ? Math.floor(rand() * 2000) + 500
      : Math.floor(rand() * 500) + 50
    const prem = vol * (rand() * 8 + 0.5) * 100
    const iv = rand() * 60 + 20
    const delta = isCall ? rand() * 0.8 + 0.1 : -(rand() * 0.8 + 0.1)
    const oi = Math.floor(rand() * 20000) + 100

    let sentiment: Sentiment = 'Neutral'
    if (isCall && strike > price) sentiment = 'Bullish'
    else if (!isCall && strike < price) sentiment = 'Bearish'
    else if (isCall && strike <= price) sentiment = rand() > 0.5 ? 'Bullish' : 'Neutral'
    else sentiment = rand() > 0.5 ? 'Bearish' : 'Neutral'

    const hour = Math.floor(rand() * 7) + 9
    const min = Math.floor(rand() * 60)

    flows.push({
      id: `flow-${i}`,
      time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
      symbol: sym,
      expiry: `${expDate.getMonth() + 1}/${expDate.getDate()}/${expDate.getFullYear().toString().slice(2)}`,
      strike,
      type: isCall ? 'Call' : 'Put',
      sentiment,
      size,
      premium: prem,
      volume: vol,
      openInterest: oi,
      iv,
      delta,
      underlyingPrice: price,
    })
  }

  return flows.sort((a, b) => b.premium - a.premium)
}

type SortKey = 'time' | 'premium' | 'volume' | 'iv' | 'strike'

const sizeColors: Record<FlowSize, string> = {
  Normal: '#6b7280',
  Unusual: '#f59e0b',
  Sweep: '#ef4444',
  Block: '#8b5cf6',
}

const sentimentColors: Record<Sentiment, string> = {
  Bullish: '#4ade80',
  Bearish: '#f87171',
  Neutral: '#94a3b8',
}

function formatPremium(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export function OptionsFlow() {
  const navigate = useNavigate()
  const flows = useMemo(generateFlows, [])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('premium')
  const [sortAsc, setSortAsc] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'All' | FlowType>('All')
  const [sizeFilter, setSizeFilter] = useState<'All' | FlowSize>('All')
  const [sentimentFilter, setSentimentFilter] = useState<'All' | Sentiment>('All')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = flows
    .filter((f) => {
      if (search && !f.symbol.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== 'All' && f.type !== typeFilter) return false
      if (sizeFilter !== 'All' && f.size !== sizeFilter) return false
      if (sentimentFilter !== 'All' && f.sentiment !== sentimentFilter) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === 'time') return a.time.localeCompare(b.time) * dir
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir
    })

  // Stats
  const totalPremium = flows.reduce((s, f) => s + f.premium, 0)
  const callPremium = flows.filter((f) => f.type === 'Call').reduce((s, f) => s + f.premium, 0)
  const putPremium = flows.filter((f) => f.type === 'Put').reduce((s, f) => s + f.premium, 0)
  const pcRatio = putPremium > 0 ? callPremium / putPremium : 0
  const unusualCount = flows.filter((f) => f.size !== 'Normal').length
  const sweepCount = flows.filter((f) => f.size === 'Sweep').length
  const avgIV = flows.reduce((s, f) => s + f.iv, 0) / flows.length

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button className="flex items-center gap-1 text-xs" onClick={() => handleSort(field)}>
      {label}
      {sortKey === field && <ArrowUpDown className="h-3 w-3" />}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Options Flow</h2>
          <p className="text-sm text-muted-foreground">Real-time unusual options activity and smart money tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="Filter symbol..." className="h-8 w-36 pl-8 text-sm" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Premium</p>
                <p className="text-sm font-bold">{formatPremium(totalPremium)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Call/Put Ratio</p>
                <p className={`text-sm font-bold ${pcRatio > 1 ? 'text-emerald-500' : 'text-red-500'}`}>{pcRatio.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Call Premium</p>
                <p className="text-sm font-bold text-emerald-500">{formatPremium(callPremium)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Put Premium</p>
                <p className="text-sm font-bold text-red-500">{formatPremium(putPremium)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: '#f59e0b' }} />
              <div>
                <p className="text-xs text-muted-foreground">Unusual Activity</p>
                <p className="text-sm font-bold">{unusualCount} / {sweepCount} sweeps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Avg IV</p>
                <p className="text-sm font-bold">{avgIV.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Type:</span>
        {(['All', 'Call', 'Put'] as const).map((t) => (
          <Badge key={t} variant={typeFilter === t ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setTypeFilter(t)}>
            {t}
          </Badge>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">Size:</span>
        {(['All', 'Unusual', 'Sweep', 'Block'] as const).map((s) => (
          <Badge
            key={s}
            variant={sizeFilter === s ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            style={s !== 'All' ? { borderColor: sizeColors[s], color: sizeFilter === s ? '#fff' : sizeColors[s] } : undefined}
            onClick={() => setSizeFilter(s)}
          >
            {s}
          </Badge>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">Sentiment:</span>
        {(['All', 'Bullish', 'Bearish', 'Neutral'] as const).map((s) => (
          <Badge
            key={s}
            variant={sentimentFilter === s ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            style={s !== 'All' ? { borderColor: sentimentColors[s], color: sentimentFilter === s ? '#fff' : sentimentColors[s] } : undefined}
            onClick={() => setSentimentFilter(s)}
          >
            {s}
          </Badge>
        ))}
      </div>

      {/* Flow Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs"><SortHeader label="Time" field="time" /></TableHead>
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="hidden text-xs sm:table-cell">Expiry</TableHead>
                <TableHead className="text-right"><SortHeader label="Strike" field="strike" /></TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="hidden text-xs sm:table-cell">Size</TableHead>
                <TableHead className="text-xs">Sentiment</TableHead>
                <TableHead className="text-right"><SortHeader label="Premium" field="premium" /></TableHead>
                <TableHead className="hidden text-right md:table-cell"><SortHeader label="Volume" field="volume" /></TableHead>
                <TableHead className="hidden text-right md:table-cell">OI</TableHead>
                <TableHead className="hidden text-right lg:table-cell"><SortHeader label="IV" field="iv" /></TableHead>
                <TableHead className="hidden text-right lg:table-cell">Delta</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 40).map((f) => (
                <TableRow key={f.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/quote?symbol=${f.symbol}`)}>
                  <TableCell className="text-xs text-muted-foreground">{f.time}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{f.symbol}</span>
                    <span className="ml-1 text-xs text-muted-foreground">${f.underlyingPrice.toFixed(0)}</span>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{f.expiry}</TableCell>
                  <TableCell className="text-right text-sm">${f.strike}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs" style={{ color: f.type === 'Call' ? '#4ade80' : '#f87171', borderColor: f.type === 'Call' ? '#4ade80' : '#f87171' }}>
                      {f.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {f.size !== 'Normal' ? (
                      <Badge variant="outline" className="text-xs" style={{ color: sizeColors[f.size], borderColor: sizeColors[f.size] }}>
                        {f.size === 'Sweep' && <Zap className="mr-0.5 inline h-3 w-3" />}
                        {f.size}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Normal</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium" style={{ color: sentimentColors[f.sentiment] }}>
                      {f.sentiment === 'Bullish' && <TrendingUp className="mr-0.5 inline h-3 w-3" />}
                      {f.sentiment === 'Bearish' && <TrendingDown className="mr-0.5 inline h-3 w-3" />}
                      {f.sentiment}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatPremium(f.premium)}</TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground md:table-cell">{f.volume.toLocaleString()}</TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground md:table-cell">{f.openInterest.toLocaleString()}</TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground lg:table-cell">{f.iv.toFixed(1)}%</TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground lg:table-cell">{f.delta.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="View details" onClick={(e) => { e.stopPropagation(); navigate(`/quote?symbol=${f.symbol}`) }}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground" style={{ opacity: 0.6 }}>
        Options flow data is simulated for demonstration purposes. Not financial advice.
      </p>
    </div>
  )
}
