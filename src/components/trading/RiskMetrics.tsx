import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { useEffect, useState } from 'react'
import { fetchHistoricalData } from '@/services/marketData'
import { dailyReturns, sharpeRatio, sortinoRatio, maxDrawdown, valueAtRisk, beta, alpha, stddev, correlation } from '@/lib/analytics/portfolio'
import type { OHLCV } from '@/types/market'
import { Loader2, ShieldAlert, TrendingUp, BarChart3, Target } from 'lucide-react'

interface RiskData {
  sharpe: number
  sortino: number
  maxDD: number
  var95: number
  var99: number
  volatility: number
  betaVal: number
  alphaVal: number
  correlationSP: number
}

export function RiskMetrics() {
  const { holdings, totals } = usePortfolioContext()
  const [risk, setRisk] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (holdings.length === 0) { setLoading(false); return }

    async function compute() {
      try {
        // Fetch historical data for portfolio and benchmark
        const symbols = holdings.map((h) => h.symbol)
        const historicals = await Promise.all(
          symbols.map((s) => fetchHistoricalData(s, '1Y').catch(() => [] as OHLCV[]))
        )
        const spData = await fetchHistoricalData('^GSPC', '1Y').catch(() => [] as OHLCV[])

        if (spData.length === 0) { setLoading(false); return }

        // Compute weighted portfolio returns
        const totalWeight = holdings.reduce((s, h) => s + h.marketValue, 0)
        const weights = holdings.map((h) => h.marketValue / (totalWeight || 1))

        // Find common length
        const minLen = Math.min(spData.length, ...historicals.map((h) => h.length))
        if (minLen < 30) { setLoading(false); return }

        const portfolioReturns: number[] = []
        for (let i = 1; i < minLen; i++) {
          let dayReturn = 0
          for (let j = 0; j < historicals.length; j++) {
            const data = historicals[j]
            if (data.length >= minLen && data[i - 1].close > 0) {
              const ret = (data[i].close - data[i - 1].close) / data[i - 1].close
              dayReturn += ret * weights[j]
            }
          }
          portfolioReturns.push(dayReturn)
        }

        const benchReturns = dailyReturns(spData.slice(0, minLen))
        const vol = stddev(portfolioReturns) * Math.sqrt(252) * 100

        setRisk({
          sharpe: sharpeRatio(portfolioReturns),
          sortino: sortinoRatio(portfolioReturns),
          maxDD: maxDrawdown(spData.slice(0, minLen)) * 100, // Approx
          var95: valueAtRisk(portfolioReturns, 0.95, totals.totalMarketValue),
          var99: valueAtRisk(portfolioReturns, 0.99, totals.totalMarketValue),
          volatility: vol,
          betaVal: beta(portfolioReturns, benchReturns),
          alphaVal: alpha(portfolioReturns, benchReturns) * 100,
          correlationSP: correlation(portfolioReturns, benchReturns),
        })
      } catch {
        // Silently fail - risk metrics are optional
      } finally {
        setLoading(false)
      }
    }

    compute()
  }, [holdings.map((h) => h.symbol).join(','), totals.totalMarketValue])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Computing risk metrics...</span>
        </CardContent>
      </Card>
    )
  }

  if (!risk) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldAlert className="h-4 w-4" />
          Portfolio Risk Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MetricRow label="Sharpe Ratio" value={risk.sharpe.toFixed(2)} icon={<Target className="h-3 w-3" />}
            status={risk.sharpe > 1 ? 'good' : risk.sharpe > 0.5 ? 'ok' : 'bad'} />
          <MetricRow label="Sortino Ratio" value={risk.sortino.toFixed(2)} icon={<Target className="h-3 w-3" />}
            status={risk.sortino > 1.5 ? 'good' : risk.sortino > 0.5 ? 'ok' : 'bad'} />
          <MetricRow label="Beta (vs S&P)" value={risk.betaVal.toFixed(2)} icon={<TrendingUp className="h-3 w-3" />}
            status={risk.betaVal < 1.2 ? 'good' : 'bad'} />
          <MetricRow label="Alpha (ann.)" value={`${risk.alphaVal >= 0 ? '+' : ''}${risk.alphaVal.toFixed(1)}%`} icon={<TrendingUp className="h-3 w-3" />}
            status={risk.alphaVal > 0 ? 'good' : 'bad'} />
          <MetricRow label="Volatility (ann.)" value={`${risk.volatility.toFixed(1)}%`} icon={<BarChart3 className="h-3 w-3" />}
            status={risk.volatility < 25 ? 'good' : risk.volatility < 40 ? 'ok' : 'bad'} />
          <MetricRow label="S&P Correlation" value={risk.correlationSP.toFixed(2)} icon={<BarChart3 className="h-3 w-3" />} />
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Value at Risk</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-red-500/10 px-3 py-2">
              <span className="text-muted-foreground">1-Day VaR (95%)</span>
              <p className="text-sm font-bold text-red-400">
                -${risk.var95.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-md bg-red-500/10 px-3 py-2">
              <span className="text-muted-foreground">1-Day VaR (99%)</span>
              <p className="text-sm font-bold text-red-400">
                -${risk.var99.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Risk Rating</span>
          <Badge
            className={
              risk.volatility < 20
                ? 'bg-emerald-600 text-xs'
                : risk.volatility < 35
                ? 'bg-yellow-600 text-xs'
                : 'bg-red-600 text-xs'
            }
          >
            {risk.volatility < 20 ? 'Conservative' : risk.volatility < 35 ? 'Moderate' : 'Aggressive'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricRow({
  label,
  value,
  icon,
  status,
}: {
  label: string
  value: string
  icon: React.ReactNode
  status?: 'good' | 'ok' | 'bad'
}) {
  const color = status === 'good' ? 'text-emerald-400' : status === 'bad' ? 'text-red-400' : status === 'ok' ? 'text-yellow-400' : 'text-foreground'

  return (
    <div className="flex items-center justify-between rounded-md bg-accent/30 px-2 py-1.5">
      <span className="flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={`font-mono font-medium ${color}`}>{value}</span>
    </div>
  )
}
