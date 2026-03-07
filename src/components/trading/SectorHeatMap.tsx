import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchMultipleQuotes } from '@/services/marketData'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { Loader2, LayoutGrid } from 'lucide-react'

interface SectorTile {
  symbol: string
  name: string
  changePercent: number
  marketCap: number
  sector: string
}

const SECTOR_MAP: Record<string, string> = {
  AAPL: 'Technology', MSFT: 'Technology', NVDA: 'Technology', GOOGL: 'Technology',
  META: 'Technology', AMZN: 'Consumer Cyclical', TSLA: 'Consumer Cyclical',
  AMD: 'Technology', INTC: 'Technology', CRM: 'Technology', ADBE: 'Technology',
  ORCL: 'Technology', AVGO: 'Technology', QCOM: 'Technology', MU: 'Technology',
  ARM: 'Technology', SMCI: 'Technology', CRWD: 'Technology', SNOW: 'Technology',
  PLTR: 'Technology', COIN: 'Financial Services', SOFI: 'Financial Services',
  SQ: 'Financial Services',
  JPM: 'Financial Services', BAC: 'Financial Services', GS: 'Financial Services',
  MS: 'Financial Services', WFC: 'Financial Services', V: 'Financial Services',
  MA: 'Financial Services', C: 'Financial Services',
  JNJ: 'Healthcare', UNH: 'Healthcare', PFE: 'Healthcare', MRK: 'Healthcare',
  ABBV: 'Healthcare', LLY: 'Healthcare', TMO: 'Healthcare',
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy', OXY: 'Energy',
  PG: 'Consumer Defensive', KO: 'Consumer Defensive', PEP: 'Consumer Defensive',
  WMT: 'Consumer Defensive', COST: 'Consumer Defensive',
  DIS: 'Communication Services', NFLX: 'Communication Services', CMCSA: 'Communication Services',
  T: 'Communication Services', VZ: 'Communication Services',
  CAT: 'Industrials', BA: 'Industrials', HON: 'Industrials', UPS: 'Industrials',
  GE: 'Industrials', RTX: 'Industrials',
  RIVN: 'Consumer Cyclical', NKE: 'Consumer Cyclical', HD: 'Consumer Cyclical',
  MCD: 'Consumer Cyclical', SBUX: 'Consumer Cyclical',
  NEE: 'Utilities', DUK: 'Utilities', SO: 'Utilities',
  AMT: 'Real Estate', PLD: 'Real Estate', SPG: 'Real Estate',
  LIN: 'Basic Materials', APD: 'Basic Materials', FCX: 'Basic Materials',
}

const SECTOR_SYMBOLS: Record<string, string[]> = {
  'Technology': ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMD', 'AVGO', 'CRM', 'ADBE', 'INTC'],
  'Financial Services': ['JPM', 'BAC', 'GS', 'V', 'MA', 'MS'],
  'Healthcare': ['JNJ', 'UNH', 'LLY', 'PFE', 'MRK', 'ABBV'],
  'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'NKE', 'MCD'],
  'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'OXY'],
  'Communication Services': ['NFLX', 'DIS', 'CMCSA', 'T', 'VZ'],
  'Industrials': ['CAT', 'BA', 'HON', 'GE', 'RTX'],
  'Consumer Defensive': ['PG', 'KO', 'PEP', 'WMT', 'COST'],
}

type ViewMode = 'market' | 'portfolio'

function getTileColor(pct: number): string {
  if (pct >= 3) return 'rgba(22, 163, 74, 0.9)'
  if (pct >= 2) return 'rgba(22, 163, 74, 0.7)'
  if (pct >= 1) return 'rgba(22, 163, 74, 0.5)'
  if (pct >= 0.25) return 'rgba(22, 163, 74, 0.3)'
  if (pct > -0.25) return 'rgba(100, 100, 100, 0.4)'
  if (pct > -1) return 'rgba(220, 38, 38, 0.3)'
  if (pct > -2) return 'rgba(220, 38, 38, 0.5)'
  if (pct > -3) return 'rgba(220, 38, 38, 0.7)'
  return 'rgba(220, 38, 38, 0.9)'
}

export function SectorHeatMap() {
  const { holdings } = usePortfolioContext()
  const [mode, setMode] = useState<ViewMode>('market')
  const [tiles, setTiles] = useState<SectorTile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'market') {
      const allSymbols = Object.values(SECTOR_SYMBOLS).flat()
      setLoading(true)
      fetchMultipleQuotes(allSymbols)
        .then((quotes) => {
          setTiles(quotes.map((q) => ({
            symbol: q.symbol,
            name: q.name,
            changePercent: q.changePercent,
            marketCap: q.marketCap,
            sector: SECTOR_MAP[q.symbol] ?? 'Other',
          })))
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setTiles(holdings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        changePercent: h.changePercent,
        marketCap: h.marketValue,
        sector: SECTOR_MAP[h.symbol] ?? 'Other',
      })))
    }
  }, [mode, holdings])

  const sectorGroups = useMemo(() => {
    const groups: Record<string, SectorTile[]> = {}
    tiles.forEach((t) => {
      if (!groups[t.sector]) groups[t.sector] = []
      groups[t.sector].push(t)
    })
    // Sort sectors by total market cap
    return Object.entries(groups)
      .map(([sector, items]) => ({
        sector,
        items: items.sort((a, b) => b.marketCap - a.marketCap),
        totalCap: items.reduce((s, i) => s + i.marketCap, 0),
        avgChange: items.reduce((s, i) => s + i.changePercent, 0) / items.length,
      }))
      .sort((a, b) => b.totalCap - a.totalCap)
  }, [tiles])

  const totalCap = sectorGroups.reduce((s, g) => s + g.totalCap, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <LayoutGrid className="h-4 w-4" />
            Sector Heat Map
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={mode === 'market' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setMode('market')}
            >
              Market
            </Button>
            <Button
              variant={mode === 'portfolio' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setMode('portfolio')}
            >
              Portfolio
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {sectorGroups.map((group) => {
              const sectorPct = totalCap > 0 ? (group.totalCap / totalCap) * 100 : 0
              return (
                <div key={group.sector}>
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-xs font-medium">{group.sector}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {sectorPct.toFixed(1)}%
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          color: group.avgChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                          borderColor: group.avgChange >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        {group.avgChange >= 0 ? '+' : ''}{group.avgChange.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {group.items.map((tile) => {
                      const tilePct = group.totalCap > 0 ? (tile.marketCap / group.totalCap) * 100 : 100 / group.items.length
                      return (
                        <div
                          key={tile.symbol}
                          className="flex flex-col items-center justify-center rounded px-1 py-1.5 transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: getTileColor(tile.changePercent),
                            width: `${Math.max(tilePct, 8)}%`,
                            minWidth: '40px',
                          }}
                          title={`${tile.name}\n${tile.changePercent >= 0 ? '+' : ''}${tile.changePercent.toFixed(2)}%`}
                        >
                          <span className="text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {tile.symbol}
                          </span>
                          <span className="text-xs text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {tile.changePercent >= 0 ? '+' : ''}{tile.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
