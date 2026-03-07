import { useState } from 'react'
import { PriceChart } from '@/components/trading/PriceChart'
import { TechnicalPanel } from '@/components/trading/TechnicalPanel'
import { OrderPanel } from '@/components/trading/OrderPanel'
import { WatchlistPanel } from '@/components/trading/WatchlistPanel'
import { OrdersTable } from '@/components/trading/OrdersTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePortfolioContext } from '@/contexts/PortfolioContext'

export function Trade() {
  const { holdings } = usePortfolioContext()
  const [symbol, setSymbol] = useState('NVDA')
  const [inputSymbol, setInputSymbol] = useState('')

  const quickSymbols = [...new Set([...holdings.map((h) => h.symbol), 'SPY', 'QQQ'])].slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Symbol selector bar */}
      <div className="flex items-center gap-2">
        <Input
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputSymbol.trim()) {
              setSymbol(inputSymbol.trim())
              setInputSymbol('')
            }
          }}
          placeholder="Enter symbol..."
          className="h-8 w-36 text-sm"
        />
        <div className="flex gap-1 overflow-x-auto">
          {quickSymbols.map((s) => (
            <Button
              key={s}
              variant={symbol === s ? 'default' : 'ghost'}
              size="sm"
              className="h-7 shrink-0 px-2.5 text-xs"
              onClick={() => setSymbol(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <PriceChart symbol={symbol} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Open Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <OrdersTable />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <OrderPanel />
          <TechnicalPanel symbol={symbol} />
          <Card className="flex min-h-48 flex-1 flex-col">
            <CardContent className="flex-1 p-0">
              <WatchlistPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
