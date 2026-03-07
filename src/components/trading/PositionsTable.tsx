import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { POSITIONS } from '@/data/mockData'

export function PositionsTable() {
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Symbol</TableHead>
            <TableHead className="text-xs">Qty</TableHead>
            <TableHead className="text-right text-xs">Avg Cost</TableHead>
            <TableHead className="text-right text-xs">Price</TableHead>
            <TableHead className="text-right text-xs">Change</TableHead>
            <TableHead className="text-right text-xs">Mkt Value</TableHead>
            <TableHead className="text-right text-xs">Total G/L</TableHead>
            <TableHead className="text-right text-xs">G/L %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {POSITIONS.map((p) => (
            <TableRow key={p.symbol} className="cursor-pointer hover:bg-accent/50">
              <TableCell>
                <div>
                  <span className="text-sm font-medium">{p.symbol}</span>
                  <p className="text-xs text-muted-foreground">{p.name}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{p.quantity}</TableCell>
              <TableCell className="text-right text-sm">
                ${p.avgCost.toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                ${p.currentPrice.toFixed(2)}
              </TableCell>
              <TableCell
                className={`text-right text-sm ${
                  p.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {p.change >= 0 ? '+' : ''}
                {p.change.toFixed(2)} ({p.changePercent >= 0 ? '+' : ''}
                {p.changePercent.toFixed(2)}%)
              </TableCell>
              <TableCell className="text-right text-sm">
                ${p.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell
                className={`text-right text-sm font-medium ${
                  p.totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {p.totalGain >= 0 ? '+' : ''}$
                {Math.abs(p.totalGain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell
                className={`text-right text-sm ${
                  p.totalGainPercent >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {p.totalGainPercent >= 0 ? '+' : ''}
                {p.totalGainPercent.toFixed(2)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
