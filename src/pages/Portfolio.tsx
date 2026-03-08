import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioSummary } from '@/components/trading/PortfolioSummary'
import { exportToCSV, importCSVFile } from '@/lib/csv'
import { Download, Upload, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { isAlpacaConnected } from '@/services/alpaca'
import { toast } from 'sonner'
import { PositionsTable } from '@/components/trading/PositionsTable'
import { RiskMetrics } from '@/components/trading/RiskMetrics'
import { CorrelationHeatmap } from '@/components/trading/CorrelationHeatmap'
import { EquityCurve } from '@/components/trading/EquityCurve'
import { Rebalancer } from '@/components/trading/Rebalancer'
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
  const { holdings, addHolding, alpacaSynced, syncAlpacaPortfolio } = usePortfolioContext()
  const alpacaLive = isAlpacaConnected()

  const handleImportCSV = async () => {
    const rows = await importCSVFile()
    if (rows.length === 0) return
    let imported = 0
    for (const row of rows) {
      const symbol = (row.Symbol ?? row.symbol ?? '').toUpperCase().trim()
      const quantity = parseFloat(row.Quantity ?? row.quantity ?? '0')
      const avgCost = parseFloat(row.AvgCost ?? row.avgCost ?? row.avg_cost ?? row.Cost ?? row.cost ?? '0')
      if (symbol && quantity > 0 && avgCost > 0) {
        addHolding({ symbol, quantity, avgCost })
        imported++
      }
    }
    if (imported > 0) {
      toast.success(`Imported ${imported} holding${imported > 1 ? 's' : ''} from CSV`)
    } else {
      toast.error('No valid holdings found. CSV needs Symbol, Quantity, and AvgCost columns.')
    }
  }

  const allocationData = holdings.map((h) => ({
    name: h.symbol,
    value: h.marketValue,
  }))

  const handleExportPortfolio = () => {
    exportToCSV(
      holdings.map((h) => ({
        Symbol: h.symbol,
        Name: h.name,
        Quantity: h.quantity,
        AvgCost: h.avgCost.toFixed(2),
        CurrentPrice: h.currentPrice.toFixed(2),
        MarketValue: h.marketValue.toFixed(2),
        TotalGain: h.totalGain.toFixed(2),
        TotalGainPct: h.totalGainPercent.toFixed(2),
        Weight: h.weight.toFixed(2),
        DayChange: h.changePercent.toFixed(2),
      })),
      `aria-portfolio-${new Date().toISOString().slice(0, 10)}`
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PortfolioSummary />
        <div className="flex items-center gap-2">
          {alpacaLive && (
            <>
              <Badge variant="outline" className="h-5 px-1.5 text-xs" style={{
                color: alpacaSynced ? '#10b981' : '#6b7280',
                borderColor: alpacaSynced ? '#10b981' : '#6b7280',
              }}>
                {alpacaSynced ? 'LIVE' : 'LOCAL'}
              </Badge>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => syncAlpacaPortfolio()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Sync
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleImportCSV}>
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleExportPortfolio}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span> CSV
          </Button>
        </div>
      </div>
      <EquityCurve />

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

      <Rebalancer />
      <CorrelationHeatmap />
    </div>
  )
}
