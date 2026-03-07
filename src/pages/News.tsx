import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchNews } from '@/services/marketData'
import type { NewsItem } from '@/types/market'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ExternalLink,
  RefreshCw,
  Newspaper,
  X,
} from 'lucide-react'

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Bullish' },
  bearish: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Bearish' },
  neutral: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-accent', label: 'Neutral' },
}

const CATEGORIES = [
  { key: 'portfolio', label: 'My Portfolio' },
  { key: 'market', label: 'Market' },
  { key: 'tech', label: 'Tech' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'earnings', label: 'Earnings' },
] as const

type Category = (typeof CATEGORIES)[number]['key']

function categoryQuery(cat: Category, symbols: string[]): string[] {
  if (cat === 'portfolio') return symbols.slice(0, 5)
  if (cat === 'tech') return ['AAPL', 'MSFT', 'NVDA', 'GOOGL']
  if (cat === 'crypto') return ['BTC-USD', 'ETH-USD']
  if (cat === 'earnings') return ['earnings']
  return []
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

export function News() {
  const { holdings } = usePortfolioContext()
  const [category, setCategory] = useState<Category>('portfolio')
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null)

  const load = (cat: Category) => {
    setLoading(true)
    const syms = categoryQuery(cat, holdings.map((h) => h.symbol))
    fetchNews(syms)
      .then(setNews)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(category) }, [category, holdings.map((h) => h.symbol).join(',')])

  const sentimentCounts = {
    bullish: news.filter((n) => n.sentiment === 'bullish').length,
    bearish: news.filter((n) => n.sentiment === 'bearish').length,
    neutral: news.filter((n) => n.sentiment === 'neutral').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Newspaper className="h-5 w-5" />
          Market News
        </h2>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => load(category)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.key}
            variant={category === cat.key ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {!loading && news.length > 0 && (
        <div className="flex gap-3">
          <Card className="flex-1">
            <CardContent className="flex items-center gap-2 py-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">{sentimentCounts.bullish}</span>
              <span className="text-xs text-muted-foreground">Bullish</span>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="flex items-center gap-2 py-2">
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{sentimentCounts.neutral}</span>
              <span className="text-xs text-muted-foreground">Neutral</span>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="flex items-center gap-2 py-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">{sentimentCounts.bearish}</span>
              <span className="text-xs text-muted-foreground">Bearish</span>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {CATEGORIES.find((c) => c.key === category)?.label} News
            <Badge variant="outline" className="ml-2">{news.length} articles</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Fetching news...</span>
            </div>
          ) : news.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No news available for this category
            </div>
          ) : (
            <ScrollArea style={{ height: '600px' }}>
              <div className="divide-y divide-border">
                {news.map((item) => {
                  const sentiment = sentimentConfig[item.sentiment]
                  const Icon = sentiment.icon
                  return (
                    <button
                      key={item.id}
                      className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/30"
                      onClick={() => setSelectedArticle(item)}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${sentiment.bg}`}>
                        <Icon className={`h-4 w-4 ${sentiment.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{item.title}</p>
                        {item.summary && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{item.source}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.publishedAt > 0 ? timeAgo(item.publishedAt) : ''}
                          </span>
                          <Badge variant="outline" className={`h-4 px-1 text-xs ${sentiment.color}`}>
                            {sentiment.label}
                          </Badge>
                          {item.relatedSymbols.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="h-4 px-1 text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* In-app article reader overlay */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedArticle(null)}>
          <div className="fixed inset-0 bg-black/60" />
          <div
            className="relative z-50 flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reader header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{selectedArticle.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedArticle.source}</span>
                  {selectedArticle.publishedAt > 0 && <span>{timeAgo(selectedArticle.publishedAt)}</span>}
                  {selectedArticle.relatedSymbols.slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="h-4 px-1 text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="ml-3 flex items-center gap-2">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
                >
                  <ExternalLink className="h-3 w-3" /> Open original
                </a>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent"
                  onClick={() => setSelectedArticle(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Embedded content */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={selectedArticle.url}
                title={selectedArticle.title}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
