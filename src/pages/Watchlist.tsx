import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { WATCHLIST } from '@/data/mockData'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function Watchlist() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Watchlist</h2>
        <Badge variant="outline">{WATCHLIST.length} symbols</Badge>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-right text-xs">Price</TableHead>
                <TableHead className="text-right text-xs">Change</TableHead>
                <TableHead className="text-right text-xs">% Change</TableHead>
                <TableHead className="text-right text-xs">Volume</TableHead>
                <TableHead className="text-right text-xs">High</TableHead>
                <TableHead className="text-right text-xs">Low</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {WATCHLIST.map((item) => (
                <TableRow key={item.symbol} className="cursor-pointer hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{item.symbol}</span>
                      {item.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm ${
                      item.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {item.change >= 0 ? '+' : ''}
                    {item.change.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm font-medium ${
                      item.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {item.changePercent >= 0 ? '+' : ''}
                    {item.changePercent.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.volume}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    ${item.high.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    ${item.low.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
