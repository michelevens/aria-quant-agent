import { PriceChart } from '@/components/trading/PriceChart'
import { OrderPanel } from '@/components/trading/OrderPanel'
import { WatchlistPanel } from '@/components/trading/WatchlistPanel'
import { OrdersTable } from '@/components/trading/OrdersTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Trade() {
  return (
    <div className="grid h-full gap-4 lg:grid-cols-4">
      <div className="flex flex-col gap-4 lg:col-span-3">
        <PriceChart symbol="NVDA" />
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
        <Card className="flex min-h-64 flex-1 flex-col">
          <CardContent className="flex-1 p-0">
            <WatchlistPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
