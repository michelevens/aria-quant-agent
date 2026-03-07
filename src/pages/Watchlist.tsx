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
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { TrendingUp, TrendingDown, Plus, X, Loader2 } from 'lucide-react'

function formatNum(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

export function Watchlist() {
  const { watchlistQuotes, watchlistSymbols, addToWatchlist, removeFromWatchlist, loading } = usePortfolioContext()
  const [newSymbol, setNewSymbol] = useState('')

  const handleAdd = () => {
    const sym = newSymbol.trim().toUpperCase()
    if (sym) {
      addToWatchlist(sym)
      setNewSymbol('')
    }
  }

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
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlistQuotes.map((item) => (
                <TableRow key={item.symbol} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{item.symbol}</span>
                      {item.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm ${
                      item.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {item.change >= 0 ? '+' : ''}
                    {item.change.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm font-medium ${
                      item.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {item.changePercent >= 0 ? '+' : ''}
                    {item.changePercent.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.volume >= 1e6 ? `${(item.volume / 1e6).toFixed(1)}M` : item.volume.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.marketCap > 0 ? formatNum(item.marketCap) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.pe > 0 ? item.pe.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFromWatchlist(item.symbol)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {watchlistQuotes.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
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
