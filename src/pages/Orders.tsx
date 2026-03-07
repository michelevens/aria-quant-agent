import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrdersTable } from '@/components/trading/OrdersTable'
import { useTradingContext } from '@/contexts/TradingContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2 } from 'lucide-react'

export function Orders() {
  const { totalTrades, totalVolume, openOrders, filledOrders, clearHistory } = useTradingContext()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Orders</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{totalTrades} trades</Badge>
          <Badge variant="outline" className="text-xs">${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })} volume</Badge>
          {totalTrades > 0 && (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-red-500" onClick={clearHistory}>
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{openOrders.length}</p>
            <p className="text-xs text-muted-foreground">Open Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-emerald-500">{filledOrders.length}</p>
            <p className="text-xs text-muted-foreground">Filled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{totalTrades}</p>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="text-xs">All Orders</TabsTrigger>
          <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
          <TabsTrigger value="filled" className="text-xs">Filled</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card><CardContent className="p-0"><OrdersTable /></CardContent></Card>
        </TabsContent>
        <TabsContent value="open">
          <Card><CardContent className="p-0"><OrdersTable filter="OPEN" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="filled">
          <Card><CardContent className="p-0"><OrdersTable filter="FILLED" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="cancelled">
          <Card><CardContent className="p-0"><OrdersTable filter="CANCELLED" /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
