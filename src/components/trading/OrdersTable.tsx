import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTradingContext } from '@/contexts/TradingContext'
import type { OrderStatus } from '@/hooks/useTradingEngine'
import { X } from 'lucide-react'

const statusColors: Record<OrderStatus, string> = {
  FILLED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  OPEN: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  PARTIAL: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export function OrdersTable({ filter }: { filter?: OrderStatus }) {
  const { orders, cancelOrder } = useTradingContext()

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {filter ? `No ${filter.toLowerCase()} orders` : 'No orders yet. Place an order from the Trade page.'}
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Time</TableHead>
            <TableHead className="text-xs">Order ID</TableHead>
            <TableHead className="text-xs">Symbol</TableHead>
            <TableHead className="text-xs">Side</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-right text-xs">Qty</TableHead>
            <TableHead className="text-right text-xs">Price</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.slice(0, 50).map((order) => (
            <TableRow key={order.id}>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleTimeString('en-US', { hour12: false })}
              </TableCell>
              <TableCell className="text-xs font-mono">{order.id.slice(0, 12)}</TableCell>
              <TableCell className="text-sm font-medium">{order.symbol}</TableCell>
              <TableCell>
                <span className={`text-xs font-semibold ${order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {order.side}
                </span>
              </TableCell>
              <TableCell className="text-xs">{order.type}</TableCell>
              <TableCell className="text-right text-sm">{order.quantity}</TableCell>
              <TableCell className="text-right text-sm">
                {order.filledPrice > 0
                  ? `$${order.filledPrice.toFixed(2)}`
                  : order.limitPrice
                  ? `$${order.limitPrice.toFixed(2)}`
                  : 'MKT'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${statusColors[order.status] ?? ''}`}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                {order.status === 'OPEN' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => cancelOrder(order.id)}
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
