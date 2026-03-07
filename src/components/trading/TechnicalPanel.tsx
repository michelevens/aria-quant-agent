import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTechnicalAnalysis } from '@/hooks/useMarketData'
import { Loader2, Target, TrendingUp, TrendingDown, Activity } from 'lucide-react'

export function TechnicalPanel({ symbol = 'NVDA' }: { symbol?: string }) {
  const { indicators, signal, loading } = useTechnicalAnalysis(symbol, '3M')

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!indicators || !signal) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Technical Analysis — {symbol}</span>
          <Badge
            className={`text-xs ${
              signal.type === 'BUY'
                ? 'bg-emerald-600'
                : signal.type === 'SELL'
                ? 'bg-red-600'
                : 'bg-yellow-600'
            }`}
          >
            {signal.type} · {signal.strength}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Signal Details */}
        <div className="rounded-md bg-accent/50 p-3 text-sm">
          <p className="mb-2 font-medium">{signal.reason}</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Entry</span>
              <p className="font-medium">${signal.price.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Stop Loss</span>
              <p className="font-medium text-red-400">${signal.stopLoss.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Take Profit</span>
              <p className="font-medium text-emerald-400">${signal.takeProfit.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            Risk/Reward: {signal.riskReward.toFixed(1)}:1
          </div>
        </div>

        <Separator />

        {/* Momentum */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Momentum</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <IndicatorRow
              label="RSI (14)"
              value={indicators.rsi14.toFixed(1)}
              status={indicators.rsi14 > 70 ? 'overbought' : indicators.rsi14 < 30 ? 'oversold' : 'neutral'}
            />
            <IndicatorRow
              label="Stochastic %K"
              value={indicators.stochastic.k.toFixed(1)}
              status={indicators.stochastic.k > 80 ? 'overbought' : indicators.stochastic.k < 20 ? 'oversold' : 'neutral'}
            />
            <IndicatorRow
              label="MACD"
              value={indicators.macd.macd.toFixed(2)}
              status={indicators.macd.histogram > 0 ? 'bullish' : 'bearish'}
            />
            <IndicatorRow
              label="MACD Signal"
              value={indicators.macd.signal.toFixed(2)}
              status={indicators.macd.macd > indicators.macd.signal ? 'bullish' : 'bearish'}
            />
          </div>
        </div>

        <Separator />

        {/* Trend */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Trend</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <IndicatorRow label="SMA 20" value={`$${indicators.sma20.toFixed(2)}`} />
            <IndicatorRow label="SMA 50" value={`$${indicators.sma50.toFixed(2)}`} />
            <IndicatorRow label="SMA 200" value={`$${indicators.sma200.toFixed(2)}`} />
            <IndicatorRow
              label="ADX (14)"
              value={indicators.adx14.toFixed(1)}
              status={indicators.adx14 > 25 ? 'strong' : 'weak'}
            />
          </div>
        </div>

        <Separator />

        {/* Volatility */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Volatility</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <IndicatorRow label="ATR (14)" value={indicators.atr14.toFixed(2)} />
            <IndicatorRow label="BB Upper" value={`$${indicators.bollingerBands.upper.toFixed(2)}`} />
            <IndicatorRow label="BB Lower" value={`$${indicators.bollingerBands.lower.toFixed(2)}`} />
            <IndicatorRow label="VWAP" value={`$${indicators.vwap.toFixed(2)}`} />
          </div>
        </div>

        <Separator />

        {/* Support / Resistance */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Levels</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <IndicatorRow label="Support" value={`$${indicators.support.toFixed(2)}`} icon="support" />
            <IndicatorRow label="Resistance" value={`$${indicators.resistance.toFixed(2)}`} icon="resistance" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IndicatorRow({
  label,
  value,
  status,
  icon,
}: {
  label: string
  value: string
  status?: string
  icon?: string
}) {
  const statusColors: Record<string, string> = {
    bullish: 'text-emerald-400',
    bearish: 'text-red-400',
    overbought: 'text-red-400',
    oversold: 'text-emerald-400',
    strong: 'text-blue-400',
    weak: 'text-muted-foreground',
    neutral: 'text-foreground',
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-accent/30 px-2 py-1.5">
      <span className="flex items-center gap-1 text-muted-foreground">
        {icon === 'support' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
        {icon === 'resistance' && <TrendingDown className="h-3 w-3 text-red-400" />}
        {!icon && <Activity className="h-3 w-3" />}
        {label}
      </span>
      <span className={`font-mono font-medium ${status ? statusColors[status] ?? '' : ''}`}>
        {value}
      </span>
    </div>
  )
}
