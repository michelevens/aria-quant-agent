import { PriceChart } from '@/components/trading/PriceChart'

export function Charts() {
  return (
    <div className="grid h-full gap-4 lg:grid-cols-2">
      <PriceChart symbol="NVDA" />
      <PriceChart symbol="AAPL" />
      <PriceChart symbol="MSFT" />
      <PriceChart symbol="TSLA" />
    </div>
  )
}
