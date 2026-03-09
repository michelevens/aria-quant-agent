import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
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
import { Search, Loader2, RefreshCw, ArrowUpDown, TrendingUp, TrendingDown, Filter } from 'lucide-react'

const SCREENER_LISTS: Record<string, string[]> = {
  'mega-tech': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AVGO', 'ORCL', 'CRM'],
  'ai-plays': ['NVDA', 'AMD', 'SMCI', 'ARM', 'PLTR', 'SNOW', 'AI', 'PATH', 'DDOG', 'MDB'],
  'fintech': ['SQ', 'PYPL', 'COIN', 'SOFI', 'HOOD', 'AFRM', 'NU', 'UPST', 'MARA', 'RIOT'],
  'healthcare': ['UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY'],
  'ev-energy': ['TSLA', 'RIVN', 'LCID', 'NIO', 'ENPH', 'FSLR', 'PLUG', 'CHPT', 'QS', 'BLNK'],
  'value': ['BRK-B', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA'],
  'dividend': ['JNJ', 'KO', 'PG', 'PEP', 'VZ', 'T', 'XOM', 'CVX', 'MO', 'IBM'],
  'momentum': ['NVDA', 'META', 'AMZN', 'NFLX', 'AVGO', 'LLY', 'CRM', 'NOW', 'PANW', 'UBER'],
}

function formatMktCap(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  return v.toLocaleString()
}

type SortKey = 'symbol' | 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap' | 'pe'
type FilterMode = 'all' | 'gainers' | 'losers'

export function Screener() {
  const navigate = useNavigate()
  const [list, setList] = useState('mega-tech')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('changePercent')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const load = (key: string) => {
    setLoading(true)
    fetchMultipleQuotes(SCREENER_LISTS[key] ?? [])
      .then(setQuotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(list) }, [list])

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
        <h2 className="text-lg font-bold">Stock Screener</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{filtered.length} results</Badge>
          <Badge className="bg-emerald-600 text-xs">{gainers} up</Badge>
          <Badge className="bg-red-600 text-xs">{losers} down</Badge>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter symbols..."
                className="h-8 w-48 pl-8 text-sm"
              />
            </div>
            <Select value={list} onValueChange={(v: string | null) => { if (v) setList(v) }}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mega-tech">Mega Cap Tech</SelectItem>
                <SelectItem value="ai-plays">AI / ML Plays</SelectItem>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="ev-energy">EV / Clean Energy</SelectItem>
                <SelectItem value="value">Value / Financials</SelectItem>
                <SelectItem value="dividend">Dividend Kings</SelectItem>
                <SelectItem value="momentum">Momentum</SelectItem>
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
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => load(list)}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
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
                <TableHead className="text-right"><SortHeader label="Mkt Cap" field="marketCap" align="right" /></TableHead>
                <TableHead className="text-right"><SortHeader label="P/E" field="pe" align="right" /></TableHead>
                <TableHead className="text-xs">52W Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => {
                const range52 = q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow
                const pctInRange = range52 > 0 ? ((q.price - q.fiftyTwoWeekLow) / range52) * 100 : 50

                return (
                  <TableRow key={q.symbol} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/quote?symbol=${q.symbol}`)}>
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
                    <TableCell className="max-w-40 truncate text-sm text-muted-foreground">{q.name}</TableCell>
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
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {q.pe > 0 ? q.pe.toFixed(1) : '—'}
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
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    No results found
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
