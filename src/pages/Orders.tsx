import { Card, CardContent } from '@/components/ui/card'
import { OrdersTable } from '@/components/trading/OrdersTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Orders() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Orders</h2>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="text-xs">All Orders</TabsTrigger>
          <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
          <TabsTrigger value="filled" className="text-xs">Filled</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <OrdersTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="open">
          <Card>
            <CardContent className="p-0">
              <OrdersTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="filled">
          <Card>
            <CardContent className="p-0">
              <OrdersTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cancelled">
          <Card>
            <CardContent className="p-0">
              <OrdersTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
