import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchMultipleQuotes } from '@/services/marketData'
import { useRealtimeSimulator } from '@/hooks/useRealtimeSimulator'
import type { Quote } from '@/types/market'
import {
  TrendingUp, TrendingDown, RefreshCw, Loader2, Star, Globe, Gem, Fuel, Wheat,
} from 'lucide-react'

const FX_PAIRS = [
  'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X',
  'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X',
]

const COMMODITIES = [
  'GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'PL=F',
]

const INDICES = [
  'ES=F', 'NQ=F', 'YM=F', 'RTY=F',
]

const FX_LABELS: Record<string, { name: string; flag: string }> = {
  'EURUSD=X': { name: 'EUR/USD', flag: 'Euro / US Dollar' },
  'GBPUSD=X': { name: 'GBP/USD', flag: 'British Pound / US Dollar' },
  'USDJPY=X': { name: 'USD/JPY', flag: 'US Dollar / Japanese Yen' },
  'USDCHF=X': { name: 'USD/CHF', flag: 'US Dollar / Swiss Franc' },
  'AUDUSD=X': { name: 'AUD/USD', flag: 'Australian Dollar / US Dollar' },
  'USDCAD=X': { name: 'USD/CAD', flag: 'US Dollar / Canadian Dollar' },
  'NZDUSD=X': { name: 'NZD/USD', flag: 'New Zealand Dollar / US Dollar' },
  'EURGBP=X': { name: 'EUR/GBP', flag: 'Euro / British Pound' },
  'EURJPY=X': { name: 'EUR/JPY', flag: 'Euro / Japanese Yen' },
  'GBPJPY=X': { name: 'GBP/JPY', flag: 'British Pound / Japanese Yen' },
}

const COMMODITY_LABELS: Record<string, { name: string; unit: string }> = {
  'GC=F': { name: 'Gold', unit: '/oz' },
  'SI=F': { name: 'Silver', unit: '/oz' },
  'CL=F': { name: 'Crude Oil (WTI)', unit: '/bbl' },
  'NG=F': { name: 'Natural Gas', unit: '/MMBtu' },
  'HG=F': { name: 'Copper', unit: '/lb' },
  'PL=F': { name: 'Platinum', unit: '/oz' },
}

const INDEX_LABELS: Record<string, string> = {
  'ES=F': 'S&P 500 Futures',
  'NQ=F': 'Nasdaq 100 Futures',
  'YM=F': 'Dow Jones Futures',
  'RTY=F': 'Russell 2000 Futures',
}

type Tab = 'forex' | 'commodities' | 'futures'

export function ForexCommodities() {
  const [tab, setTab] = useState<Tab>('forex')
  const [loading, setLoading] = useState(true)
  const [fxQuotes, setFxQuotes] = useState<Quote[]>([])
  const [commodityQuotes, setCommodityQuotes] = useState<Quote[]>([])
  const [indexQuotes, setIndexQuotes] = useState<Quote[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('aria-forex-favorites')
      return raw ? new Set(JSON.parse(raw)) : new Set<string>()
    } catch { return new Set<string>() }
  })

  const liveFx = useRealtimeSimulator(fxQuotes, 3000, fxQuotes.length > 0)
  const liveCommodities = useRealtimeSimulator(commodityQuotes, 3000, commodityQuotes.length > 0)
  const liveIndices = useRealtimeSimulator(indexQuotes, 3000, indexQuotes.length > 0)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetchMultipleQuotes(FX_PAIRS).then(setFxQuotes).catch(() => {}),
      fetchMultipleQuotes(COMMODITIES).then(setCommodityQuotes).catch(() => {}),
      fetchMultipleQuotes(INDICES).then(setIndexQuotes).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleFav = (symbol: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      localStorage.setItem('aria-forex-favorites', JSON.stringify([...next]))
      return next
    })
  }

  const sortedFx = useMemo(() =>
    [...liveFx].sort((a, b) => (favorites.has(b.symbol) ? 1 : 0) - (favorites.has(a.symbol) ? 1 : 0)),
    [liveFx, favorites]
  )

  const sortedCommodities = useMemo(() =>
    [...liveCommodities].sort((a, b) => (favorites.has(b.symbol) ? 1 : 0) - (favorites.has(a.symbol) ? 1 : 0)),
    [liveCommodities, favorites]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Globe className="h-5 w-5" />
          Forex & Commodities
        </h2>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="forex" className="gap-1 text-xs">
            <Globe className="h-3.5 w-3.5" /> Forex ({liveFx.length})
          </TabsTrigger>
          <TabsTrigger value="commodities" className="gap-1 text-xs">
            <Gem className="h-3.5 w-3.5" /> Commodities ({liveCommodities.length})
          </TabsTrigger>
          <TabsTrigger value="futures" className="gap-1 text-xs">
            <Fuel className="h-3.5 w-3.5" /> Futures ({liveIndices.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading market data...</span>
        </div>
      )}

      {!loading && tab === 'forex' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedFx.map((q) => {
            const info = FX_LABELS[q.symbol]
            return (
              <Card key={q.symbol} className="transition-all hover:shadow-md">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFav(q.symbol)} className="transition-transform hover:scale-110">
                        <Star className={`h-4 w-4 ${favorites.has(q.symbol) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                      </button>
                      <div>
                        <p className="text-sm font-bold">{info?.name ?? q.symbol}</p>
                        <p className="text-xs text-muted-foreground">{info?.flag ?? ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{q.price.toFixed(4)}</p>
                      <div className="flex items-center justify-end gap-1">
                        {q.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${q.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                    <span>H: {q.high.toFixed(4)}</span>
                    <span>L: {q.low.toFixed(4)}</span>
                    <span>Chg: {q.change >= 0 ? '+' : ''}{q.change.toFixed(4)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {sortedFx.length === 0 && (
            <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No forex data available</p>
          )}
        </div>
      )}

      {!loading && tab === 'commodities' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCommodities.map((q) => {
            const info = COMMODITY_LABELS[q.symbol]
            const icon = q.symbol === 'GC=F' || q.symbol === 'SI=F' || q.symbol === 'PL=F' ? Gem
              : q.symbol === 'CL=F' || q.symbol === 'NG=F' ? Fuel
              : Wheat
            const Icon = icon
            return (
              <Card key={q.symbol} className="transition-all hover:shadow-md">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFav(q.symbol)} className="transition-transform hover:scale-110">
                        <Star className={`h-4 w-4 ${favorites.has(q.symbol) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                      </button>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{info?.name ?? q.symbol}</p>
                        <p className="text-xs text-muted-foreground">{info?.unit ?? ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${q.price.toFixed(2)}</p>
                      <div className="flex items-center justify-end gap-1">
                        {q.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${q.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                    <span>H: ${q.high.toFixed(2)}</span>
                    <span>L: ${q.low.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">{q.changePercent >= 0 ? '+' : ''}{q.change.toFixed(2)}</Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {sortedCommodities.length === 0 && (
            <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No commodities data available</p>
          )}
        </div>
      )}

      {!loading && tab === 'futures' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {liveIndices.map((q) => {
            const name = INDEX_LABELS[q.symbol] ?? q.symbol
            return (
              <Card key={q.symbol} className="transition-all hover:shadow-md">
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{name}</p>
                      <p className="text-xs text-muted-foreground">{q.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{q.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <div className="flex items-center justify-end gap-1">
                        {q.changePercent >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${q.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}% ({q.change >= 0 ? '+' : ''}{q.change.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span>High: {q.high.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span>Low: {q.low.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {liveIndices.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">No futures data available</p>
          )}
        </div>
      )}
    </div>
  )
}
