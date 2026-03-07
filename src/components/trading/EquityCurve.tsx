import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchHistoricalData } from '@/services/marketData'
import type { OHLCV, TimeRange } from '@/types/market'
import { Loader2, TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface EquityPoint {
  date: string
  value: number
  benchmark: number
}

const RANGES: TimeRange[] = ['1M', '3M', '6M', '1Y']

export function EquityCurve() {
  const { holdings, totals } = usePortfolioContext()
  const [data, setData] = useState<EquityPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<TimeRange>('3M')

  useEffect(() => {
    if (holdings.length === 0) { setLoading(false); return }

    async function compute() {
      try {
        const symbols = holdings.map((h) => h.symbol)
        const totalWeight = holdings.reduce((s, h) => s + h.marketValue, 0)
        const weights = holdings.map((h) => h.marketValue / (totalWeight || 1))

        const [historicals, spData] = await Promise.all([
          Promise.all(symbols.map((s) => fetchHistoricalData(s, range).catch(() => [] as OHLCV[]))),
          fetchHistoricalData('^GSPC', range).catch(() => [] as OHLCV[]),
        ])

        const minLen = Math.min(spData.length, ...historicals.map((h) => h.length))
        if (minLen < 2) { setLoading(false); return }

        const baseValue = totals.totalMarketValue
        const spBase = spData[0].close

        const points: EquityPoint[] = []
        let cumReturn = 0

        for (let i = 0; i < minLen; i++) {
          if (i > 0) {
            let dayReturn = 0
            for (let j = 0; j < historicals.length; j++) {
              const d = historicals[j]
              if (d.length >= minLen && d[i - 1].close > 0) {
                const ret = (d[i].close - d[i - 1].close) / d[i - 1].close
                dayReturn += ret * weights[j]
              }
            }
            cumReturn = (1 + cumReturn) * (1 + dayReturn) - 1
          }

          const spReturn = (spData[i].close - spBase) / spBase
          const date = new Date(spData[i].timestamp)

          points.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(baseValue / (1 + cumReturn) * (1 + cumReturn)),
            benchmark: Math.round(baseValue * (1 + spReturn)),
          })
        }

        setData(points)
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    compute()
  }, [holdings.map((h) => h.symbol).join(','), range, totals.totalMarketValue])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Computing equity curve...</span>
        </CardContent>
      </Card>
    )
  }

  if (data.length < 2) return null

  const startVal = data[0].value
  const endVal = data[data.length - 1].value
  const totalReturn = ((endVal - startVal) / startVal) * 100
  const benchStart = data[0].benchmark
  const benchEnd = data[data.length - 1].benchmark
  const benchReturn = ((benchEnd - benchStart) / benchStart) * 100

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Portfolio Performance
          </CardTitle>
          <div className="flex items-center gap-1">
            {RANGES.map((r) => (
              <Button
                key={r}
                variant={range === r ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(210, 70%, 55%)' }} />
            <span className="text-muted-foreground">Portfolio</span>
            <Badge variant="outline" className={`h-4 px-1 text-xs ${totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(0, 0%, 50%)' }} />
            <span className="text-muted-foreground">S&P 500</span>
            <Badge variant="outline" className={`h-4 px-1 text-xs ${benchReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {benchReturn >= 0 ? '+' : ''}{benchReturn.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210, 70%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210, 70%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0 0% 10%)',
                  border: '1px solid hsl(0 0% 20%)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => [
                  `$${Number(value).toLocaleString()}`,
                  name === 'value' ? 'Portfolio' : 'S&P 500',
                ]}
              />
              <ReferenceLine y={startVal} stroke="hsl(0 0% 30%)" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(210, 70%, 55%)"
                strokeWidth={2}
                fill="url(#eqGrad)"
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                stroke="hsl(0, 0%, 50%)"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
