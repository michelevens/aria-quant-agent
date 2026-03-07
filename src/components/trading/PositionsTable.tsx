import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { Loader2 } from 'lucide-react'

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toString()
}

export function PositionsTable() {
  const { holdings, loading } = usePortfolioContext()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Symbol</TableHead>
            <TableHead className="text-xs">Qty</TableHead>
            <TableHead className="text-right text-xs">Avg Cost</TableHead>
            <TableHead className="text-right text-xs">Price</TableHead>
            <TableHead className="text-right text-xs">Day Chg</TableHead>
            <TableHead className="text-right text-xs">Mkt Value</TableHead>
            <TableHead className="text-right text-xs">Total G/L</TableHead>
            <TableHead className="text-right text-xs">Weight</TableHead>
            <TableHead className="text-right text-xs">Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((p) => (
            <TableRow key={p.symbol} className="cursor-pointer hover:bg-accent/50">
              <TableCell>
                <div>
                  <span className="text-sm font-medium">{p.symbol}</span>
                  <p className="max-w-32 truncate text-xs text-muted-foreground">{p.name}</p>
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
                {p.totalGain >= 0 ? '+' : '-'}$
                {Math.abs(p.totalGain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="ml-1 text-xs">
                  ({p.totalGainPercent >= 0 ? '+' : ''}{p.totalGainPercent.toFixed(1)}%)
                </span>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {p.weight.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatVolume(p.volume)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
