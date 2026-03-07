import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { fetchHistoricalData } from '@/services/marketData'
import { runBacktest } from '@/lib/strategies/backtest'
import type { BacktestResult } from '@/lib/strategies/backtest'
import { Loader2, Play, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react'

export function Backtest() {
  const [symbol, setSymbol] = useState('NVDA')
  const [capital, setCapital] = useState('100000')
  const [posSize, setPosSize] = useState('10')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BacktestResult | null>(null)

  const handleRun = async () => {
    setLoading(true)
    try {
      const bars = await fetchHistoricalData(symbol.toUpperCase(), '5Y')
      const res = runBacktest(symbol.toUpperCase(), bars, {
        initialCapital: parseFloat(capital) || 100000,
        positionSize: (parseFloat(posSize) || 10) / 100,
      })
      setResult(res)
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Strategy Backtester</h2>

      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="h-8 w-28 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Capital ($)</label>
              <Input
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="h-8 w-32 text-sm"
                type="number"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Position Size (%)</label>
              <Input
                value={posSize}
                onChange={(e) => setPosSize(e.target.value)}
                className="h-8 w-24 text-sm"
                type="number"
                min="1"
                max="100"
              />
            </div>
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleRun} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run Backtest
            </Button>
            <Badge variant="outline" className="text-xs">Multi-Factor Quant Strategy</Badge>
            <Badge variant="outline" className="text-xs">5Y Historical Data</Badge>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Running backtest on {symbol}... This may take a moment.</span>
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <>
          {/* Stats Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Total Return"
              value={`${result.totalReturnPct >= 0 ? '+' : ''}${result.totalReturnPct.toFixed(1)}%`}
              sub={`$${result.totalReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color={result.totalReturnPct >= 0 ? 'text-emerald-500' : 'text-red-500'}
            />
            <StatCard
              icon={<Target className="h-4 w-4" />}
              label="Win Rate"
              value={`${result.winRate.toFixed(1)}%`}
              sub={`${result.winners}W / ${result.losers}L`}
              color={result.winRate >= 50 ? 'text-emerald-500' : 'text-red-500'}
            />
            <StatCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="Max Drawdown"
              value={`-${result.maxDrawdown.toFixed(1)}%`}
              sub={`Sharpe: ${result.sharpe.toFixed(2)}`}
              color={result.maxDrawdown < 20 ? 'text-yellow-500' : 'text-red-500'}
            />
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="Profit Factor"
              value={result.profitFactor === Infinity ? 'N/A' : result.profitFactor.toFixed(2)}
              sub={`${result.totalTrades} trades`}
              color={result.profitFactor > 1 ? 'text-emerald-500' : 'text-red-500'}
            />
          </div>

          {/* Equity Curve */}
          {result.equityCurve.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Equity Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.equityCurve}>
                      <defs>
                        <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={result.totalReturn >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={result.totalReturn >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(0 0% 10%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '6px', fontSize: '12px' }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Equity']}
                      />
                      <ReferenceLine y={result.config.initialCapital} stroke="hsl(0 0% 30%)" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="equity" stroke={result.totalReturn >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2} fill="url(#btGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Stats */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <Row label="Initial Capital" value={`$${result.config.initialCapital.toLocaleString()}`} />
                <Row label="Final Equity" value={`$${(result.config.initialCapital + result.totalReturn).toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
                <Separator />
                <Row label="Avg Win" value={`$${result.avgWin.toFixed(0)}`} color="text-emerald-500" />
                <Row label="Avg Loss" value={`-$${result.avgLoss.toFixed(0)}`} color="text-red-500" />
                <Row label="Win/Loss Ratio" value={result.avgLoss > 0 ? (result.avgWin / result.avgLoss).toFixed(2) : 'N/A'} />
                <Separator />
                <Row label="Annualized Sharpe" value={result.sharpe.toFixed(2)} />
                <Row label="Max Drawdown" value={`-${result.maxDrawdown.toFixed(1)}%`} />
                <Row label="Profit Factor" value={result.profitFactor === Infinity ? 'N/A' : result.profitFactor.toFixed(2)} />
              </CardContent>
            </Card>

            {/* Trade History */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Trade History
                  <Badge variant="outline" className="ml-2 text-xs">{result.trades.length} trades</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 overflow-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Entry</TableHead>
                      <TableHead className="text-xs">Side</TableHead>
                      <TableHead className="text-right text-xs">Entry $</TableHead>
                      <TableHead className="text-right text-xs">Exit $</TableHead>
                      <TableHead className="text-right text-xs">P&L</TableHead>
                      <TableHead className="text-xs">Exit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.trades.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-muted-foreground">{t.entryDate}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold ${t.side === 'LONG' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {t.side}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">${t.entryPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs">${t.exitPrice.toFixed(2)}</TableCell>
                        <TableCell className={`text-right text-xs font-medium ${t.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {t.exitReason}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${color ?? ''}`}>{value}</span>
    </div>
  )
}
