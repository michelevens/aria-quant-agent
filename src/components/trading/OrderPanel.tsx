import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function OrderPanel() {
  const [symbol, setSymbol] = useState('NVDA')
  const [quantity, setQuantity] = useState('100')
  const [limitPrice, setLimitPrice] = useState('875.00')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Order Entry</CardTitle>
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

          <TabsContent value="buy" className="space-y-3">
            <OrderForm
              side="buy"
              symbol={symbol}
              setSymbol={setSymbol}
              quantity={quantity}
              setQuantity={setQuantity}
              limitPrice={limitPrice}
              setLimitPrice={setLimitPrice}
            />
          </TabsContent>
          <TabsContent value="sell" className="space-y-3">
            <OrderForm
              side="sell"
              symbol={symbol}
              setSymbol={setSymbol}
              quantity={quantity}
              setQuantity={setQuantity}
              limitPrice={limitPrice}
              setLimitPrice={setLimitPrice}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function OrderForm({
  side,
  symbol,
  setSymbol,
  quantity,
  setQuantity,
  limitPrice,
  setLimitPrice,
}: {
  side: 'buy' | 'sell'
  symbol: string
  setSymbol: (v: string) => void
  quantity: string
  setQuantity: (v: string) => void
  limitPrice: string
  setLimitPrice: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
        <Input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Order Type</label>
        <Select defaultValue="limit">
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="market">Market</SelectItem>
            <SelectItem value="limit">Limit</SelectItem>
            <SelectItem value="stop">Stop</SelectItem>
            <SelectItem value="stop-limit">Stop Limit</SelectItem>
            <SelectItem value="trailing-stop">Trailing Stop</SelectItem>
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
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Limit Price</label>
          <Input
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="h-8 text-sm"
            type="number"
            step="0.01"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Time in Force</label>
        <Select defaultValue="day">
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="gtc">Good Till Cancelled</SelectItem>
            <SelectItem value="ioc">Immediate or Cancel</SelectItem>
            <SelectItem value="fok">Fill or Kill</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md bg-accent/50 p-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Total</span>
          <span className="font-medium">
            ${(parseFloat(quantity || '0') * parseFloat(limitPrice || '0')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Commission</span>
          <span className="font-medium text-emerald-500">$0.00</span>
        </div>
      </div>

      <Button
        className={`w-full text-sm font-semibold ${
          side === 'buy'
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
      </Button>
    </div>
  )
}
