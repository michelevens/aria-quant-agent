import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNavigate } from 'react-router-dom'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { Sparkline } from '@/components/trading/Sparkline'
import { TrendingUp, TrendingDown, Plus, X, Loader2, ArrowUpDown } from 'lucide-react'

function formatNum(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

type SortKey = 'symbol' | 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap'

export function Watchlist() {
  const navigate = useNavigate()
  const { watchlistQuotes, watchlistSymbols, addToWatchlist, removeFromWatchlist, loading } = usePortfolioContext()
  const [newSymbol, setNewSymbol] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('symbol')
  const [sortAsc, setSortAsc] = useState(true)

  const handleAdd = () => {
    const sym = newSymbol.trim().toUpperCase()
    if (sym) {
      addToWatchlist(sym)
      setNewSymbol('')
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  // Build rows for ALL watchlist symbols, using quote data when available
  const quotesMap = new Map(watchlistQuotes.map((q) => [q.symbol, q]))
  const allRows = watchlistSymbols.map((sym) => {
    const q = quotesMap.get(sym)
    return {
      symbol: sym,
      name: q?.name ?? '',
      price: q?.price ?? 0,
      change: q?.change ?? 0,
      changePercent: q?.changePercent ?? 0,
      volume: q?.volume ?? 0,
      marketCap: q?.marketCap ?? 0,
      pe: q?.pe ?? 0,
      hasData: !!q,
    }
  })

  const sorted = [...allRows].sort((a, b) => {
    const dir = sortAsc ? 1 : -1
    if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol) * dir
    return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir
  })

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button className="flex items-center gap-1 text-xs" onClick={() => handleSort(field)}>
      {label}
      {sortKey === field && <ArrowUpDown className="h-3 w-3" />}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Watchlist</h2>
          <Badge variant="outline">{watchlistSymbols.length} symbols</Badge>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex gap-2">
          <Input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add symbol..."
            className="h-8 w-32 text-sm"
          />
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Symbol" field="symbol" /></TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">5D</TableHead>
                <TableHead className="text-right"><SortHeader label="Price" field="price" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Change" field="change" /></TableHead>
                <TableHead className="text-right"><SortHeader label="% Chg" field="changePercent" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Volume" field="volume" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Mkt Cap" field="marketCap" /></TableHead>
                <TableHead className="text-right text-xs">P/E</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => (
                <TableRow key={item.symbol} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/quote?symbol=${item.symbol}`)}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{item.symbol}</span>
                      {item.hasData ? (
                        item.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )
                      ) : loading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                    {item.hasData ? item.name : (loading ? '' : 'No data')}
                  </TableCell>
                  <TableCell>{item.hasData && <Sparkline symbol={item.symbol} />}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {item.hasData ? `$${item.price.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className={`text-right text-sm ${item.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.hasData ? `${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-medium ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.hasData ? `${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.hasData ? (item.volume >= 1e6 ? `${(item.volume / 1e6).toFixed(1)}M` : item.volume.toLocaleString()) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.marketCap > 0 ? formatNum(item.marketCap) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.pe > 0 ? item.pe.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromWatchlist(item.symbol)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {watchlistSymbols.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    Add symbols to your watchlist to track them
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
