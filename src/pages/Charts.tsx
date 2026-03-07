import { useState } from 'react'
import { PriceChart } from '@/components/trading/PriceChart'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X, LayoutGrid } from 'lucide-react'

export function Charts() {
  const { holdings } = usePortfolioContext()
  const [chartSymbols, setChartSymbols] = useState(() =>
    holdings.slice(0, 4).map((h) => h.symbol)
  )
  const [newSymbol, setNewSymbol] = useState('')

  const addChart = () => {
    const sym = newSymbol.trim().toUpperCase()
    if (sym && !chartSymbols.includes(sym)) {
      setChartSymbols([...chartSymbols, sym])
      setNewSymbol('')
    }
  }

  const removeChart = (symbol: string) => {
    setChartSymbols(chartSymbols.filter((s) => s !== symbol))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Charts</h2>
          <Badge variant="outline" className="text-xs">
            <LayoutGrid className="mr-1 h-3 w-3" />
            {chartSymbols.length} charts
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && addChart()}
            placeholder="Symbol..."
            className="h-8 w-28 text-sm"
          />
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={addChart} disabled={!newSymbol.trim()}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Quick Add - Portfolio Holdings */}
      <div className="flex flex-wrap gap-1">
        {holdings.map((h) => (
          <Button
            key={h.symbol}
            variant={chartSymbols.includes(h.symbol) ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 shrink-0 px-2.5 text-xs"
            onClick={() => {
              if (chartSymbols.includes(h.symbol)) {
                removeChart(h.symbol)
              } else {
                setChartSymbols([...chartSymbols, h.symbol])
              }
            }}
          >
            {h.symbol}
            {chartSymbols.includes(h.symbol) && (
              <span className={`ml-1 ${h.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(1)}%
              </span>
            )}
          </Button>
        ))}
        {/* Common symbols quick add */}
        {['SPY', 'QQQ', 'IWM', 'BTC-USD', 'GLD'].filter((s) => !holdings.some((h) => h.symbol === s)).map((sym) => (
          <Button
            key={sym}
            variant={chartSymbols.includes(sym) ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 shrink-0 px-2.5 text-xs"
            onClick={() => {
              if (chartSymbols.includes(sym)) {
                removeChart(sym)
              } else {
                setChartSymbols([...chartSymbols, sym])
              }
            }}
          >
            {sym}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {chartSymbols.map((symbol) => (
          <div key={symbol} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-6 w-6"
              onClick={() => removeChart(symbol)}
            >
              <X className="h-3 w-3" />
            </Button>
            <PriceChart symbol={symbol} />
          </div>
        ))}
        {chartSymbols.length === 0 && (
          <p className="col-span-2 py-12 text-center text-sm text-muted-foreground">
            Add symbols above to view charts
          </p>
        )}
      </div>
    </div>
  )
}
