import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortfolioSummary } from '@/components/trading/PortfolioSummary'
import { PriceChart } from '@/components/trading/PriceChart'
import { TechnicalPanel } from '@/components/trading/TechnicalPanel'
import { PositionsTable } from '@/components/trading/PositionsTable'
import { OrdersTable } from '@/components/trading/OrdersTable'
import { NewsFeed } from '@/components/trading/NewsFeed'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Dashboard() {
  return (
    <div className="space-y-4">
      <PortfolioSummary />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceChart symbol="NVDA" />
        </div>
        <TechnicalPanel symbol="NVDA" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="positions">
            <TabsList>
              <TabsTrigger value="positions" className="text-xs">Positions</TabsTrigger>
              <TabsTrigger value="orders" className="text-xs">Recent Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="positions">
              <Card>
                <CardContent className="p-0">
                  <PositionsTable />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="orders">
              <Card>
                <CardContent className="p-0">
                  <OrdersTable />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Market News</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <NewsFeed />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
