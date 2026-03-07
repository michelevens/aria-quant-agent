import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RECENT_ORDERS } from '@/data/mockData'

const statusColors: Record<string, string> = {
  FILLED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  PARTIAL: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export function OrdersTable() {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {RECENT_ORDERS.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="text-xs text-muted-foreground">
                {order.time}
              </TableCell>
              <TableCell className="text-xs font-mono">{order.id}</TableCell>
              <TableCell className="text-sm font-medium">{order.symbol}</TableCell>
              <TableCell>
                <span
                  className={`text-xs font-semibold ${
                    order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {order.side}
                </span>
              </TableCell>
              <TableCell className="text-xs">{order.type}</TableCell>
              <TableCell className="text-right text-sm">{order.quantity}</TableCell>
              <TableCell className="text-right text-sm">
                ${order.price.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[order.status] ?? ''}`}
                >
                  {order.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
