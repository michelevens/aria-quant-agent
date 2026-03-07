import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, SlidersHorizontal } from 'lucide-react'

const screenerResults = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 878.37, change: 2.14, pe: 72.3, mktCap: '2.16T', volume: '52.1M', sector: 'Technology' },
  { symbol: 'SMCI', name: 'Super Micro Computer', price: 924.12, change: 8.42, pe: 45.8, mktCap: '54.2B', volume: '18.4M', sector: 'Technology' },
  { symbol: 'ARM', name: 'Arm Holdings', price: 152.30, change: 3.21, pe: 312.5, mktCap: '159.8B', volume: '8.2M', sector: 'Technology' },
  { symbol: 'AVGO', name: 'Broadcom Inc', price: 1342.80, change: 1.85, pe: 38.2, mktCap: '625.4B', volume: '4.8M', sector: 'Technology' },
  { symbol: 'MRVL', name: 'Marvell Technology', price: 72.45, change: -1.23, pe: 62.1, mktCap: '62.8B', volume: '12.6M', sector: 'Technology' },
  { symbol: 'AMD', name: 'AMD Inc', price: 164.28, change: 2.13, pe: 248.9, mktCap: '265.7B', volume: '42.8M', sector: 'Technology' },
]

export function Screener() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Stock Screener</h2>
        <Badge variant="outline">{screenerResults.length} results</Badge>
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Filter symbols..." className="h-8 w-48 pl-8 text-sm" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="health">Healthcare</SelectItem>
                <SelectItem value="finance">Financials</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="large">
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Market Cap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mega">Mega Cap (&gt;200B)</SelectItem>
                <SelectItem value="large">Large Cap (&gt;10B)</SelectItem>
                <SelectItem value="mid">Mid Cap (2-10B)</SelectItem>
                <SelectItem value="small">Small Cap (&lt;2B)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-right text-xs">Price</TableHead>
                <TableHead className="text-right text-xs">% Change</TableHead>
                <TableHead className="text-right text-xs">P/E</TableHead>
                <TableHead className="text-right text-xs">Mkt Cap</TableHead>
                <TableHead className="text-right text-xs">Volume</TableHead>
                <TableHead className="text-xs">Sector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {screenerResults.map((s) => (
                <TableRow key={s.symbol} className="cursor-pointer hover:bg-accent/50">
                  <TableCell className="text-sm font-medium">{s.symbol}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.name}</TableCell>
                  <TableCell className="text-right text-sm">${s.price.toFixed(2)}</TableCell>
                  <TableCell
                    className={`text-right text-sm font-medium ${
                      s.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right text-sm">{s.pe}</TableCell>
                  <TableCell className="text-right text-sm">{s.mktCap}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{s.volume}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{s.sector}</Badge>
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
