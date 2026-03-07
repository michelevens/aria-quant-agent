import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  TrendingUp, TrendingDown, Search, ArrowUpDown, Star, Loader2,
  Coins, DollarSign, Activity, Flame, Zap,
} from 'lucide-react'
import { fetchMultipleQuotes } from '@/services/marketData'
import type { Quote } from '@/types/market'

const CRYPTO_SYMBOLS = [
  'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD',
  'ADA-USD', 'DOGE-USD', 'AVAX-USD', 'DOT-USD', 'MATIC-USD',
  'LINK-USD', 'UNI-USD', 'ATOM-USD', 'LTC-USD', 'NEAR-USD',
  'APT-USD', 'FIL-USD', 'ARB-USD', 'OP-USD', 'AAVE-USD',
]

const DISPLAY_NAMES: Record<string, { name: string; category: string }> = {
  'BTC-USD': { name: 'Bitcoin', category: 'Layer 1' },
  'ETH-USD': { name: 'Ethereum', category: 'Layer 1' },
  'BNB-USD': { name: 'BNB', category: 'Layer 1' },
  'SOL-USD': { name: 'Solana', category: 'Layer 1' },
  'XRP-USD': { name: 'XRP', category: 'Payment' },
  'ADA-USD': { name: 'Cardano', category: 'Layer 1' },
  'DOGE-USD': { name: 'Dogecoin', category: 'Meme' },
  'AVAX-USD': { name: 'Avalanche', category: 'Layer 1' },
  'DOT-USD': { name: 'Polkadot', category: 'Layer 0' },
  'MATIC-USD': { name: 'Polygon', category: 'Layer 2' },
  'LINK-USD': { name: 'Chainlink', category: 'Oracle' },
  'UNI-USD': { name: 'Uniswap', category: 'DeFi' },
  'ATOM-USD': { name: 'Cosmos', category: 'Layer 0' },
  'LTC-USD': { name: 'Litecoin', category: 'Payment' },
  'NEAR-USD': { name: 'NEAR Protocol', category: 'Layer 1' },
  'APT-USD': { name: 'Aptos', category: 'Layer 1' },
  'FIL-USD': { name: 'Filecoin', category: 'Storage' },
  'ARB-USD': { name: 'Arbitrum', category: 'Layer 2' },
  'OP-USD': { name: 'Optimism', category: 'Layer 2' },
  'AAVE-USD': { name: 'Aave', category: 'DeFi' },
}

const categoryColors: Record<string, string> = {
  'Layer 1': '#3b82f6',
  'Layer 2': '#8b5cf6',
  'Layer 0': '#06b6d4',
  'DeFi': '#22c55e',
  'Payment': '#f59e0b',
  'Oracle': '#6366f1',
  'Meme': '#ec4899',
  'Storage': '#14b8a6',
}

type SortKey = 'rank' | 'price' | 'change' | 'volume'

function formatPrice(v: number): string {
  if (v >= 1000) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (v >= 1) return `$${v.toFixed(2)}`
  return `$${v.toFixed(4)}`
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

export function CryptoDashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortAsc, setSortAsc] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('aria-crypto-favorites')
      return saved ? new Set(JSON.parse(saved)) : new Set(['BTC-USD', 'ETH-USD', 'SOL-USD'])
    } catch { return new Set(['BTC-USD', 'ETH-USD', 'SOL-USD']) }
  })
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [showFavOnly, setShowFavOnly] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchMultipleQuotes(CRYPTO_SYMBOLS)
        if (!cancelled) setQuotes(data)
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  useEffect(() => {
    localStorage.setItem('aria-crypto-favorites', JSON.stringify([...favorites]))
  }, [favorites])

  const toggleFav = (symbol: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(key === 'rank') }
  }

  // Build rows for all symbols
  const quotesMap = new Map(quotes.map((q) => [q.symbol, q]))
  const allRows = CRYPTO_SYMBOLS.map((sym, i) => {
    const q = quotesMap.get(sym)
    const info = DISPLAY_NAMES[sym] ?? { name: sym.replace('-USD', ''), category: 'Other' }
    return {
      rank: i + 1,
      symbol: sym,
      ticker: sym.replace('-USD', ''),
      name: info.name,
      category: info.category,
      price: q?.price ?? 0,
      change: q?.change ?? 0,
      changePercent: q?.changePercent ?? 0,
      volume: q?.volume ?? 0,
      high: q?.high ?? 0,
      low: q?.low ?? 0,
      hasData: !!q,
    }
  })

  const categories = ['All', ...new Set(Object.values(DISPLAY_NAMES).map((d) => d.category))]

  const filtered = allRows
    .filter((r) => {
      if (search) {
        const s = search.toLowerCase()
        if (!r.name.toLowerCase().includes(s) && !r.ticker.toLowerCase().includes(s)) return false
      }
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false
      if (showFavOnly && !favorites.has(r.symbol)) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === 'change') return (a.changePercent - b.changePercent) * dir
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir
    })

  const totalVolume = allRows.reduce((s, r) => s + r.volume, 0)
  const gainers = allRows.filter((r) => r.changePercent > 0).length
  const losers = allRows.filter((r) => r.changePercent < 0).length
  const btc = quotesMap.get('BTC-USD')
  const eth = quotesMap.get('ETH-USD')

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
          <h2 className="text-lg font-bold">Crypto Dashboard</h2>
          <p className="text-sm text-muted-foreground">Live cryptocurrency prices and market data</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crypto..." className="h-8 w-44 pl-8 text-sm" />
          </div>
        </div>
      </div>

      {/* Hero cards: BTC & ETH */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {btc && (
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(247,147,26,0.15)' }}>
                    <Coins className="h-4 w-4" style={{ color: '#f7931a' }} />
                  </div>
                  <span className="text-sm font-semibold">Bitcoin</span>
                </div>
                <Badge variant="outline" className="text-xs">BTC</Badge>
              </div>
              <p className="text-2xl font-bold">{formatPrice(btc.price)}</p>
              <div className="flex items-center gap-1">
                {btc.changePercent >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={`text-sm font-medium ${btc.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {btc.changePercent >= 0 ? '+' : ''}{btc.changePercent.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}
        {eth && (
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(98,126,234,0.15)' }}>
                    <Coins className="h-4 w-4" style={{ color: '#627eea' }} />
                  </div>
                  <span className="text-sm font-semibold">Ethereum</span>
                </div>
                <Badge variant="outline" className="text-xs">ETH</Badge>
              </div>
              <p className="text-2xl font-bold">{formatPrice(eth.price)}</p>
              <div className="flex items-center gap-1">
                {eth.changePercent >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={`text-sm font-medium ${eth.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {eth.changePercent >= 0 ? '+' : ''}{eth.changePercent.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(74,222,128,0.12)' }}>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">24h Volume</p>
              <p className="text-lg font-bold">{formatVolume(totalVolume)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Market Mood</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-500">{gainers} <Flame className="inline h-3 w-3" /></span>
                <span className="text-sm font-bold text-red-500">{losers} <Zap className="inline h-3 w-3" /></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <Badge
            key={c}
            variant={categoryFilter === c ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            style={c !== 'All' && categoryFilter === c ? { backgroundColor: categoryColors[c], borderColor: categoryColors[c] } : c !== 'All' ? { borderColor: categoryColors[c], color: categoryColors[c] } : undefined}
            onClick={() => setCategoryFilter(c)}
          >
            {c}
          </Badge>
        ))}
        <Button
          variant={showFavOnly ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-7 gap-1 text-xs"
          onClick={() => setShowFavOnly(!showFavOnly)}
        >
          <Star className="h-3 w-3" style={showFavOnly ? { fill: '#fbbf24', color: '#fbbf24' } : undefined} />
          Favorites
        </Button>
      </div>

      {/* Crypto Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-10"><SortHeader label="#" field="rank" /></TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="hidden text-xs sm:table-cell">Category</TableHead>
                <TableHead className="text-right"><SortHeader label="Price" field="price" /></TableHead>
                <TableHead className="text-right"><SortHeader label="24h %" field="change" /></TableHead>
                <TableHead className="hidden text-right sm:table-cell">24h High</TableHead>
                <TableHead className="hidden text-right sm:table-cell">24h Low</TableHead>
                <TableHead className="hidden text-right md:table-cell"><SortHeader label="Volume" field="volume" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.symbol} className="hover:bg-accent/50">
                  <TableCell>
                    <button onClick={() => toggleFav(r.symbol)}>
                      <Star
                        className="h-3.5 w-3.5"
                        style={favorites.has(r.symbol) ? { color: '#fbbf24', fill: '#fbbf24' } : { color: '#4b5563' }}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.rank}</TableCell>
                  <TableCell>
                    <div>
                      <span className="text-sm font-medium">{r.ticker}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs" style={{ color: categoryColors[r.category], borderColor: categoryColors[r.category] }}>
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {r.hasData ? formatPrice(r.price) : '—'}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-medium ${r.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {r.hasData ? `${r.changePercent >= 0 ? '+' : ''}${r.changePercent.toFixed(2)}%` : '—'}
                  </TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground sm:table-cell">
                    {r.hasData ? formatPrice(r.high) : '—'}
                  </TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground sm:table-cell">
                    {r.hasData ? formatPrice(r.low) : '—'}
                  </TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground md:table-cell">
                    {r.hasData ? formatVolume(r.volume) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No cryptocurrencies match your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
