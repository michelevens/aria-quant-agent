import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PriceChart } from '@/components/trading/PriceChart'
import { TechnicalPanel } from '@/components/trading/TechnicalPanel'
import { Sparkline } from '@/components/trading/Sparkline'
import { fetchQuote, fetchNews, fetchHistoricalData } from '@/services/marketData'
import type { Quote, NewsItem, OHLCV } from '@/types/market'
import {
  TrendingUp, TrendingDown, Loader2, ArrowLeft, ExternalLink, Newspaper,
  BarChart3, Activity, DollarSign, Minus, Star, StarOff,
} from 'lucide-react'

function formatLargeNumber(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  if (v > 0) return `$${v.toLocaleString()}`
  return '—'
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return v.toLocaleString()
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Bullish' },
  bearish: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Bearish' },
  neutral: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-accent', label: 'Neutral' },
}

function StatRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${className ?? ''}`}>{value}</span>
    </div>
  )
}

export function QuoteDetail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const symbol = (params.get('symbol') ?? 'SPY').toUpperCase()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [history, setHistory] = useState<OHLCV[]>([])
  const [loading, setLoading] = useState(true)
  const [watchlisted, setWatchlisted] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchQuote(symbol).catch(() => null),
      fetchNews([symbol]).catch(() => []),
      fetchHistoricalData(symbol, '1Y').catch(() => []),
    ]).then(([q, n, h]) => {
      setQuote(q)
      setNews(n)
      setHistory(h)
      setLoading(false)
    })

    // Check watchlist
    const wl: string[] = JSON.parse(localStorage.getItem('aria-watchlist-symbols') ?? '[]')
    setWatchlisted(wl.includes(symbol))
  }, [symbol])

  const toggleWatchlist = () => {
    const wl: string[] = JSON.parse(localStorage.getItem('aria-watchlist-symbols') ?? '[]')
    if (watchlisted) {
      const updated = wl.filter((s) => s !== symbol)
      localStorage.setItem('aria-watchlist-symbols', JSON.stringify(updated))
    } else {
      wl.push(symbol)
      localStorage.setItem('aria-watchlist-symbols', JSON.stringify(wl))
    }
    setWatchlisted(!watchlisted)
  }

  const performanceStats = useMemo(() => {
    if (history.length < 2 || !quote) return null
    const now = quote.price
    const findPrice = (daysAgo: number) => {
      const target = Date.now() - daysAgo * 86400000
      const closest = history.reduce((best, h) =>
        Math.abs(h.timestamp - target) < Math.abs(best.timestamp - target) ? h : best
      )
      return closest.close
    }
    const calc = (old: number) => ((now - old) / old * 100)
    return {
      '1W': history.length > 5 ? calc(findPrice(7)) : null,
      '1M': history.length > 20 ? calc(findPrice(30)) : null,
      '3M': history.length > 60 ? calc(findPrice(90)) : null,
      '6M': history.length > 120 ? calc(findPrice(180)) : null,
      '1Y': calc(history[0].close),
      'YTD': (() => {
        const jan1 = new Date(new Date().getFullYear(), 0, 1).getTime()
        const ytdCandle = history.reduce((best, h) =>
          Math.abs(h.timestamp - jan1) < Math.abs(best.timestamp - jan1) ? h : best
        )
        return calc(ytdCandle.close)
      })(),
    }
  }, [history, quote])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading {symbol}...</span>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="py-12 text-center text-sm text-muted-foreground">
          Could not load data for {symbol}
        </div>
      </div>
    )
  }

  const range52 = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow
  const pctInRange = range52 > 0 ? ((quote.price - quote.fiftyTwoWeekLow) / range52) * 100 : 50
  const volRatio = quote.avgVolume > 0 ? (quote.volume / quote.avgVolume) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{symbol}</h1>
              <Badge variant="outline" className="text-xs">{quote.exchange}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{quote.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={toggleWatchlist}>
            {watchlisted ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
            {watchlisted ? 'Remove' : 'Watchlist'}
          </Button>
          <Button size="sm" className="gap-1 text-xs" onClick={() => navigate(`/trade?symbol=${symbol}`)}>
            <DollarSign className="h-3.5 w-3.5" /> Trade
          </Button>
        </div>
      </div>

      {/* Price banner */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 py-4">
          <div>
            <p className="text-3xl font-bold">${quote.price.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-1">
              {quote.changePercent >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-lg font-semibold ${quote.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
          </div>
          <Separator orientation="vertical" className="h-12 hidden sm:block" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-sm font-medium">${quote.open.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High</p>
              <p className="text-sm font-medium">${quote.high.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="text-sm font-medium">${quote.low.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prev Close</p>
              <p className="text-sm font-medium">${quote.previousClose.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart + Technical */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceChart symbol={symbol} />
        </div>
        <TechnicalPanel symbol={symbol} />
      </div>

      {/* Key Stats + Performance + News */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Key Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" /> Key Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <StatRow label="Market Cap" value={formatLargeNumber(quote.marketCap)} />
            <Separator />
            <StatRow label="P/E Ratio" value={quote.pe > 0 ? quote.pe.toFixed(2) : '—'} />
            <Separator />
            <StatRow label="EPS" value={quote.eps !== 0 ? `$${quote.eps.toFixed(2)}` : '—'} />
            <Separator />
            <StatRow label="Volume" value={formatVolume(quote.volume)} />
            <Separator />
            <StatRow label="Avg Volume" value={formatVolume(quote.avgVolume)} />
            <Separator />
            <StatRow
              label="Vol Ratio"
              value={volRatio > 0 ? `${volRatio.toFixed(2)}x` : '—'}
              className={volRatio > 1.5 ? 'text-amber-500' : ''}
            />
            <Separator />
            <StatRow label="52W High" value={`$${quote.fiftyTwoWeekHigh.toFixed(2)}`} />
            <Separator />
            <StatRow label="52W Low" value={`$${quote.fiftyTwoWeekLow.toFixed(2)}`} />
            <Separator />
            <div className="py-2">
              <p className="text-xs text-muted-foreground mb-1.5">52-Week Range</p>
              <div className="flex items-center gap-2">
                <span className="text-xs">${quote.fiftyTwoWeekLow.toFixed(0)}</span>
                <div className="relative flex-1 h-2 rounded-full bg-accent">
                  <div
                    className="absolute top-0 h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, pctInRange))}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-foreground rounded"
                    style={{ left: `${Math.min(100, Math.max(0, pctInRange))}%` }}
                  />
                </div>
                <span className="text-xs">${quote.fiftyTwoWeekHigh.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" /> Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceStats ? (
              <div className="space-y-0">
                {Object.entries(performanceStats).map(([period, pct]) => (
                  pct !== null && (
                    <div key={period}>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-muted-foreground">{period}</span>
                        <div className="flex items-center gap-2">
                          <div className="relative h-1.5 w-20 rounded-full bg-accent">
                            <div
                              className={`absolute top-0 h-1.5 rounded-full ${pct >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{
                                width: `${Math.min(100, Math.abs(pct) * 2)}%`,
                                ...(pct < 0 ? { right: '50%' } : { left: '50%' }),
                              }}
                            />
                          </div>
                          <span className={`text-sm font-medium w-16 text-right ${pct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-muted-foreground">No performance data</p>
            )}

            {/* Day range */}
            {quote.high > 0 && quote.low > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1.5">Today's Range</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs">${quote.low.toFixed(2)}</span>
                  <div className="relative flex-1 h-1.5 rounded-full bg-accent">
                    {(() => {
                      const dayRange = quote.high - quote.low
                      const dayPct = dayRange > 0 ? ((quote.price - quote.low) / dayRange) * 100 : 50
                      return (
                        <div
                          className="absolute top-0 h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${Math.min(100, Math.max(0, dayPct))}%` }}
                        />
                      )
                    })()}
                  </div>
                  <span className="text-xs">${quote.high.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Sparkline */}
            <div className="mt-4 flex justify-center">
              <Sparkline symbol={symbol} width={200} height={50} />
            </div>
          </CardContent>
        </Card>

        {/* Related News */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Newspaper className="h-4 w-4" /> Related News
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0" style={{ maxHeight: '400px' }}>
            {news.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No news available</p>
            ) : (
              <div className="divide-y divide-border">
                {news.slice(0, 10).map((item) => {
                  const sentiment = sentimentConfig[item.sentiment]
                  const Icon = sentiment.icon
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/30"
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${sentiment.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${sentiment.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-tight line-clamp-2">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{item.source}</span>
                          {item.publishedAt > 0 && (
                            <span className="text-xs text-muted-foreground">{timeAgo(item.publishedAt)}</span>
                          )}
                          <Badge variant="outline" className={`h-4 px-1 text-xs ${sentiment.color}`}>
                            {sentiment.label}
                          </Badge>
                        </div>
                      </div>
                      <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
                    </a>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
