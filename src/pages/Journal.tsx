import { TradeJournal } from '@/components/trading/TradeJournal'
import { Button } from '@/components/ui/button'
import { useTradingContext } from '@/contexts/TradingContext'
import { exportToCSV } from '@/lib/csv'
import { Download } from 'lucide-react'

export function Journal() {
  const { trades } = useTradingContext()

  const handleExport = () => {
    if (trades.length === 0) return
    exportToCSV(
      trades.map((t) => ({
        Date: new Date(t.timestamp).toISOString(),
        Symbol: t.symbol,
        Side: t.side,
        Quantity: t.quantity,
        Price: t.price.toFixed(2),
        Total: t.total.toFixed(2),
        OrderId: t.orderId,
      })),
      `aria-trades-${new Date().toISOString().slice(0, 10)}`
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Trade Journal</h2>
        {trades.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        )}
      </div>
      <TradeJournal />
    </div>
  )
}
