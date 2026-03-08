import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
import { Dice5, Play, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function boxMuller(rand: () => number): number {
  const u1 = rand()
  const u2 = rand()
  return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2)
}

interface SimResult {
  paths: number[][]
  finalValues: number[]
  percentiles: { p5: number[]; p25: number[]; p50: number[]; p75: number[]; p95: number[] }
  stats: {
    mean: number
    median: number
    p5: number
    p95: number
    probLoss: number
    probDouble: number
    maxDrawdown: number
    expectedReturn: number
  }
}

function runSimulation(
  initialValue: number,
  annualReturn: number,
  annualVol: number,
  years: number,
  numSims: number,
  seed: number,
): SimResult {
  const rand = seededRandom(seed)
  const dt = 1 / 252 // daily steps
  const totalDays = Math.round(years * 252)
  const dailyMu = (annualReturn - 0.5 * annualVol * annualVol) * dt
  const dailySigma = annualVol * Math.sqrt(dt)

  const paths: number[][] = []
  const finalValues: number[] = []

  for (let sim = 0; sim < numSims; sim++) {
    const path: number[] = [initialValue]
    let value = initialValue
    for (let d = 1; d <= totalDays; d++) {
      const z = boxMuller(rand)
      value = value * Math.exp(dailyMu + dailySigma * z)
      if (d % 5 === 0 || d === totalDays) {
        path.push(value)
      }
    }
    paths.push(path)
    finalValues.push(value)
  }

  finalValues.sort((a, b) => a - b)

  // Calculate percentile paths (weekly)
  const pathLen = paths[0].length
  const p5: number[] = []
  const p25: number[] = []
  const p50: number[] = []
  const p75: number[] = []
  const p95: number[] = []

  for (let t = 0; t < pathLen; t++) {
    const vals = paths.map((p) => p[t]).sort((a, b) => a - b)
    p5.push(vals[Math.floor(numSims * 0.05)])
    p25.push(vals[Math.floor(numSims * 0.25)])
    p50.push(vals[Math.floor(numSims * 0.5)])
    p75.push(vals[Math.floor(numSims * 0.75)])
    p95.push(vals[Math.floor(numSims * 0.95)])
  }

  // Max drawdown from median path
  let peak = p50[0]
  let maxDD = 0
  for (const v of p50) {
    if (v > peak) peak = v
    const dd = (peak - v) / peak
    if (dd > maxDD) maxDD = dd
  }

  const mean = finalValues.reduce((s, v) => s + v, 0) / numSims
  const probLoss = finalValues.filter((v) => v < initialValue).length / numSims
  const probDouble = finalValues.filter((v) => v >= initialValue * 2).length / numSims

  return {
    paths,
    finalValues,
    percentiles: { p5, p25, p50, p75, p95 },
    stats: {
      mean,
      median: finalValues[Math.floor(numSims * 0.5)],
      p5: finalValues[Math.floor(numSims * 0.05)],
      p95: finalValues[Math.floor(numSims * 0.95)],
      probLoss,
      probDouble,
      maxDrawdown: maxDD,
      expectedReturn: (mean / initialValue - 1) * 100,
    },
  }
}

type Horizon = '1' | '3' | '5' | '10'

export function MonteCarlo() {
  const { totals } = usePortfolioContext()
  const [horizon, setHorizon] = useState<Horizon>('5')
  const [simSeed, setSimSeed] = useState(42)

  const initialValue = totals.totalMarketValue + totals.cash

  // Assume portfolio characteristics
  const annualReturn = 0.10
  const annualVol = 0.22

  const sim = useMemo(
    () => runSimulation(initialValue > 0 ? initialValue : 500000, annualReturn, annualVol, Number(horizon), 500, simSeed),
    [initialValue, horizon, simSeed],
  )

  const chartData = useMemo(() => {
    const len = sim.percentiles.p50.length
    return Array.from({ length: len }, (_, i) => ({
      week: i,
      p5: Math.round(sim.percentiles.p5[i]),
      p25: Math.round(sim.percentiles.p25[i]),
      p50: Math.round(sim.percentiles.p50[i]),
      p75: Math.round(sim.percentiles.p75[i]),
      p95: Math.round(sim.percentiles.p95[i]),
    }))
  }, [sim])

  // Distribution histogram
  const histData = useMemo(() => {
    const min = sim.finalValues[0]
    const max = sim.finalValues[sim.finalValues.length - 1]
    const bucketCount = 30
    const bucketSize = (max - min) / bucketCount
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      range: Math.round(min + i * bucketSize),
      count: 0,
      isLoss: min + i * bucketSize < (initialValue > 0 ? initialValue : 500000),
    }))
    for (const v of sim.finalValues) {
      const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1)
      if (idx >= 0) buckets[idx].count++
    }
    return buckets
  }, [sim, initialValue])

  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}K`
  const fmtFull = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Dice5 className="h-5 w-5" />
          Monte Carlo Simulator
        </h2>
        <div className="flex items-center gap-2">
          <Select value={horizon} onValueChange={(v) => { if (v) setHorizon(v as Horizon) }}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Year</SelectItem>
              <SelectItem value="3">3 Years</SelectItem>
              <SelectItem value="5">5 Years</SelectItem>
              <SelectItem value="10">10 Years</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => setSimSeed((s) => s + 1)}>
            <Play className="h-3.5 w-3.5" /> Re-run
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        500 simulations | {horizon}-year horizon | 10% expected return | 22% volatility | Geometric Brownian Motion
      </p>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Median Outcome" value={fmtFull(sim.stats.median)} color="text-foreground" sub={`${((sim.stats.median / (initialValue || 500000) - 1) * 100).toFixed(0)}% return`} />
        <StatCard icon={TrendingUp} label="Best Case (95th)" value={fmtFull(sim.stats.p95)} color="text-emerald-500" sub={`${((sim.stats.p95 / (initialValue || 500000) - 1) * 100).toFixed(0)}% return`} />
        <StatCard icon={TrendingDown} label="Worst Case (5th)" value={fmtFull(sim.stats.p5)} color="text-red-500" sub={`${((sim.stats.p5 / (initialValue || 500000) - 1) * 100).toFixed(0)}% return`} />
        <StatCard icon={AlertTriangle} label="Prob. of Loss" value={`${(sim.stats.probLoss * 100).toFixed(1)}%`} color={sim.stats.probLoss > 0.3 ? 'text-red-500' : 'text-emerald-500'} sub={`${(sim.stats.probDouble * 100).toFixed(1)}% chance to double`} />
      </div>

      {/* Probability Cone */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Probability Cone ({horizon}-Year Projection)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                tickFormatter={(w) => {
                  const totalWeeks = chartData.length - 1
                  if (totalWeeks === 0) return ''
                  const yr = (w / totalWeeks) * Number(horizon)
                  return `Y${yr.toFixed(1)}`
                }}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [fmtFull(Number(v)), '']}
                labelFormatter={(w) => {
                  const totalWeeks = chartData.length - 1
                  if (totalWeeks === 0) return ''
                  const yr = (Number(w) / totalWeeks) * Number(horizon)
                  return `Year ${yr.toFixed(1)}`
                }}
              />
              <Area type="monotone" dataKey="p95" stackId="cone" stroke="none" fill="#10b98115" />
              <Area type="monotone" dataKey="p75" stackId="cone2" stroke="none" fill="#10b98125" />
              <Area type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} fill="none" />
              <Area type="monotone" dataKey="p25" stackId="cone3" stroke="none" fill="#ef444425" />
              <Area type="monotone" dataKey="p5" stackId="cone4" stroke="none" fill="#ef444415" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded" style={{ backgroundColor: '#10b98130' }} /> 25th-75th percentile</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded" style={{ backgroundColor: '#10b98115' }} /> 5th-95th percentile</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded" style={{ backgroundColor: '#10b981' }} /> Median path</span>
          </div>
        </CardContent>
      </Card>

      {/* Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Terminal Value Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} tickFormatter={(v) => fmt(v)} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [v, 'Simulations']}
                labelFormatter={(v) => fmtFull(Number(v))}
              />
              <ReferenceLine x={initialValue > 0 ? initialValue : 500000} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Initial', fontSize: 10, fill: '#f59e0b' }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {histData.map((d, i) => (
                  <Cell key={i} fill={d.isLoss ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Simulation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Starting Value</p>
              <p className="text-sm font-bold">{fmtFull(initialValue > 0 ? initialValue : 500000)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mean Outcome</p>
              <p className="text-sm font-bold">{fmtFull(sim.stats.mean)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected Return</p>
              <p className="text-sm font-bold text-emerald-500">{sim.stats.expectedReturn.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Median Max Drawdown</p>
              <p className="text-sm font-bold text-red-500">{(sim.stats.maxDrawdown * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">500 paths</Badge>
            <Badge variant="outline" className="text-xs">GBM model</Badge>
            <Badge variant="outline" className="text-xs">Daily steps</Badge>
            <Badge variant="outline" className="text-xs">Seed: {simSeed}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: typeof DollarSign; label: string; value: string; color: string; sub: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
          <Icon className={`h-4 w-4 ${color}`} />
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
