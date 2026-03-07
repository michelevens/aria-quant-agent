import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTradingContext } from '@/contexts/TradingContext'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import type { OrderSide, OrderType, TimeInForce } from '@/hooks/useTradingEngine'
import { CheckCircle2 } from 'lucide-react'

export function OrderPanel({ defaultSymbol = 'NVDA' }: { defaultSymbol?: string }) {
  const [symbol, setSymbol] = useState(defaultSymbol)
  const [quantity, setQuantity] = useState('100')
  const [limitPrice, setLimitPrice] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('MARKET')
  const [tif, setTif] = useState<TimeInForce>('DAY')
  const [lastOrder, setLastOrder] = useState<string | null>(null)
  const [trailAmount, setTrailAmount] = useState('')
  const [bracketTP, setBracketTP] = useState('')
  const [bracketSL, setBracketSL] = useState('')

  const { placeOrder } = useTradingContext()
  const { holdings, totals } = usePortfolioContext()

  const holding = holdings.find((h) => h.symbol === symbol.toUpperCase())
  const currentPrice = holding?.currentPrice ?? 0

  const estTotal = orderType === 'MARKET'
    ? currentPrice * parseFloat(quantity || '0')
    : parseFloat(limitPrice || '0') * parseFloat(quantity || '0')

  const handleSubmit = (side: OrderSide) => {
    const qty = parseInt(quantity)
    if (!symbol || qty <= 0) return

    const order = placeOrder({
      symbol: symbol.toUpperCase(),
      side,
      type: orderType,
      quantity: qty,
      limitPrice: orderType !== 'MARKET' && orderType !== 'TRAILING_STOP' && orderType !== 'BRACKET' ? parseFloat(limitPrice) : undefined,
      trailAmount: orderType === 'TRAILING_STOP' ? parseFloat(trailAmount) : undefined,
      bracketTakeProfit: orderType === 'BRACKET' ? parseFloat(bracketTP) : undefined,
      bracketStopLoss: orderType === 'BRACKET' ? parseFloat(bracketSL) : undefined,
      tif,
      currentPrice,
    })

    setLastOrder(`${order.status === 'FILLED' ? 'Filled' : 'Placed'}: ${side} ${qty} ${symbol.toUpperCase()} @ $${order.filledPrice > 0 ? order.filledPrice.toFixed(2) : (limitPrice || 'MKT')}`)
    setTimeout(() => setLastOrder(null), 3000)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Order Entry</CardTitle>
          <Badge variant="outline" className="text-xs">Paper Trading</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy">
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="buy" className="flex-1 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              BUY
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex-1 text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
              SELL
            </TabsTrigger>
          </TabsList>

          {(['buy', 'sell'] as const).map((side) => (
            <TabsContent key={side} value={side} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="h-8 text-sm"
                />
              </div>
              {currentPrice > 0 && (
                <div className="text-xs text-muted-foreground">
                  Last: <span className="font-medium text-foreground">${currentPrice.toFixed(2)}</span>
                  {holding && (
                    <span className="ml-2">Held: {holding.quantity} shares</span>
                  )}
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Order Type</label>
                <Select value={orderType} onValueChange={(v: string | null) => { if (v) setOrderType(v as OrderType) }}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKET">Market</SelectItem>
                    <SelectItem value="LIMIT">Limit</SelectItem>
                    <SelectItem value="STOP">Stop</SelectItem>
                    <SelectItem value="STOP_LIMIT">Stop Limit</SelectItem>
                    <SelectItem value="TRAILING_STOP">Trailing Stop</SelectItem>
                    <SelectItem value="BRACKET">Bracket</SelectItem>
                    <SelectItem value="OCO">OCO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Quantity</label>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-8 text-sm"
                    type="number"
                    min="1"
                  />
                </div>
                {(orderType === 'LIMIT' || orderType === 'STOP' || orderType === 'STOP_LIMIT' || orderType === 'OCO') && (
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {orderType === 'STOP' ? 'Stop Price' : 'Limit Price'}
                    </label>
                    <Input
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      className="h-8 text-sm"
                      type="number"
                      step="0.01"
                      placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : '0.00'}
                    />
                  </div>
                )}
              </div>
              {orderType === 'TRAILING_STOP' && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Trail Amount ($)</label>
                  <Input
                    value={trailAmount}
                    onChange={(e) => setTrailAmount(e.target.value)}
                    className="h-8 text-sm"
                    type="number"
                    step="0.50"
                    placeholder="2.00"
                  />
                </div>
              )}
              {orderType === 'BRACKET' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Take Profit</label>
                    <Input
                      value={bracketTP}
                      onChange={(e) => setBracketTP(e.target.value)}
                      className="h-8 text-sm"
                      type="number"
                      step="0.01"
                      placeholder={currentPrice > 0 ? (currentPrice * 1.05).toFixed(2) : '0.00'}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Stop Loss</label>
                    <Input
                      value={bracketSL}
                      onChange={(e) => setBracketSL(e.target.value)}
                      className="h-8 text-sm"
                      type="number"
                      step="0.01"
                      placeholder={currentPrice > 0 ? (currentPrice * 0.95).toFixed(2) : '0.00'}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Time in Force</label>
                <Select value={tif} onValueChange={(v: string | null) => { if (v) setTif(v as TimeInForce) }}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Day</SelectItem>
                    <SelectItem value="GTC">Good Till Cancelled</SelectItem>
                    <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                    <SelectItem value="FOK">Fill or Kill</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md bg-accent/50 p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Total</span>
                  <span className="font-medium">${estTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buying Power</span>
                  <span className="font-medium">${totals.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="font-medium text-emerald-500">$0.00</span>
                </div>
              </div>

              {lastOrder && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {lastOrder}
                </div>
              )}

              <Button
                className={`w-full text-sm font-semibold ${
                  side === 'buy'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={() => handleSubmit(side === 'buy' ? 'BUY' : 'SELL')}
              >
                {side === 'buy' ? 'Buy' : 'Sell'} {symbol.toUpperCase()}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
