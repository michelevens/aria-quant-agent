import { Card, CardContent } from '@/components/ui/card'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react'

export function PortfolioSummary() {
  const { totals, loading } = usePortfolioContext()

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metrics = [
    {
      label: 'Portfolio Value',
      value: `$${totals.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      subValue: `${totals.positionCount} positions`,
    },
    {
      label: "Today's P&L",
      value: `${totals.dayChange >= 0 ? '+' : ''}$${Math.abs(totals.dayChange).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: Activity,
      subValue: `${totals.dayChangePercent >= 0 ? '+' : ''}${totals.dayChangePercent.toFixed(2)}%`,
      positive: totals.dayChange >= 0,
    },
    {
      label: 'Total Gain/Loss',
      value: `${totals.totalGain >= 0 ? '+' : ''}$${Math.abs(totals.totalGain).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: totals.totalGain >= 0 ? TrendingUp : TrendingDown,
      subValue: `${totals.totalGainPercent >= 0 ? '+' : ''}${totals.totalGainPercent.toFixed(2)}%`,
      positive: totals.totalGain >= 0,
    },
    {
      label: 'Win / Lose',
      value: `${totals.winners} / ${totals.losers}`,
      icon: PieChart,
      subValue: `${totals.positionCount > 0 ? ((totals.winners / totals.positionCount) * 100).toFixed(0) : 0}% win rate`,
    },
    {
      label: 'Buying Power',
      value: `$${totals.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: BarChart3,
      subValue: 'Cash available',
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p
                className={`text-sm font-bold ${
                  m.positive !== undefined
                    ? m.positive
                      ? 'text-emerald-500'
                      : 'text-red-500'
                    : ''
                }`}
              >
                {m.value}
              </p>
              {m.subValue && (
                <p
                  className={`text-xs ${
                    m.positive !== undefined
                      ? m.positive
                        ? 'text-emerald-500'
                        : 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {m.subValue}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
