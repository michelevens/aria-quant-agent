import { Card, CardContent } from '@/components/ui/card'
import { POSITIONS } from '@/data/mockData'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react'

export function PortfolioSummary() {
  const totalValue = POSITIONS.reduce((sum, p) => sum + p.marketValue, 0)
  const totalGain = POSITIONS.reduce((sum, p) => sum + p.totalGain, 0)
  const totalCost = POSITIONS.reduce((sum, p) => sum + p.avgCost * p.quantity, 0)
  const totalGainPct = (totalGain / totalCost) * 100
  const todayChange = POSITIONS.reduce(
    (sum, p) => sum + p.change * p.quantity,
    0
  )
  const todayChangePct = (todayChange / (totalValue - todayChange)) * 100

  const metrics = [
    {
      label: 'Portfolio Value',
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      subValue: null,
    },
    {
      label: "Today's P&L",
      value: `${todayChange >= 0 ? '+' : ''}$${todayChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: Activity,
      subValue: `${todayChangePct >= 0 ? '+' : ''}${todayChangePct.toFixed(2)}%`,
      positive: todayChange >= 0,
    },
    {
      label: 'Total Gain/Loss',
      value: `${totalGain >= 0 ? '+' : ''}$${totalGain.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: totalGain >= 0 ? TrendingUp : TrendingDown,
      subValue: `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`,
      positive: totalGain >= 0,
    },
    {
      label: 'Positions',
      value: POSITIONS.length.toString(),
      icon: PieChart,
      subValue: `${POSITIONS.filter((p) => p.totalGain >= 0).length} winning`,
    },
    {
      label: 'Buying Power',
      value: '$48,250.00',
      icon: BarChart3,
      subValue: 'Available',
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
