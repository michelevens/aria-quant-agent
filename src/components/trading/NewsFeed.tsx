import { NEWS_FEED } from '@/data/mockData'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  bearish: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
  neutral: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-accent' },
}

export function NewsFeed() {
  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {NEWS_FEED.map((item) => {
          const sentiment = sentimentConfig[item.sentiment]
          const Icon = sentiment.icon
          return (
            <div
              key={item.id}
              className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/30"
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${sentiment.bg}`}
              >
                <Icon className={`h-3.5 w-3.5 ${sentiment.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight">{item.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                  {item.symbol && (
                    <Badge variant="outline" className="h-4 px-1 text-xs">
                      {item.symbol}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
