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
  Cell,
  Rectangle,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTechnicalAnalysis } from '@/hooks/useMarketData'
import { sma, bollingerBands } from '@/lib/analytics/technicals'
import { TrendingUp, TrendingDown, Loader2, CandlestickChart, LineChart, Minus, GitBranch, Trash2 } from 'lucide-react'
import { useChartDrawings } from '@/hooks/useChartDrawings'
import { Input } from '@/components/ui/input'
import type { TimeRange } from '@/types/market'

const timeframes: TimeRange[] = ['1D', '5D', '1M', '3M', '1Y', '5Y']

type ChartMode = 'line' | 'candle'

interface ChartDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  sma20?: number
  sma50?: number
  bbUpper?: number
  bbLower?: number
  // Candlestick helpers
  candleBody: [number, number]
  candleWick: [number, number]
  isGreen: boolean
}

// Custom candlestick shape
function CandlestickShape(props: Record<string, unknown>) {
  const { x, y, width, height, payload } = props as {
    x: number
    y: number
    width: number
    height: number
    payload: ChartDataPoint
  }
  if (!payload) return null

  const { open, high, low, close } = payload
  const isGreen = close >= open
  const fill = isGreen ? '#10b981' : '#ef4444'
  const stroke = isGreen ? '#10b981' : '#ef4444'

  // Body dimensions from the bar
  const bodyX = x
  const bodyY = y
  const bodyWidth = Math.max(width, 2)
  const bodyHeight = Math.max(Math.abs(height), 1)

  // Wick (thin line from low to high)
  const centerX = x + bodyWidth / 2

  // We need to calculate wick positions relative to the chart area
  // The bar gives us body position, wick extends beyond
  const priceRange = Math.max(high, open, close) - Math.min(low, open, close)
  if (priceRange === 0) return null

  const pixelPerUnit = bodyHeight / Math.abs(close - open || 0.01)
  const wickTop = bodyY - (high - Math.max(open, close)) * pixelPerUnit
  const wickBottom = bodyY + bodyHeight + (Math.min(open, close) - low) * pixelPerUnit

  return (
    <g>
      {/* Wick */}
      <line x1={centerX} y1={wickTop} x2={centerX} y2={wickBottom} stroke={stroke} strokeWidth={1} />
      {/* Body */}
      <Rectangle x={bodyX} y={bodyY} width={bodyWidth} height={bodyHeight} fill={fill} stroke={stroke} />
    </g>
  )
}

export function PriceChart({ symbol = 'NVDA' }: { symbol?: string }) {
  const [timeframe, setTimeframe] = useState<TimeRange>('3M')
  const [showSMA, setShowSMA] = useState(true)
  const [showBB, setShowBB] = useState(false)
  const [chartMode, setChartMode] = useState<ChartMode>('candle')
  const [hlineInput, setHlineInput] = useState('')
  const [showDrawingTools, setShowDrawingTools] = useState(false)
  const { drawings, addHLine, addFibonacci, clearDrawings } = useChartDrawings()

  const { data: bars, indicators, signal, loading, error } = useTechnicalAnalysis(symbol, timeframe)

  const chartData: ChartDataPoint[] = (() => {
    if (bars.length === 0) return []

    const closes = bars.map((b) => b.close)
    const sma20Arr = sma(closes, 20)
    const sma50Arr = sma(closes, 50)
    const bb = bollingerBands(closes, 20, 2)

    return bars.map((bar, i) => {
      const d = new Date(bar.timestamp)
      const dateStr = timeframe === '1D'
        ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const isGreen = bar.close >= bar.open

      return {
        date: dateStr,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        sma20: isNaN(sma20Arr[i]) ? undefined : sma20Arr[i],
        sma50: isNaN(sma50Arr[i]) ? undefined : sma50Arr[i],
        bbUpper: isNaN(bb.upper[i]) ? undefined : bb.upper[i],
        bbLower: isNaN(bb.lower[i]) ? undefined : bb.lower[i],
        candleBody: isGreen ? [bar.open, bar.close] : [bar.close, bar.open],
        candleWick: [bar.low, bar.high],
        isGreen,
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
              variant={chartMode === 'candle' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setChartMode('candle')}
              title="Candlestick"
            >
              <CandlestickChart className="h-3 w-3" />
            </Button>
            <Button
              variant={chartMode === 'line' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setChartMode('line')}
              title="Line"
            >
              <LineChart className="h-3 w-3" />
            </Button>
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
            <Button
              variant={showDrawingTools ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowDrawingTools(!showDrawingTools)}
              title="Drawing Tools"
            >
              <GitBranch className="h-3 w-3" />
            </Button>
          </div>
          {showDrawingTools && (
            <div className="flex items-center gap-1">
              <Input
                value={hlineInput}
                onChange={(e) => setHlineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const price = parseFloat(hlineInput)
                    if (!isNaN(price) && price > 0) {
                      addHLine(price)
                      setHlineInput('')
                    }
                  }
                }}
                placeholder="H-Line price..."
                className="h-6 w-24 text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const price = parseFloat(hlineInput)
                  if (!isNaN(price) && price > 0) {
                    addHLine(price)
                    setHlineInput('')
                  }
                }}
                title="Add horizontal line"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  if (chartData.length > 20) {
                    const recent = chartData.slice(-60)
                    const high = Math.max(...recent.map((d) => d.high))
                    const low = Math.min(...recent.map((d) => d.low))
                    addFibonacci(high, low)
                  }
                }}
                title="Auto Fibonacci (last 60 bars)"
              >
                Fib
              </Button>
              {drawings.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-red-500"
                  onClick={clearDrawings}
                  title="Clear all drawings"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
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
                formatter={(value, name) => {
                  if (name === 'candleBody') return null
                  const n = name as string
                  const labels: Record<string, string> = { close: 'Close', open: 'Open', high: 'High', low: 'Low', sma20: 'SMA20', sma50: 'SMA50', bbUpper: 'BB Upper', bbLower: 'BB Lower' }
                  return [`$${Number(value).toFixed(2)}`, labels[n] ?? n]
                }}
              />
              {showBB && (
                <>
                  <Area type="monotone" dataKey="bbUpper" stroke="none" fill="hsl(210 50% 50%)" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="bbLower" stroke="none" fill="transparent" />
                  <Line type="monotone" dataKey="bbUpper" stroke="hsl(210 50% 50%)" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                  <Line type="monotone" dataKey="bbLower" stroke="hsl(210 50% 50%)" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                </>
              )}

              {chartMode === 'candle' ? (
                <Bar dataKey="candleBody" shape={<CandlestickShape />} isAnimationActive={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.isGreen ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              ) : (
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                />
              )}

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
              {drawings.map((d) => {
                if (d.type === 'hline') {
                  return (
                    <ReferenceLine
                      key={d.id}
                      y={d.price}
                      stroke={d.color}
                      strokeDasharray="6 3"
                      strokeWidth={1.5}
                      label={{ value: d.label, fontSize: 10, fill: d.color, position: 'right' }}
                    />
                  )
                }
                if (d.type === 'fibonacci') {
                  const fibColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444']
                  return d.levels.map((level, i) => (
                    <ReferenceLine
                      key={`${d.id}-${level.ratio}`}
                      y={level.price}
                      stroke={fibColors[i % fibColors.length]}
                      strokeDasharray="4 2"
                      strokeWidth={1}
                      strokeOpacity={0.7}
                      label={{ value: level.label, fontSize: 9, fill: fibColors[i % fibColors.length], position: 'left' }}
                    />
                  ))
                }
                return null
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ height: '50px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.isGreen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
