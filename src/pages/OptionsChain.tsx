import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { Search, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react'

// Seeded random for deterministic data
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface OptionContract {
  strike: number
  callBid: number
  callAsk: number
  callLast: number
  callVolume: number
  callOI: number
  callDelta: number
  callGamma: number
  callTheta: number
  callVega: number
  callIV: number
  putBid: number
  putAsk: number
  putLast: number
  putVolume: number
  putOI: number
  putDelta: number
  putGamma: number
  putTheta: number
  putVega: number
  putIV: number
  inTheMoneyCalls: boolean
  inTheMoneyPuts: boolean
}

const SYMBOLS: Record<string, { price: number; name: string }> = {
  AAPL: { price: 227.48, name: 'Apple Inc.' },
  NVDA: { price: 131.28, name: 'NVIDIA Corp.' },
  MSFT: { price: 415.60, name: 'Microsoft Corp.' },
  GOOGL: { price: 173.25, name: 'Alphabet Inc.' },
  AMZN: { price: 205.74, name: 'Amazon.com Inc.' },
  META: { price: 585.42, name: 'Meta Platforms' },
  TSLA: { price: 248.90, name: 'Tesla Inc.' },
  SPY: { price: 525.30, name: 'SPDR S&P 500 ETF' },
  QQQ: { price: 448.75, name: 'Invesco QQQ Trust' },
  AMD: { price: 158.40, name: 'Advanced Micro Devices' },
}

function generateExpirations(): string[] {
  const exps: string[] = []
  const now = new Date()
  // Weekly for next 4 weeks
  for (let i = 1; i <= 4; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i * 7 - d.getDay() + 5) // next Friday
    exps.push(d.toISOString().slice(0, 10))
  }
  // Monthly for next 6 months
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 0)
    // Third Friday of month
    const thirdFriday = new Date(d.getFullYear(), d.getMonth(), 1)
    thirdFriday.setDate(1 + ((5 - thirdFriday.getDay() + 7) % 7) + 14)
    if (thirdFriday > now) exps.push(thirdFriday.toISOString().slice(0, 10))
  }
  return [...new Set(exps)].sort()
}

function generateChain(symbol: string, expiration: string, spotPrice: number): OptionContract[] {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
    expiration.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = seededRandom(seed)

  const daysToExp = Math.max(1, Math.round((new Date(expiration).getTime() - Date.now()) / 86400000))
  const T = daysToExp / 365

  // Generate strikes around spot price
  const strikeStep = spotPrice > 300 ? 5 : spotPrice > 100 ? 2.5 : 1
  const numStrikes = 15
  const centerStrike = Math.round(spotPrice / strikeStep) * strikeStep
  const strikes: number[] = []
  for (let i = -numStrikes; i <= numStrikes; i++) {
    strikes.push(centerStrike + i * strikeStep)
  }

  return strikes.filter((s) => s > 0).map((strike) => {
    const moneyness = spotPrice / strike
    const baseIV = 0.20 + 0.10 * Math.abs(1 - moneyness) + rng() * 0.08
    const callIV = baseIV + (moneyness < 1 ? 0.03 : -0.02) * rng()
    const putIV = baseIV + (moneyness > 1 ? 0.03 : -0.02) * rng()

    // Simplified Black-Scholes approximation
    const d1Call = (Math.log(moneyness) + (0.05 + callIV * callIV / 2) * T) / (callIV * Math.sqrt(T))
    // Approximate N(d1) using logistic function
    const nd1Call = 1 / (1 + Math.exp(-1.7 * d1Call))

    const callDelta = Math.max(0.01, Math.min(0.99, nd1Call))
    const putDelta = Math.max(-0.99, Math.min(-0.01, nd1Call - 1))

    const gamma = Math.exp(-d1Call * d1Call / 2) / (spotPrice * callIV * Math.sqrt(2 * Math.PI * T))

    const intrinsicCall = Math.max(0, spotPrice - strike)
    const intrinsicPut = Math.max(0, strike - spotPrice)
    const timeValue = callIV * spotPrice * Math.sqrt(T) * 0.4 * (1 + rng() * 0.2)

    const callPrice = Math.max(intrinsicCall + 0.01, intrinsicCall + timeValue * callDelta)
    const putPrice = Math.max(intrinsicPut + 0.01, intrinsicPut + timeValue * (1 - callDelta))

    const spread = Math.max(0.01, callPrice * 0.02 + rng() * 0.05)

    const volBase = Math.round(50 + rng() * 2000 * (1 / (1 + Math.abs(1 - moneyness) * 10)))
    const oiBase = Math.round(200 + rng() * 10000 * (1 / (1 + Math.abs(1 - moneyness) * 5)))

    return {
      strike,
      callBid: Math.max(0.01, Number((callPrice - spread / 2).toFixed(2))),
      callAsk: Number((callPrice + spread / 2).toFixed(2)),
      callLast: Number((callPrice + (rng() - 0.5) * spread).toFixed(2)),
      callVolume: volBase + Math.round(rng() * 500),
      callOI: oiBase + Math.round(rng() * 2000),
      callDelta: Number(callDelta.toFixed(3)),
      callGamma: Number(gamma.toFixed(4)),
      callTheta: Number((-callIV * spotPrice / (2 * Math.sqrt(T) * 365) * gamma * spotPrice).toFixed(3)),
      callVega: Number((spotPrice * Math.sqrt(T) * gamma * 0.01).toFixed(3)),
      callIV: Number((callIV * 100).toFixed(1)),
      putBid: Math.max(0.01, Number((putPrice - spread / 2).toFixed(2))),
      putAsk: Number((putPrice + spread / 2).toFixed(2)),
      putLast: Number((putPrice + (rng() - 0.5) * spread).toFixed(2)),
      putVolume: Math.round(volBase * (0.6 + rng() * 0.8)),
      putOI: Math.round(oiBase * (0.7 + rng() * 0.6)),
      putDelta: Number(putDelta.toFixed(3)),
      putGamma: Number(gamma.toFixed(4)),
      putTheta: Number((-putIV * spotPrice / (2 * Math.sqrt(T) * 365) * gamma * spotPrice).toFixed(3)),
      putVega: Number((spotPrice * Math.sqrt(T) * gamma * 0.01).toFixed(3)),
      putIV: Number((putIV * 100).toFixed(1)),
      inTheMoneyCalls: spotPrice > strike,
      inTheMoneyPuts: spotPrice < strike,
    }
  })
}

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString()
}

export function OptionsChain() {
  const [symbol, setSymbol] = useState('AAPL')
  const [searchInput, setSearchInput] = useState('')
  const [selectedExpiration, setSelectedExpiration] = useState('')
  const [showGreeks, setShowGreeks] = useState(true)
  const [viewMode, setViewMode] = useState<'chain' | 'calls' | 'puts'>('chain')

  const symbolData = SYMBOLS[symbol] ?? { price: 100, name: symbol }
  const expirations = useMemo(() => generateExpirations(), [])
  const expiration = selectedExpiration || expirations[0] || ''

  const daysToExp = useMemo(() => {
    if (!expiration) return 0
    return Math.max(0, Math.round((new Date(expiration).getTime() - Date.now()) / 86400000))
  }, [expiration])

  const chain = useMemo(() => generateChain(symbol, expiration, symbolData.price), [symbol, expiration, symbolData.price])

  const handleSymbolSearch = () => {
    const s = searchInput.trim().toUpperCase()
    if (s && SYMBOLS[s]) {
      setSymbol(s)
      setSearchInput('')
    }
  }

  // Volume/OI chart data
  const volumeData = useMemo(() => {
    const atm = chain.reduce((best, c) =>
      Math.abs(c.strike - symbolData.price) < Math.abs(best.strike - symbolData.price) ? c : best
    , chain[0])
    const nearby = chain.filter((c) => Math.abs(c.strike - atm.strike) <= (symbolData.price > 200 ? 25 : 12.5))
    return nearby.map((c) => ({
      strike: c.strike,
      callVol: c.callVolume,
      putVol: c.putVolume,
      callOI: c.callOI,
      putOI: c.putOI,
    }))
  }, [chain, symbolData.price])

  // IV skew data
  const skewData = useMemo(() => {
    return chain.filter((c) => c.strike > symbolData.price * 0.85 && c.strike < symbolData.price * 1.15)
      .map((c) => ({
        strike: c.strike,
        callIV: c.callIV,
        putIV: c.putIV,
      }))
  }, [chain, symbolData.price])

  // Summary stats
  const stats = useMemo(() => {
    const totalCallVol = chain.reduce((s, c) => s + c.callVolume, 0)
    const totalPutVol = chain.reduce((s, c) => s + c.putVolume, 0)
    const totalCallOI = chain.reduce((s, c) => s + c.callOI, 0)
    const totalPutOI = chain.reduce((s, c) => s + c.putOI, 0)
    const maxPainStrike = chain.reduce((best, c) => {
      const pain = c.callOI * Math.max(0, c.strike - symbolData.price) +
        c.putOI * Math.max(0, symbolData.price - c.strike)
      const bestPain = best.callOI * Math.max(0, best.strike - symbolData.price) +
        best.putOI * Math.max(0, symbolData.price - best.strike)
      return pain < bestPain ? c : best
    }, chain[0])
    const atmIdx = chain.reduce((bi, c, i) =>
      Math.abs(c.strike - symbolData.price) < Math.abs(chain[bi].strike - symbolData.price) ? i : bi
    , 0)
    const atmIV = chain[atmIdx]?.callIV ?? 0

    return {
      totalCallVol, totalPutVol,
      totalCallOI, totalPutOI,
      pcRatio: totalCallVol > 0 ? (totalPutVol / totalCallVol) : 0,
      maxPain: maxPainStrike?.strike ?? symbolData.price,
      atmIV,
    }
  }, [chain, symbolData.price])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{symbol}</h1>
            <span className="text-sm text-muted-foreground">{symbolData.name}</span>
            <Badge variant="outline" className="text-sm font-semibold">
              ${formatNum(symbolData.price)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSymbolSearch()}
              placeholder="Symbol..."
              className="h-7 w-28 pl-7 text-xs"
            />
          </div>
          <div className="flex gap-1">
            {['AAPL', 'NVDA', 'TSLA', 'SPY', 'QQQ'].map((s) => (
              <Button
                key={s}
                variant={symbol === s ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setSymbol(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Call Volume</p>
            <p className="text-sm font-bold">{formatK(stats.totalCallVol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Put Volume</p>
            <p className="text-sm font-bold">{formatK(stats.totalPutVol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">P/C Ratio</p>
            <p className="text-sm font-bold" style={{ color: stats.pcRatio > 1 ? '#ef4444' : '#10b981' }}>
              {stats.pcRatio.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Call OI</p>
            <p className="text-sm font-bold">{formatK(stats.totalCallOI)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Put OI</p>
            <p className="text-sm font-bold">{formatK(stats.totalPutOI)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Max Pain</p>
            <p className="text-sm font-bold">${formatNum(stats.maxPain, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">ATM IV</p>
            <p className="text-sm font-bold">{stats.atmIV.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={expiration} onValueChange={(v) => { if (v) setSelectedExpiration(v) }}>
          <SelectTrigger className="h-7 w-44 text-xs">
            <SelectValue placeholder="Expiration" />
          </SelectTrigger>
          <SelectContent>
            {expirations.map((exp) => {
              const d = Math.max(0, Math.round((new Date(exp).getTime() - Date.now()) / 86400000))
              return (
                <SelectItem key={exp} value={exp} className="text-xs">
                  {exp} ({d}d)
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">{daysToExp} DTE</Badge>
        <Button
          variant={showGreeks ? 'default' : 'outline'}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => setShowGreeks(!showGreeks)}
        >
          <Activity className="h-3 w-3" /> Greeks
        </Button>
        <div className="flex rounded-md border border-border">
          {(['chain', 'calls', 'puts'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className="px-2 py-1 text-xs capitalize transition-colors first:rounded-l-md last:rounded-r-md"
              style={viewMode === m ? { backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' } : {}}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Options Chain Table */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {(viewMode === 'chain' || viewMode === 'calls') && (
                  <>
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">IV</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Delta</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Gamma</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Theta</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Vega</th>}
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground">OI</th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground">Vol</th>
                    <th className="px-2 py-2 text-right font-medium" style={{ color: '#10b981' }}>Bid</th>
                    <th className="px-2 py-2 text-right font-medium" style={{ color: '#ef4444' }}>Ask</th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground">Last</th>
                  </>
                )}
                <th className="px-3 py-2 text-center font-bold" style={{ backgroundColor: 'var(--accent)', minWidth: '70px' }}>Strike</th>
                {(viewMode === 'chain' || viewMode === 'puts') && (
                  <>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground">Last</th>
                    <th className="px-2 py-2 text-right font-medium" style={{ color: '#10b981' }}>Bid</th>
                    <th className="px-2 py-2 text-right font-medium" style={{ color: '#ef4444' }}>Ask</th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground">Vol</th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground">OI</th>
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Delta</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Gamma</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Theta</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">Vega</th>}
                    {showGreeks && <th className="px-2 py-2 text-right font-medium text-muted-foreground">IV</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {chain.map((c) => {
                const isATM = Math.abs(c.strike - symbolData.price) < (symbolData.price > 200 ? 2.5 : 1.25)
                return (
                  <tr
                    key={c.strike}
                    className="border-b border-border transition-colors hover:bg-accent/30"
                    style={isATM ? { backgroundColor: 'rgba(59, 130, 246, 0.08)' } : undefined}
                  >
                    {(viewMode === 'chain' || viewMode === 'calls') && (
                      <>
                        {showGreeks && <td className="px-2 py-1.5 text-right text-muted-foreground">{c.callIV}%</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right">{c.callDelta}</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right text-muted-foreground">{c.callGamma}</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right" style={{ color: '#ef4444' }}>{c.callTheta}</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right text-muted-foreground">{c.callVega}</td>}
                        <td className="px-2 py-1.5 text-right text-muted-foreground">{formatK(c.callOI)}</td>
                        <td className="px-2 py-1.5 text-right font-medium">{formatK(c.callVolume)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: '#10b981' }}>{c.callBid.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: '#ef4444' }}>{c.callAsk.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right font-medium" style={{
                          backgroundColor: c.inTheMoneyCalls ? 'rgba(16, 185, 129, 0.06)' : undefined,
                        }}>{c.callLast.toFixed(2)}</td>
                      </>
                    )}
                    <td className="px-3 py-1.5 text-center font-bold" style={{
                      backgroundColor: 'var(--accent)',
                      color: isATM ? '#3b82f6' : undefined,
                    }}>
                      {c.strike.toFixed(symbolData.price > 200 ? 0 : 1)}
                    </td>
                    {(viewMode === 'chain' || viewMode === 'puts') && (
                      <>
                        <td className="px-2 py-1.5 text-right font-medium" style={{
                          backgroundColor: c.inTheMoneyPuts ? 'rgba(239, 68, 68, 0.06)' : undefined,
                        }}>{c.putLast.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: '#10b981' }}>{c.putBid.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: '#ef4444' }}>{c.putAsk.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right font-medium">{formatK(c.putVolume)}</td>
                        <td className="px-2 py-1.5 text-right text-muted-foreground">{formatK(c.putOI)}</td>
                        {showGreeks && <td className="px-2 py-1.5 text-right">{c.putDelta}</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right text-muted-foreground">{c.putGamma}</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right" style={{ color: '#ef4444' }}>{c.putTheta}</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right text-muted-foreground">{c.putVega}</td>}
                        {showGreeks && <td className="px-2 py-1.5 text-right text-muted-foreground">{c.putIV}%</td>}
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="volume">
        <TabsList>
          <TabsTrigger value="volume" className="gap-1 text-xs">
            <Zap className="h-3 w-3" /> Volume & OI
          </TabsTrigger>
          <TabsTrigger value="skew" className="gap-1 text-xs">
            <TrendingUp className="h-3 w-3" /> IV Skew
          </TabsTrigger>
          <TabsTrigger value="payoff" className="gap-1 text-xs">
            <TrendingDown className="h-3 w-3" /> P&L Diagram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="volume">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Volume & Open Interest by Strike</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                    <XAxis dataKey="strike" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 10%)',
                        border: '1px solid hsl(0 0% 20%)',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="callVol" name="Call Vol" fill="#10b981" opacity={0.8} />
                    <Bar dataKey="putVol" name="Put Vol" fill="#ef4444" opacity={0.8} />
                    <Bar dataKey="callOI" name="Call OI" fill="#10b981" opacity={0.3} />
                    <Bar dataKey="putOI" name="Put OI" fill="#ef4444" opacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skew">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Implied Volatility Skew</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={skewData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                    <XAxis dataKey="strike" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 10%)',
                        border: '1px solid hsl(0 0% 20%)',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="callIV" name="Call IV" stroke="#10b981" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="putIV" name="Put IV" stroke="#ef4444" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payoff">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ATM Straddle P&L at Expiration</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const atm = chain.reduce((best, c) =>
                  Math.abs(c.strike - symbolData.price) < Math.abs(best.strike - symbolData.price) ? c : best
                , chain[0])
                const cost = atm.callAsk + atm.putAsk
                const range = symbolData.price * 0.15
                const points = Array.from({ length: 61 }, (_, i) => {
                  const px = symbolData.price - range + (i * range * 2 / 60)
                  const callPL = Math.max(0, px - atm.strike) - atm.callAsk
                  const putPL = Math.max(0, atm.strike - px) - atm.putAsk
                  const total = callPL + putPL
                  return { price: Number(px.toFixed(2)), pnl: Number(total.toFixed(2)) }
                })

                return (
                  <>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Strike ${atm.strike} | Cost ${cost.toFixed(2)} | Breakevens: ${(atm.strike - cost).toFixed(2)} / ${(atm.strike + cost).toFixed(2)}
                    </p>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={points}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                          <XAxis dataKey="price" tick={{ fontSize: 9 }} interval={9} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(0 0% 10%)',
                              border: '1px solid hsl(0 0% 20%)',
                              borderRadius: '6px',
                              fontSize: '11px',
                            }}
                            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'P&L']}
                          />
                          <Bar dataKey="pnl" name="P&L">
                            {points.map((p, i) => (
                              <Cell key={i} fill={p.pnl >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
