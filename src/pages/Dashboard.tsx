import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PortfolioSummary } from '@/components/trading/PortfolioSummary'
import { PriceChart } from '@/components/trading/PriceChart'
import { TechnicalPanel } from '@/components/trading/TechnicalPanel'
import { PositionsTable } from '@/components/trading/PositionsTable'
import { OrdersTable } from '@/components/trading/OrdersTable'
import { NewsFeed } from '@/components/trading/NewsFeed'
import { Sparkline } from '@/components/trading/Sparkline'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { useTradingContext } from '@/contexts/TradingContext'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'

export function Dashboard() {
  const { holdings, totals } = usePortfolioContext()
  const { trades } = useTradingContext()

  const topMovers = [...holdings]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5)

  const recentTrades = [...trades]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <PortfolioSummary />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceChart symbol="NVDA" />
        </div>
        <TechnicalPanel symbol="NVDA" />
      </div>

      {/* Top Movers + Recent Trades Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Movers Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topMovers.map((h) => (
              <div key={h.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkline symbol={h.symbol} width={60} height={22} />
                  <div>
                    <span className="text-sm font-medium">{h.symbol}</span>
                    <p className="text-xs text-muted-foreground">${h.currentPrice.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {h.changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${h.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
            {topMovers.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No holdings yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${t.side === 'BUY' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {t.side}
                  </Badge>
                  <span className="text-sm font-medium">{t.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.quantity} @ ${t.price.toFixed(2)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {recentTrades.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No trades yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Mini Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Total Value" value={`$${totals.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
        <MiniStat label="Day P&L" value={`${totals.dayChange >= 0 ? '+' : ''}$${totals.dayChange.toFixed(2)}`} color={totals.dayChange >= 0 ? 'text-emerald-500' : 'text-red-500'} />
        <MiniStat label="Total Return" value={`${totals.totalGainPercent >= 0 ? '+' : ''}${totals.totalGainPercent.toFixed(2)}%`} color={totals.totalGainPercent >= 0 ? 'text-emerald-500' : 'text-red-500'} />
        <MiniStat label="Positions" value={`${totals.positionCount} (${totals.winners}W/${totals.losers}L)`} />
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

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${color ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
