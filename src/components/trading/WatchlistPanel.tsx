import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

export function WatchlistPanel() {
  const { watchlistQuotes, watchlistSymbols, loading } = usePortfolioContext()

  const items = watchlistQuotes.length > 0 ? watchlistQuotes : []

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Watchlist
        </h3>
        <span className="text-xs text-muted-foreground">{watchlistSymbols.length} symbols</span>
      </div>
      {loading && items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div
                key={item.symbol}
                className="flex cursor-pointer items-center justify-between px-3 py-2.5 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{item.symbol}</span>
                    {item.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <p className="max-w-24 truncate text-xs text-muted-foreground">{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${item.price.toFixed(2)}</p>
                  <p
                    className={`text-xs ${
                      item.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {item.changePercent >= 0 ? '+' : ''}
                    {item.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
