import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortfolioSummary } from '@/components/trading/PortfolioSummary'
import { PositionsTable } from '@/components/trading/PositionsTable'
import { RiskMetrics } from '@/components/trading/RiskMetrics'
import { CorrelationHeatmap } from '@/components/trading/CorrelationHeatmap'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = [
  'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(35, 80%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 65%, 55%)',
  'hsl(190, 70%, 50%)',
  'hsl(60, 60%, 50%)',
  'hsl(330, 60%, 55%)',
]

export function Portfolio() {
  const { holdings } = usePortfolioContext()

  const allocationData = holdings.map((h) => ({
    name: h.symbol,
    value: h.marketValue,
  }))

  return (
    <div className="space-y-4">
      <PortfolioSummary />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Holdings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PositionsTable />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 10%)',
                        border: '1px solid hsl(0 0% 20%)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        'Value',
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value: string) => (
                        <span style={{ color: 'hsl(0 0% 70%)' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <RiskMetrics />
        </div>
      </div>

      <CorrelationHeatmap />
    </div>
  )
}
