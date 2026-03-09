import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectorHeatMap } from '@/components/trading/SectorHeatMap'
import { fetchMultipleQuotes } from '@/services/marketData'
import type { Quote } from '@/types/market'
import { LayoutGrid, TrendingUp, TrendingDown } from 'lucide-react'

const INDEX_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM']
const INDEX_LABELS: Record<string, string> = { SPY: 'S&P 500', QQQ: 'Nasdaq 100', DIA: 'Dow Jones', IWM: 'Russell 2000' }

export function HeatMap() {
  const [indices, setIndices] = useState<Quote[]>([])

  useEffect(() => {
    fetchMultipleQuotes(INDEX_SYMBOLS).then(setIndices).catch(() => {})
  }, [])

  const marketStats = useMemo(() => {
    if (indices.length === 0) return null
    const gainers = indices.filter(q => q.changePercent >= 0).length
    const avgChange = indices.reduce((s, q) => s + q.changePercent, 0) / indices.length
    return { gainers, losers: indices.length - gainers, avgChange }
  }, [indices])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <LayoutGrid className="h-5 w-5" />
          Market Heat Map
        </h2>
        {marketStats && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs text-emerald-500" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
              <TrendingUp className="h-3 w-3" /> {marketStats.gainers} Up
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs text-red-500" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <TrendingDown className="h-3 w-3" /> {marketStats.losers} Down
            </Badge>
          </div>
        )}
      </div>

      {/* Index performance cards */}
      {indices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {indices.map((q) => (
            <Card key={q.symbol}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
                  {q.changePercent >= 0
                    ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{INDEX_LABELS[q.symbol] ?? q.symbol}</p>
                  <p className="text-sm font-bold">${q.price.toFixed(2)}</p>
                  <p className={`text-xs font-medium ${q.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SectorHeatMap />
    </div>
  )
}
