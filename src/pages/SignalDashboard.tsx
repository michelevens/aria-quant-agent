import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchHistoricalData } from '@/services/marketData'
import { generateSignal } from '@/lib/strategies/signals'
import type { Signal } from '@/types/market'
import {
  Zap, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw,
  Target, ShieldCheck, ArrowUpDown, BarChart3,
} from 'lucide-react'

interface SignalRow {
  symbol: string
  signal: Signal
}

function strengthColor(strength: number): string {
  if (strength >= 65) return 'text-emerald-500'
  if (strength <= 35) return 'text-red-500'
  return 'text-muted-foreground'
}

function strengthBg(strength: number): string {
  if (strength >= 65) return 'bg-emerald-500'
  if (strength <= 35) return 'bg-red-500'
  return 'bg-muted-foreground'
}

function typeColor(type: Signal['type']): string {
  if (type === 'BUY') return 'bg-emerald-600'
  if (type === 'SELL') return 'bg-red-600'
  return 'bg-muted-foreground'
}

type SortField = 'symbol' | 'type' | 'strength' | 'price' | 'riskReward'

export function SignalDashboard() {
  const navigate = useNavigate()
  const { holdings, watchlistQuotes } = usePortfolioContext()
  const [signals, setSignals] = useState<SignalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<SignalRow | null>(null)
  const [sortField, setSortField] = useState<SortField>('strength')
  const [sortAsc, setSortAsc] = useState(false)

  const allSymbols = useMemo(() => {
    const set = new Set<string>()
    holdings.forEach((h) => set.add(h.symbol))
    watchlistQuotes.forEach((q) => set.add(q.symbol))
    return Array.from(set)
  }, [holdings, watchlistQuotes])

  const loadSignals = async () => {
    setLoading(true)
    const results: SignalRow[] = []

    // Process in batches of 3 to avoid rate limits
    for (let i = 0; i < allSymbols.length; i += 3) {
      const batch = allSymbols.slice(i, i + 3)
      const batchResults = await Promise.all(
        batch.map(async (sym) => {
          try {
            const bars = await fetchHistoricalData(sym, '1Y')
            const signal = generateSignal(sym, bars)
            return { symbol: sym, signal }
          } catch {
            return null
          }
        })
      )
      results.push(...batchResults.filter((r): r is SignalRow => r !== null))

      if (i + 3 < allSymbols.length) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    setSignals(results)
    setLoading(false)
    if (results.length > 0 && !selectedSignal) {
      setSelectedSignal(results[0])
    }
  }

  useEffect(() => { loadSignals() }, [allSymbols.join(',')])

  const sorted = useMemo(() => {
    return [...signals].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortField === 'symbol') return a.symbol.localeCompare(b.symbol) * dir
      if (sortField === 'type') return a.signal.type.localeCompare(b.signal.type) * dir
      if (sortField === 'strength') return (a.signal.strength - b.signal.strength) * dir
      if (sortField === 'price') return (a.signal.price - b.signal.price) * dir
      if (sortField === 'riskReward') return (a.signal.riskReward - b.signal.riskReward) * dir
      return 0
    })
  }, [signals, sortField, sortAsc])

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(false) }
  }

  const stats = useMemo(() => {
    const buy = signals.filter((s) => s.signal.type === 'BUY').length
    const sell = signals.filter((s) => s.signal.type === 'SELL').length
    const hold = signals.filter((s) => s.signal.type === 'HOLD').length
    const avgStrength = signals.length > 0
      ? signals.reduce((s, r) => s + r.signal.strength, 0) / signals.length
      : 0
    return { buy, sell, hold, avgStrength }
  }, [signals])

  const SortHeader = ({ label, field, align }: { label: string; field: SortField; align?: string }) => (
    <button className={`flex items-center gap-1 text-xs ${align === 'right' ? 'ml-auto' : ''}`} onClick={() => handleSort(field)}>
      {label}
      {sortField === field && <ArrowUpDown className="h-3 w-3" />}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Zap className="h-5 w-5" />
          Signal Dashboard
        </h2>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Badge variant="outline" className="text-xs">{signals.length} symbols</Badge>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={loadSignals} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="py-2 px-4">
            <p className="text-xs text-muted-foreground">Buy Signals</p>
            <p className="text-lg font-bold text-emerald-500">{stats.buy}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2 px-4">
            <p className="text-xs text-muted-foreground">Sell Signals</p>
            <p className="text-lg font-bold text-red-500">{stats.sell}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2 px-4">
            <p className="text-xs text-muted-foreground">Hold</p>
            <p className="text-lg font-bold text-muted-foreground">{stats.hold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2 px-4">
            <p className="text-xs text-muted-foreground">Avg Strength</p>
            <p className={`text-lg font-bold ${strengthColor(stats.avgStrength)}`}>{stats.avgStrength.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Signal Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortHeader label="Symbol" field="symbol" /></TableHead>
                    <TableHead><SortHeader label="Signal" field="type" /></TableHead>
                    <TableHead><SortHeader label="Strength" field="strength" /></TableHead>
                    <TableHead className="text-right"><SortHeader label="Price" field="price" align="right" /></TableHead>
                    <TableHead className="text-right">Stop Loss</TableHead>
                    <TableHead className="text-right">Take Profit</TableHead>
                    <TableHead className="text-right"><SortHeader label="R:R" field="riskReward" align="right" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && signals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Computing signals...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        No signals available
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((row) => (
                      <TableRow
                        key={row.symbol}
                        className={`cursor-pointer hover:bg-accent/50 ${selectedSignal?.symbol === row.symbol ? 'bg-accent/30' : ''}`}
                        onClick={() => setSelectedSignal(row)}
                      >
                        <TableCell>
                          <span className="text-sm font-medium">{row.symbol}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${typeColor(row.signal.type)}`}>
                            {row.signal.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="relative h-1.5 w-16 rounded-full bg-accent">
                              <div
                                className={`absolute top-0 h-1.5 rounded-full ${strengthBg(row.signal.strength)}`}
                                style={{ width: `${row.signal.strength}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${strengthColor(row.signal.strength)}`}>
                              {row.signal.strength}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">${row.signal.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm text-red-500">
                          {row.signal.stopLoss > 0 ? `$${row.signal.stopLoss.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-500">
                          {row.signal.takeProfit > 0 ? `$${row.signal.takeProfit.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {row.signal.riskReward > 0 ? `${row.signal.riskReward.toFixed(1)}:1` : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Signal Detail Panel */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Signal Detail</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {selectedSignal ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold">{selectedSignal.symbol}</span>
                    <Badge className={`ml-2 text-xs ${typeColor(selectedSignal.signal.type)}`}>
                      {selectedSignal.signal.type}
                    </Badge>
                  </div>
                  <Button size="sm" className="h-7 text-xs" onClick={() => navigate(`/quote?symbol=${selectedSignal.symbol}`)}>
                    View Quote
                  </Button>
                </div>

                {/* Strength gauge */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Signal Strength</span>
                    <span className={`text-sm font-bold ${strengthColor(selectedSignal.signal.strength)}`}>
                      {selectedSignal.signal.strength}/100
                    </span>
                  </div>
                  <div className="relative h-3 w-full rounded-full bg-accent">
                    <div
                      className={`absolute top-0 h-3 rounded-full transition-all ${strengthBg(selectedSignal.signal.strength)}`}
                      style={{ width: `${selectedSignal.signal.strength}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-red-500">Sell</span>
                    <span className="text-xs text-muted-foreground">Hold</span>
                    <span className="text-xs text-emerald-500">Buy</span>
                  </div>
                </div>

                <Separator />

                {/* Key Levels */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Key Levels</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-md bg-accent/30 px-3 py-2">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-sm font-medium">${selectedSignal.signal.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-accent/30 px-3 py-2">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Risk:Reward</p>
                        <p className="text-sm font-medium">{selectedSignal.signal.riskReward > 0 ? `${selectedSignal.signal.riskReward.toFixed(1)}:1` : '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Stop Loss</p>
                        <p className="text-sm font-medium text-red-500">
                          {selectedSignal.signal.stopLoss > 0 ? `$${selectedSignal.signal.stopLoss.toFixed(2)}` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Take Profit</p>
                        <p className="text-sm font-medium text-emerald-500">
                          {selectedSignal.signal.takeProfit > 0 ? `$${selectedSignal.signal.takeProfit.toFixed(2)}` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Factor Breakdown */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Analysis Factors</p>
                  <div className="space-y-1.5">
                    {selectedSignal.signal.indicators.length > 0 ? (
                      selectedSignal.signal.indicators.map((ind, i) => {
                        const isBull = ind.toLowerCase().includes('buy') || ind.toLowerCase().includes('bull') || ind.toLowerCase().includes('oversold') || ind.toLowerCase().includes('uptrend') || ind.toLowerCase().includes('above') || ind.toLowerCase().includes('golden')
                        return (
                          <div key={i} className="flex items-start gap-2">
                            {isBull ? (
                              <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-500" />
                            )}
                            <span className="text-xs">{ind}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex items-center gap-2">
                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{selectedSignal.signal.reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => navigate(`/trade?symbol=${selectedSignal.symbol}`)}>
                    Trade {selectedSignal.symbol}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => navigate('/alerts')}>
                    Create Alert
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Computed {new Date(selectedSignal.signal.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Zap className="mb-3 h-8 w-8 opacity-30" />
                <p className="text-sm">Select a signal to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
