import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Minus, Loader2, ExternalLink } from 'lucide-react'
import { fetchNews } from '@/services/marketData'
import type { NewsItem } from '@/types/market'

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  bearish: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
  neutral: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-accent' },
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

export function NewsFeed({ symbols = [] }: { symbols?: string[] }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchNews(symbols)
      .then(setNews)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [symbols.join(',')])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading news...</span>
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No news available
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {news.map((item) => {
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
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${sentiment.bg}`}
              >
                <Icon className={`h-3.5 w-3.5 ${sentiment.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight">{item.title}</p>
                {item.summary && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {item.summary}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.publishedAt > 0 ? timeAgo(item.publishedAt) : ''}
                  </span>
                  {item.relatedSymbols.slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="h-4 px-1 text-xs">
                      {s}
                    </Badge>
                  ))}
                  <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </ScrollArea>
  )
}
