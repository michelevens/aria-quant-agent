import { useMarketIndices } from '@/hooks/useMarketData'
import { MARKET_INDICES } from '@/data/mockData'

const DISPLAY_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^DJI': 'Dow',
  '^IXIC': 'Nasdaq',
  '^RUT': 'Russell',
  '^VIX': 'VIX',
  '^TNX': '10Y',
  'BTC-USD': 'BTC',
  'ETH-USD': 'ETH',
}

export function TickerBar() {
  const { indices, loading } = useMarketIndices()

  // Fall back to mock data while loading or on error
  const displayData = indices.length > 0
    ? indices.map((q) => ({
        symbol: DISPLAY_NAMES[q.symbol] ?? q.symbol,
        value: q.price,
        change: q.change,
        changePercent: q.changePercent,
      }))
    : MARKET_INDICES.map((idx) => ({
        symbol: idx.symbol,
        value: idx.value,
        change: idx.change,
        changePercent: idx.changePercent,
      }))

  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-border bg-card px-4 py-2 text-xs">
      {loading && (
        <span className="animate-pulse text-muted-foreground">Loading market data...</span>
      )}
      {displayData.map((idx) => (
        <div key={idx.symbol} className="flex shrink-0 items-center gap-2">
          <span className="font-medium text-foreground">{idx.symbol}</span>
          <span className="text-muted-foreground">
            {idx.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span
            className={idx.change >= 0 ? 'text-emerald-500' : 'text-red-500'}
          >
            {idx.change >= 0 ? '+' : ''}
            {idx.change.toFixed(2)} ({idx.changePercent >= 0 ? '+' : ''}
            {idx.changePercent.toFixed(2)}%)
          </span>
        </div>
      ))}
    </div>
  )
}
