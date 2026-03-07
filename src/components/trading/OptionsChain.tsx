import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Layers, ChevronDown, ChevronUp } from 'lucide-react'

interface OptionLeg {
  type: 'call' | 'put'
  strike: number
  premium: number
  delta: number
  gamma: number
  theta: number
  vega: number
  iv: number
  volume: number
  oi: number
  bid: number
  ask: number
  itm: boolean
}

function generateChain(spotPrice: number, type: 'call' | 'put'): OptionLeg[] {
  const strikes: number[] = []
  const base = Math.round(spotPrice / 5) * 5
  for (let i = -10; i <= 10; i++) {
    strikes.push(base + i * 5)
  }

  return strikes.map((strike) => {
    const moneyness = (spotPrice - strike) / spotPrice
    const isCall = type === 'call'
    const itm = isCall ? spotPrice > strike : spotPrice < strike

    // Black-Scholes-ish approximation for demo
    const intrinsic = Math.max(0, isCall ? spotPrice - strike : strike - spotPrice)
    const timeValue = spotPrice * 0.02 * Math.exp(-Math.abs(moneyness) * 5)
    const premium = Math.max(0.01, intrinsic + timeValue)

    const iv = 0.25 + Math.abs(moneyness) * 0.3 + Math.random() * 0.05
    const delta = isCall
      ? Math.max(0.01, Math.min(0.99, 0.5 + moneyness * 3))
      : Math.max(-0.99, Math.min(-0.01, -0.5 + moneyness * 3))
    const gamma = Math.max(0.001, 0.05 * Math.exp(-moneyness * moneyness * 20))
    const theta = -(premium * 0.03 + Math.random() * 0.02)
    const vega = spotPrice * 0.01 * Math.exp(-moneyness * moneyness * 10)

    const spread = premium * 0.03
    const bid = Math.max(0.01, premium - spread)
    const ask = premium + spread

    return {
      type,
      strike,
      premium: Math.round(premium * 100) / 100,
      delta: Math.round(delta * 1000) / 1000,
      gamma: Math.round(gamma * 10000) / 10000,
      theta: Math.round(theta * 100) / 100,
      vega: Math.round(vega * 100) / 100,
      iv: Math.round(iv * 10000) / 100,
      volume: Math.floor(Math.random() * 5000 + 100),
      oi: Math.floor(Math.random() * 20000 + 500),
      bid: Math.round(bid * 100) / 100,
      ask: Math.round(ask * 100) / 100,
      itm,
    }
  })
}

interface PayoffPoint {
  price: number
  pnl: number
}

function computePayoff(
  type: 'call' | 'put',
  strike: number,
  premium: number,
  isBuy: boolean,
  spotPrice: number,
): PayoffPoint[] {
  const points: PayoffPoint[] = []
  const range = spotPrice * 0.3
  for (let p = spotPrice - range; p <= spotPrice + range; p += range / 50) {
    let pnl: number
    if (type === 'call') {
      pnl = Math.max(0, p - strike) - premium
    } else {
      pnl = Math.max(0, strike - p) - premium
    }
    if (!isBuy) pnl = -pnl
    points.push({ price: Math.round(p * 100) / 100, pnl: Math.round(pnl * 100) / 100 })
  }
  return points
}

export function OptionsChain({ symbol, spotPrice }: { symbol: string; spotPrice: number }) {
  const [activeTab, setActiveTab] = useState<'chain' | 'payoff'>('chain')
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<'call' | 'put'>('call')
  const [showGreeks, setShowGreeks] = useState(true)
  const [inputSymbol] = useState(symbol)

  const price = spotPrice || 150

  const calls = useMemo(() => generateChain(price, 'call'), [price])
  const puts = useMemo(() => generateChain(price, 'put'), [price])

  const payoffData = useMemo(() => {
    if (!selectedStrike) return []
    const option = (selectedType === 'call' ? calls : puts).find((o) => o.strike === selectedStrike)
    if (!option) return []
    return computePayoff(selectedType, selectedStrike, option.premium, true, price)
  }, [selectedStrike, selectedType, calls, puts, price])

  const selectedOption = selectedStrike
    ? (selectedType === 'call' ? calls : puts).find((o) => o.strike === selectedStrike)
    : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4" />
            Options Chain — {inputSymbol}
            <Badge variant="outline" className="text-xs">
              Spot: ${price.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-xs">Simulated</Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'chain' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab('chain')}
            >
              Chain
            </Button>
            <Button
              variant={activeTab === 'payoff' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab('payoff')}
              disabled={!selectedStrike}
            >
              Payoff
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowGreeks(!showGreeks)}
            >
              {showGreeks ? 'Hide' : 'Show'} Greeks
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'chain' ? (
          <div className="overflow-auto" style={{ maxHeight: '500px' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right text-xs text-emerald-500">Bid</TableHead>
                  <TableHead className="text-right text-xs text-emerald-500">Ask</TableHead>
                  <TableHead className="text-right text-xs text-emerald-500">Vol</TableHead>
                  <TableHead className="text-right text-xs text-emerald-500">OI</TableHead>
                  {showGreeks && (
                    <>
                      <TableHead className="text-right text-xs text-emerald-500">IV</TableHead>
                      <TableHead className="text-right text-xs text-emerald-500">Delta</TableHead>
                    </>
                  )}
                  <TableHead className="text-center text-xs font-bold">Strike</TableHead>
                  {showGreeks && (
                    <>
                      <TableHead className="text-right text-xs text-red-500">Delta</TableHead>
                      <TableHead className="text-right text-xs text-red-500">IV</TableHead>
                    </>
                  )}
                  <TableHead className="text-right text-xs text-red-500">OI</TableHead>
                  <TableHead className="text-right text-xs text-red-500">Vol</TableHead>
                  <TableHead className="text-right text-xs text-red-500">Ask</TableHead>
                  <TableHead className="text-right text-xs text-red-500">Bid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call, i) => {
                  const put = puts[i]
                  const isATM = Math.abs(call.strike - price) < 2.5
                  return (
                    <TableRow
                      key={call.strike}
                      className={`cursor-pointer ${isATM ? 'bg-primary/10' : ''} ${
                        selectedStrike === call.strike ? 'ring-1 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedStrike(call.strike)
                      }}
                    >
                      <TableCell className={`text-right text-xs ${call.itm ? 'bg-emerald-500/5' : ''}`}>{call.bid.toFixed(2)}</TableCell>
                      <TableCell className={`text-right text-xs ${call.itm ? 'bg-emerald-500/5' : ''}`}>{call.ask.toFixed(2)}</TableCell>
                      <TableCell className={`text-right text-xs ${call.itm ? 'bg-emerald-500/5' : ''}`}>{call.volume.toLocaleString()}</TableCell>
                      <TableCell className={`text-right text-xs ${call.itm ? 'bg-emerald-500/5' : ''}`}>{call.oi.toLocaleString()}</TableCell>
                      {showGreeks && (
                        <>
                          <TableCell className={`text-right text-xs ${call.itm ? 'bg-emerald-500/5' : ''}`}>{call.iv.toFixed(1)}%</TableCell>
                          <TableCell className={`text-right text-xs ${call.itm ? 'bg-emerald-500/5' : ''}`}>{call.delta.toFixed(3)}</TableCell>
                        </>
                      )}
                      <TableCell className="text-center text-xs font-bold">
                        {call.strike.toFixed(0)}
                        {isATM && <span className="ml-1 text-primary">ATM</span>}
                      </TableCell>
                      {showGreeks && (
                        <>
                          <TableCell className={`text-right text-xs ${put.itm ? 'bg-red-500/5' : ''}`}>{put.delta.toFixed(3)}</TableCell>
                          <TableCell className={`text-right text-xs ${put.itm ? 'bg-red-500/5' : ''}`}>{put.iv.toFixed(1)}%</TableCell>
                        </>
                      )}
                      <TableCell className={`text-right text-xs ${put.itm ? 'bg-red-500/5' : ''}`}>{put.oi.toLocaleString()}</TableCell>
                      <TableCell className={`text-right text-xs ${put.itm ? 'bg-red-500/5' : ''}`}>{put.volume.toLocaleString()}</TableCell>
                      <TableCell className={`text-right text-xs ${put.itm ? 'bg-red-500/5' : ''}`}>{put.ask.toFixed(2)}</TableCell>
                      <TableCell className={`text-right text-xs ${put.itm ? 'bg-red-500/5' : ''}`}>{put.bid.toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button
                  variant={selectedType === 'call' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedType('call')}
                >
                  <ChevronUp className="mr-1 h-3 w-3" />
                  Call
                </Button>
                <Button
                  variant={selectedType === 'put' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedType('put')}
                >
                  <ChevronDown className="mr-1 h-3 w-3" />
                  Put
                </Button>
              </div>
              {selectedOption && (
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>Strike: <strong>${selectedStrike}</strong></span>
                  <span>Premium: <strong>${selectedOption.premium.toFixed(2)}</strong></span>
                  <span>IV: <strong>{selectedOption.iv.toFixed(1)}%</strong></span>
                  <span>Delta: <strong>{selectedOption.delta.toFixed(3)}</strong></span>
                  <span>Theta: <strong>{selectedOption.theta.toFixed(2)}</strong></span>
                  <span>Gamma: <strong>{selectedOption.gamma.toFixed(4)}</strong></span>
                  <span>Vega: <strong>{selectedOption.vega.toFixed(2)}</strong></span>
                </div>
              )}
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payoffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="price"
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'P&L']}
                    labelFormatter={(label) => `Stock: $${label}`}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <ReferenceLine x={price} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: 'Spot', fontSize: 10 }} />
                  <defs>
                    <linearGradient id="payoffGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke="hsl(var(--primary))"
                    fill="url(#payoffGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
