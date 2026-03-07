import { useMarketIndices } from '@/hooks/useMarketData'
import { MARKET_INDICES } from '@/data/mockData'
import { usePriceTick } from '@/hooks/usePriceTick'

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

function TickerItem({ symbol, value, change, changePercent }: {
  symbol: string
  value: number
  change: number
  changePercent: number
}) {
  const tickClass = usePriceTick(value)

  return (
    <div className={`flex shrink-0 items-center gap-2 rounded px-1.5 py-0.5 ${tickClass}`}>
      <span className="font-medium text-foreground">{symbol}</span>
      <span className="text-muted-foreground">
        {value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
      <span className={change >= 0 ? 'text-emerald-500' : 'text-red-500'}>
        {change >= 0 ? '+' : ''}
        {change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}
        {changePercent.toFixed(2)}%)
      </span>
    </div>
  )
}

export function TickerBar() {
  const { indices, loading } = useMarketIndices()

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
    <div className="flex items-center gap-4 overflow-x-auto border-b border-border bg-card px-4 py-1.5 text-xs">
      {loading && (
        <span className="animate-pulse text-muted-foreground">Loading market data...</span>
      )}
      {displayData.map((idx) => (
        <TickerItem key={idx.symbol} {...idx} />
      ))}
    </div>
  )
}
