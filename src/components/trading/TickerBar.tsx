import { MARKET_INDICES } from '@/data/mockData'

export function TickerBar() {
  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-border bg-card px-4 py-2 text-xs">
      {MARKET_INDICES.map((idx) => (
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
