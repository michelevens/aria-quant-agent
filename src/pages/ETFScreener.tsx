import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchMultipleQuotes } from '@/services/marketData'
import { Sparkline } from '@/components/trading/Sparkline'
import type { Quote } from '@/types/market'
import {
  Search, Loader2, RefreshCw, ArrowUpDown, TrendingUp, TrendingDown, Filter, Layers,
} from 'lucide-react'

const ETF_CATEGORIES: Record<string, { label: string; symbols: string[] }> = {
  'broad-market': {
    label: 'Broad Market',
    symbols: ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'IVV', 'RSP', 'MDY', 'IJR'],
  },
  'sector': {
    label: 'Sector',
    symbols: ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLP', 'XLU', 'XLRE', 'XLC', 'XLY', 'XLB'],
  },
  'bonds': {
    label: 'Bonds & Fixed Income',
    symbols: ['BND', 'AGG', 'TLT', 'IEF', 'SHY', 'LQD', 'HYG', 'TIP', 'VCIT', 'VCSH'],
  },
  'international': {
    label: 'International',
    symbols: ['VEA', 'EFA', 'VWO', 'EEM', 'IEMG', 'IXUS', 'VXUS', 'FXI', 'EWJ', 'EWZ'],
  },
  'commodity': {
    label: 'Commodities',
    symbols: ['GLD', 'SLV', 'IAU', 'USO', 'UNG', 'DBA', 'DBC', 'PDBC', 'COPX', 'WEAT'],
  },
  'thematic': {
    label: 'Thematic & Innovation',
    symbols: ['ARKK', 'ARKW', 'ARKG', 'BOTZ', 'ROBO', 'LIT', 'ICLN', 'TAN', 'HACK', 'SKYY'],
  },
  'dividend': {
    label: 'Dividend & Income',
    symbols: ['VYM', 'SCHD', 'DVY', 'HDV', 'SPHD', 'NOBL', 'SDY', 'DGRO', 'DGRW', 'VIG'],
  },
  'leveraged': {
    label: 'Leveraged & Inverse',
    symbols: ['TQQQ', 'SQQQ', 'SPXL', 'SPXS', 'UPRO', 'SDS', 'QLD', 'SOXL', 'SOXS', 'UVXY'],
  },
  'growth-value': {
    label: 'Growth vs Value',
    symbols: ['VUG', 'VTV', 'IWF', 'IWD', 'SPYG', 'SPYV', 'IUSG', 'IUSV', 'MGK', 'RPV'],
  },
  'real-estate': {
    label: 'Real Estate',
    symbols: ['VNQ', 'VNQI', 'IYR', 'XLRE', 'RWR', 'SCHH', 'REM', 'MORT', 'REET', 'ICF'],
  },
}

function formatMktCap(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  return v.toLocaleString()
}

type SortKey = 'symbol' | 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap'
type FilterMode = 'all' | 'gainers' | 'losers'

export function ETFScreener() {
  const [category, setCategory] = useState('broad-market')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('changePercent')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const load = (key: string) => {
    setLoading(true)
    fetchMultipleQuotes(ETF_CATEGORIES[key]?.symbols ?? [])
      .then(setQuotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(category) }, [category])

  const filtered = useMemo(() => {
    let result = quotes
    if (filter) {
      result = result.filter((q) =>
        q.symbol.includes(filter.toUpperCase()) || q.name.toLowerCase().includes(filter.toLowerCase())
      )
    }
    if (filterMode === 'gainers') result = result.filter((q) => q.changePercent > 0)
    if (filterMode === 'losers') result = result.filter((q) => q.changePercent < 0)

    return [...result].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol) * dir
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir
    })
  }, [quotes, filter, sortKey, sortAsc, filterMode])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const gainers = quotes.filter((q) => q.changePercent > 0).length
  const losers = quotes.filter((q) => q.changePercent < 0).length
  const avgChange = quotes.length > 0
    ? quotes.reduce((s, q) => s + q.changePercent, 0) / quotes.length
    : 0

  const SortHeader = ({ label, field, align }: { label: string; field: SortKey; align?: string }) => (
    <button
      className={`flex items-center gap-1 text-xs ${align === 'right' ? 'ml-auto' : ''}`}
      onClick={() => handleSort(field)}
    >
      {label}
      {sortKey === field && <ArrowUpDown className="h-3 w-3" />}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Layers className="h-5 w-5" />
          ETF Screener
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{filtered.length} ETFs</Badge>
          <Badge className="bg-emerald-600 text-xs">{gainers} up</Badge>
          <Badge className="bg-red-600 text-xs">{losers} down</Badge>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Category average performance */}
      {!loading && quotes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="py-2 px-4">
              <p className="text-xs text-muted-foreground">Avg Change</p>
              <p className={`text-lg font-bold ${avgChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2 px-4">
              <p className="text-xs text-muted-foreground">Best Performer</p>
              {(() => {
                const best = [...quotes].sort((a, b) => b.changePercent - a.changePercent)[0]
                return best ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{best.symbol}</span>
                    <span className="text-sm font-medium text-emerald-500">
                      +{best.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ) : null
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2 px-4">
              <p className="text-xs text-muted-foreground">Worst Performer</p>
              {(() => {
                const worst = [...quotes].sort((a, b) => a.changePercent - b.changePercent)[0]
                return worst ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{worst.symbol}</span>
                    <span className="text-sm font-medium text-red-500">
                      {worst.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ) : null
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2 px-4">
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="text-lg font-bold">
                {(() => {
                  const total = quotes.reduce((s, q) => s + q.volume, 0)
                  if (total >= 1e9) return `${(total / 1e9).toFixed(1)}B`
                  if (total >= 1e6) return `${(total / 1e6).toFixed(0)}M`
                  return total.toLocaleString()
                })()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter ETFs..."
                className="h-8 w-48 pl-8 text-sm"
              />
            </div>
            <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
              <SelectTrigger className="h-8 w-52 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ETF_CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {(['all', 'gainers', 'losers'] as FilterMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={filterMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setFilterMode(mode)}
                >
                  {mode === 'all' && <Filter className="mr-1 h-3 w-3" />}
                  {mode === 'gainers' && <TrendingUp className="mr-1 h-3 w-3" />}
                  {mode === 'losers' && <TrendingDown className="mr-1 h-3 w-3" />}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => load(category)}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {ETF_CATEGORIES[category]?.label ?? 'ETFs'}
            <Badge variant="outline" className="ml-2 text-xs">{filtered.length} funds</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Symbol" field="symbol" /></TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">5D</TableHead>
                <TableHead className="text-right"><SortHeader label="Price" field="price" align="right" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Change" field="change" align="right" /></TableHead>
                <TableHead className="text-right"><SortHeader label="% Chg" field="changePercent" align="right" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Volume" field="volume" align="right" /></TableHead>
                <TableHead className="text-right"><SortHeader label="AUM" field="marketCap" align="right" /></TableHead>
                <TableHead className="text-xs">52W Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => {
                const range52 = q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow
                const pctInRange = range52 > 0 ? ((q.price - q.fiftyTwoWeekLow) / range52) * 100 : 50

                return (
                  <TableRow key={q.symbol} className="cursor-pointer hover:bg-accent/50">
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{q.symbol}</span>
                        {q.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{q.name}</TableCell>
                    <TableCell>
                      <Sparkline symbol={q.symbol} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">${q.price.toFixed(2)}</TableCell>
                    <TableCell
                      className={`text-right text-sm ${q.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-medium ${q.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {q.volume >= 1e6 ? `${(q.volume / 1e6).toFixed(1)}M` : q.volume.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {q.marketCap > 0 ? formatMktCap(q.marketCap) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">${q.fiftyTwoWeekLow.toFixed(0)}</span>
                        <div className="relative h-1.5 w-16 rounded-full bg-accent">
                          <div
                            className="absolute top-0 h-1.5 rounded-full bg-primary"
                            style={{ width: `${Math.min(100, Math.max(0, pctInRange))}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">${q.fiftyTwoWeekHigh.toFixed(0)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No ETFs found
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
