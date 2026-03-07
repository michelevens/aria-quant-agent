import { useState } from 'react'
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTechnicalAnalysis } from '@/hooks/useMarketData'
import { sma, bollingerBands } from '@/lib/analytics/technicals'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import type { TimeRange } from '@/types/market'

const timeframes: TimeRange[] = ['1D', '5D', '1M', '3M', '1Y', '5Y']

interface ChartDataPoint {
  date: string
  close: number
  volume: number
  sma20?: number
  sma50?: number
  bbUpper?: number
  bbLower?: number
}

export function PriceChart({ symbol = 'NVDA' }: { symbol?: string }) {
  const [timeframe, setTimeframe] = useState<TimeRange>('3M')
  const [showSMA, setShowSMA] = useState(true)
  const [showBB, setShowBB] = useState(false)

  const { data: bars, indicators, signal, loading, error } = useTechnicalAnalysis(symbol, timeframe)

  // Transform OHLCV to chart data with overlays
  const chartData: ChartDataPoint[] = (() => {
    if (bars.length === 0) return []

    const closes = bars.map((b) => b.close)
    const sma20 = sma(closes, 20)
    const sma50 = sma(closes, 50)
    const bb = bollingerBands(closes, 20, 2)

    return bars.map((bar, i) => {
      const d = new Date(bar.timestamp)
      const dateStr = timeframe === '1D'
        ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      return {
        date: dateStr,
        close: bar.close,
        volume: bar.volume,
        sma20: isNaN(sma20[i]) ? undefined : sma20[i],
        sma50: isNaN(sma50[i]) ? undefined : sma50[i],
        bbUpper: isNaN(bb.upper[i]) ? undefined : bb.upper[i],
        bbLower: isNaN(bb.lower[i]) ? undefined : bb.lower[i],
      }
    })
  })()

  const firstPrice = chartData[0]?.close ?? 0
  const lastPrice = chartData[chartData.length - 1]?.close ?? 0
  const change = lastPrice - firstPrice
  const changePct = firstPrice > 0 ? (change / firstPrice) * 100 : 0
  const isPositive = change >= 0
  const gradientId = `priceGradient-${symbol}`

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{symbol}</h3>
            {signal && (
              <Badge
                className={`text-xs ${
                  signal.type === 'BUY'
                    ? 'bg-emerald-600'
                    : signal.type === 'SELL'
                    ? 'bg-red-600'
                    : 'bg-yellow-600'
                }`}
              >
                {signal.type} ({signal.strength}%)
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
              </span>
            ) : error ? (
              <span className="text-sm text-red-500">Using cached data</span>
            ) : (
              <>
                <span className="text-2xl font-bold">${lastPrice.toFixed(2)}</span>
                <span
                  className={`flex items-center gap-0.5 text-sm font-medium ${
                    isPositive ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {isPositive ? '+' : ''}
                  {change.toFixed(2)} ({isPositive ? '+' : ''}
                  {changePct.toFixed(2)}%)
                </span>
              </>
            )}
          </div>
          {indicators && (
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>RSI: <span className={indicators.rsi14 > 70 ? 'text-red-400' : indicators.rsi14 < 30 ? 'text-emerald-400' : ''}>{indicators.rsi14.toFixed(1)}</span></span>
              <span>MACD: <span className={indicators.macd.histogram > 0 ? 'text-emerald-400' : 'text-red-400'}>{indicators.macd.histogram.toFixed(2)}</span></span>
              <span>ATR: {indicators.atr14.toFixed(2)}</span>
              <span>ADX: {indicators.adx14.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button
              variant={showSMA ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowSMA(!showSMA)}
            >
              SMA
            </Button>
            <Button
              variant={showBB ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowBB(!showBB)}
            >
              BB
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1 pb-3">
        <div className="flex-1" style={{ minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0 0% 10%)',
                  border: '1px solid hsl(0 0% 20%)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(0 0% 70%)' }}
              />
              {showBB && (
                <>
                  <Area type="monotone" dataKey="bbUpper" stroke="none" fill="hsl(210 50% 50%)" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="bbLower" stroke="none" fill="transparent" />
                  <Line type="monotone" dataKey="bbUpper" stroke="hsl(210 50% 50%)" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                  <Line type="monotone" dataKey="bbLower" stroke="hsl(210 50% 50%)" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                </>
              )}
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
              {showSMA && (
                <>
                  <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="sma50" stroke="#8b5cf6" strokeWidth={1} dot={false} />
                </>
              )}
              {indicators && (
                <>
                  <ReferenceLine y={indicators.support} stroke="#10b981" strokeDasharray="8 4" strokeOpacity={0.5} />
                  <ReferenceLine y={indicators.resistance} stroke="#ef4444" strokeDasharray="8 4" strokeOpacity={0.5} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ height: '50px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <Bar dataKey="volume" fill="hsl(0 0% 25%)" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
