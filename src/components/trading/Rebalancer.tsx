import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine,
} from 'recharts'
import { Scale, ArrowRight } from 'lucide-react'

type Strategy = 'equal' | 'market-cap' | 'min-variance' | 'momentum'

interface RebalanceAction {
  symbol: string
  currentWeight: number
  targetWeight: number
  action: 'BUY' | 'SELL' | 'HOLD'
  shares: number
  value: number
}

export function Rebalancer() {
  const { holdings, totals } = usePortfolioContext()
  const [strategy, setStrategy] = useState<Strategy>('equal')

  const actions: RebalanceAction[] = useMemo(() => {
    if (holdings.length === 0) return []

    const totalValue = totals.totalMarketValue

    // Calculate target weights based on strategy
    const targets = new Map<string, number>()

    if (strategy === 'equal') {
      const equalWeight = 100 / holdings.length
      holdings.forEach((h) => targets.set(h.symbol, equalWeight))
    } else if (strategy === 'market-cap') {
      const totalMktCap = holdings.reduce((s, h) => s + h.marketCap, 0)
      if (totalMktCap > 0) {
        holdings.forEach((h) => targets.set(h.symbol, (h.marketCap / totalMktCap) * 100))
      } else {
        const equalWeight = 100 / holdings.length
        holdings.forEach((h) => targets.set(h.symbol, equalWeight))
      }
    } else if (strategy === 'min-variance') {
      // Simple inverse-volatility proxy: use day change % as vol proxy
      const vols = holdings.map((h) => Math.max(Math.abs(h.changePercent), 0.1))
      const invVols = vols.map((v) => 1 / v)
      const totalInvVol = invVols.reduce((s, v) => s + v, 0)
      holdings.forEach((h, i) => targets.set(h.symbol, (invVols[i] / totalInvVol) * 100))
    } else if (strategy === 'momentum') {
      // Weight by positive performance, underweight negative
      const returns = holdings.map((h) => h.totalGainPercent)
      const positiveReturns = returns.map((r) => Math.max(r + 10, 1)) // shift so all positive
      const totalPos = positiveReturns.reduce((s, r) => s + r, 0)
      holdings.forEach((h, i) => targets.set(h.symbol, (positiveReturns[i] / totalPos) * 100))
    }

    return holdings.map((h) => {
      const currentWeight = h.weight
      const targetWeight = targets.get(h.symbol) ?? currentWeight
      const weightDiff = targetWeight - currentWeight
      const valueDiff = (weightDiff / 100) * totalValue
      const shares = h.currentPrice > 0 ? Math.round(valueDiff / h.currentPrice) : 0

      return {
        symbol: h.symbol,
        currentWeight,
        targetWeight,
        action: shares > 0 ? 'BUY' as const : shares < 0 ? 'SELL' as const : 'HOLD' as const,
        shares: Math.abs(shares),
        value: Math.abs(valueDiff),
      }
    }).sort((a, b) => Math.abs(b.targetWeight - b.currentWeight) - Math.abs(a.targetWeight - a.currentWeight))
  }, [holdings, totals, strategy])

  const strategyLabels: Record<Strategy, string> = {
    equal: 'Equal Weight',
    'market-cap': 'Market-Cap Weighted',
    'min-variance': 'Min Variance (Risk Parity)',
    momentum: 'Momentum Tilt',
  }

  const totalBuys = actions.filter((a) => a.action === 'BUY').reduce((s, a) => s + a.value, 0)
  const totalSells = actions.filter((a) => a.action === 'SELL').reduce((s, a) => s + a.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Scale className="h-4 w-4" />
            Portfolio Rebalancer
          </CardTitle>
          <Select value={strategy} onValueChange={(v: string | null) => { if (v) setStrategy(v as Strategy) }}>
            <SelectTrigger className="h-7 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equal">Equal Weight</SelectItem>
              <SelectItem value="market-cap">Market-Cap Weighted</SelectItem>
              <SelectItem value="min-variance">Min Variance</SelectItem>
              <SelectItem value="momentum">Momentum Tilt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Strategy: {strategyLabels[strategy]}
        </p>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Add holdings to see rebalancing suggestions</p>
        ) : (
          <>
            <div className="mb-3 flex gap-3 text-xs">
              <Badge variant="outline" className="text-emerald-500">Buy: ${totalBuys.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Badge>
              <Badge variant="outline" className="text-red-500">Sell: ${totalSells.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Badge>
            </div>

            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Symbol</TableHead>
                    <TableHead className="text-right text-xs">Current %</TableHead>
                    <TableHead className="text-center text-xs"></TableHead>
                    <TableHead className="text-right text-xs">Target %</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-right text-xs">Shares</TableHead>
                    <TableHead className="text-right text-xs">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((a) => (
                    <TableRow key={a.symbol}>
                      <TableCell className="text-sm font-medium">{a.symbol}</TableCell>
                      <TableCell className="text-right text-sm">{a.currentWeight.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <ArrowRight className="mx-auto h-3 w-3 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{a.targetWeight.toFixed(1)}%</TableCell>
                      <TableCell>
                        {a.action !== 'HOLD' ? (
                          <Badge className={`text-xs ${a.action === 'BUY' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                            {a.action}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">HOLD</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{a.shares > 0 ? a.shares : '-'}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {a.value > 1 ? `$${a.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Drift Chart */}
            {actions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Weight Drift (Current vs Target)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={actions.map((a) => ({
                    symbol: a.symbol,
                    drift: parseFloat((a.currentWeight - a.targetWeight).toFixed(1)),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="symbol" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Drift']}
                    />
                    <ReferenceLine y={0} stroke="var(--border)" />
                    <Bar dataKey="drift" radius={[4, 4, 0, 0]}>
                      {actions.map((a, i) => (
                        <Cell key={i} fill={a.currentWeight > a.targetWeight ? '#ef4444' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <Button size="sm" className="text-xs" disabled>
                Execute Rebalance (Coming Soon)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
