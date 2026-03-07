import { useState, useEffect } from 'react'
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
import type { Quote } from '@/types/market'
import { Search, Loader2, RefreshCw } from 'lucide-react'

const SCREENER_LISTS: Record<string, string[]> = {
  'mega-tech': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AVGO', 'ORCL', 'CRM'],
  'ai-plays': ['NVDA', 'AMD', 'SMCI', 'ARM', 'PLTR', 'SNOW', 'AI', 'PATH', 'DDOG', 'MDB'],
  'fintech': ['SQ', 'PYPL', 'COIN', 'SOFI', 'HOOD', 'AFRM', 'NU', 'UPST', 'MARA', 'RIOT'],
  'healthcare': ['UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY'],
  'ev-energy': ['TSLA', 'RIVN', 'LCID', 'NIO', 'ENPH', 'FSLR', 'PLUG', 'CHPT', 'QS', 'BLNK'],
  'value': ['BRK-B', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA'],
}

function formatMktCap(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  return v.toLocaleString()
}

export function Screener() {
  const [list, setList] = useState('mega-tech')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = (key: string) => {
    setLoading(true)
    fetchMultipleQuotes(SCREENER_LISTS[key] ?? [])
      .then(setQuotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(list) }, [list])

  const filtered = filter
    ? quotes.filter((q) => q.symbol.includes(filter.toUpperCase()) || q.name.toLowerCase().includes(filter.toLowerCase()))
    : quotes

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Stock Screener</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filtered.length} results</Badge>
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
              </SelectContent>
            </Select>
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
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-right text-xs">Price</TableHead>
                <TableHead className="text-right text-xs">Change</TableHead>
                <TableHead className="text-right text-xs">% Change</TableHead>
                <TableHead className="text-right text-xs">Volume</TableHead>
                <TableHead className="text-right text-xs">Mkt Cap</TableHead>
                <TableHead className="text-right text-xs">P/E</TableHead>
                <TableHead className="text-right text-xs">52W High</TableHead>
                <TableHead className="text-right text-xs">52W Low</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.symbol} className="cursor-pointer hover:bg-accent/50">
                  <TableCell className="text-sm font-medium">{q.symbol}</TableCell>
                  <TableCell className="max-w-40 truncate text-sm text-muted-foreground">{q.name}</TableCell>
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
                  <TableCell className="text-right text-sm">${q.fiftyTwoWeekHigh.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm">${q.fiftyTwoWeekLow.toFixed(2)}</TableCell>
                </TableRow>
              ))}
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
