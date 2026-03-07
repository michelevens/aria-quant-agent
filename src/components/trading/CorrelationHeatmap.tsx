import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchHistoricalData } from '@/services/marketData'
import { dailyReturns, correlationMatrix } from '@/lib/analytics/portfolio'
import type { CorrelationMatrix } from '@/types/market'
import { Loader2, Grid3X3 } from 'lucide-react'

function getColor(val: number): string {
  if (val >= 0.8) return 'bg-emerald-600'
  if (val >= 0.5) return 'bg-emerald-700'
  if (val >= 0.2) return 'bg-emerald-900'
  if (val >= -0.2) return 'bg-zinc-800'
  if (val >= -0.5) return 'bg-red-900'
  if (val >= -0.8) return 'bg-red-700'
  return 'bg-red-600'
}

export function CorrelationHeatmap() {
  const { holdings } = usePortfolioContext()
  const [matrix, setMatrix] = useState<CorrelationMatrix | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (holdings.length < 2) { setLoading(false); return }

    async function compute() {
      try {
        const symbols = holdings.slice(0, 8).map((h) => h.symbol)
        const allData = await Promise.all(
          symbols.map((s) => fetchHistoricalData(s, '6M').catch(() => []))
        )

        const returnsSets = allData.map((d) => dailyReturns(d))
        const cm = correlationMatrix(symbols, returnsSets)
        setMatrix(cm)
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    compute()
  }, [holdings.map((h) => h.symbol).join(',')])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Computing correlations...</span>
        </CardContent>
      </Card>
    )
  }

  if (!matrix) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Grid3X3 className="h-4 w-4" />
          Correlation Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-1"></th>
                {matrix.symbols.map((s) => (
                  <th key={s} className="p-1 text-center font-medium text-muted-foreground">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.symbols.map((row, i) => (
                <tr key={row}>
                  <td className="p-1 font-medium text-muted-foreground">{row}</td>
                  {matrix.matrix[i].map((val, j) => (
                    <td key={j} className="p-1">
                      <div
                        className={`flex h-8 items-center justify-center rounded text-xs font-mono ${getColor(val)} ${i === j ? 'opacity-50' : ''}`}
                      >
                        {val.toFixed(2)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-red-600" /> -1.0
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-zinc-800" /> 0.0
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-emerald-600" /> +1.0
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
