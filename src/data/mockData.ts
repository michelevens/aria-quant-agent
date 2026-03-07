export interface Position {
  symbol: string
  name: string
  quantity: number
  avgCost: number
  currentPrice: number
  change: number
  changePercent: number
  marketValue: number
  totalGain: number
  totalGainPercent: number
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  high: number
  low: number
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

export interface TradeOrder {
  id: string
  time: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: string
  quantity: number
  price: number
  status: 'FILLED' | 'PENDING' | 'CANCELLED' | 'PARTIAL'
}

export interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  symbol?: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

export interface ChartDataPoint {
  time: string
  price: number
  volume: number
}

export const MARKET_INDICES: MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 5248.72, change: 32.45, changePercent: 0.62 },
  { symbol: 'DJI', name: 'Dow Jones', value: 39782.15, change: 148.92, changePercent: 0.38 },
  { symbol: 'COMP', name: 'Nasdaq', value: 16428.82, change: 98.67, changePercent: 0.60 },
  { symbol: 'RUT', name: 'Russell 2000', value: 2085.34, change: -12.45, changePercent: -0.59 },
  { symbol: 'VIX', name: 'VIX', value: 14.32, change: -0.89, changePercent: -5.85 },
  { symbol: 'TNX', name: '10Y Treasury', value: 4.287, change: 0.023, changePercent: 0.54 },
  { symbol: 'BTC', name: 'Bitcoin', value: 87245.30, change: 1245.80, changePercent: 1.45 },
  { symbol: 'ETH', name: 'Ethereum', value: 3142.65, change: -28.40, changePercent: -0.90 },
]

export const POSITIONS: Position[] = [
  { symbol: 'AAPL', name: 'Apple Inc', quantity: 150, avgCost: 172.50, currentPrice: 189.84, change: 2.14, changePercent: 1.14, marketValue: 28476.00, totalGain: 2601.00, totalGainPercent: 10.05 },
  { symbol: 'MSFT', name: 'Microsoft Corp', quantity: 80, avgCost: 378.20, currentPrice: 422.86, change: -1.32, changePercent: -0.31, marketValue: 33828.80, totalGain: 3572.80, totalGainPercent: 11.80 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', quantity: 200, avgCost: 485.60, currentPrice: 878.37, change: 18.42, changePercent: 2.14, marketValue: 175674.00, totalGain: 78554.00, totalGainPercent: 80.86 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', quantity: 120, avgCost: 138.45, currentPrice: 155.72, change: 0.89, changePercent: 0.57, marketValue: 18686.40, totalGain: 2072.40, totalGainPercent: 12.48 },
  { symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 90, avgCost: 145.80, currentPrice: 182.41, change: 3.21, changePercent: 1.79, marketValue: 16416.90, totalGain: 3294.90, totalGainPercent: 25.10 },
  { symbol: 'META', name: 'Meta Platforms', quantity: 60, avgCost: 325.40, currentPrice: 502.30, change: -4.56, changePercent: -0.90, marketValue: 30138.00, totalGain: 10614.00, totalGainPercent: 54.37 },
  { symbol: 'TSLA', name: 'Tesla Inc', quantity: 100, avgCost: 248.90, currentPrice: 175.22, change: -8.34, changePercent: -4.54, marketValue: 17522.00, totalGain: -7368.00, totalGainPercent: -29.60 },
  { symbol: 'JPM', name: 'JPMorgan Chase', quantity: 75, avgCost: 168.30, currentPrice: 198.47, change: 1.23, changePercent: 0.62, marketValue: 14885.25, totalGain: 2262.75, totalGainPercent: 17.92 },
]

export const WATCHLIST: WatchlistItem[] = [
  { symbol: 'AMD', name: 'AMD Inc', price: 164.28, change: 3.42, changePercent: 2.13, volume: '42.8M', high: 166.10, low: 160.22 },
  { symbol: 'PLTR', name: 'Palantir', price: 24.56, change: 0.89, changePercent: 3.76, volume: '68.2M', high: 25.10, low: 23.80 },
  { symbol: 'SOFI', name: 'SoFi Technologies', price: 8.42, change: -0.18, changePercent: -2.09, volume: '28.5M', high: 8.72, low: 8.35 },
  { symbol: 'COIN', name: 'Coinbase', price: 225.84, change: 8.92, changePercent: 4.11, volume: '12.4M', high: 228.50, low: 216.30 },
  { symbol: 'RIVN', name: 'Rivian', price: 12.34, change: -0.56, changePercent: -4.34, volume: '18.9M', high: 13.10, low: 12.18 },
  { symbol: 'SQ', name: 'Block Inc', price: 78.92, change: 1.45, changePercent: 1.87, volume: '8.7M', high: 79.80, low: 77.10 },
  { symbol: 'CRWD', name: 'CrowdStrike', price: 312.45, change: -5.67, changePercent: -1.78, volume: '4.2M', high: 320.10, low: 310.20 },
  { symbol: 'SNOW', name: 'Snowflake', price: 162.38, change: 2.14, changePercent: 1.34, volume: '5.8M', high: 164.50, low: 159.80 },
]

export const RECENT_ORDERS: TradeOrder[] = [
  { id: 'ORD-001', time: '09:32:14', symbol: 'NVDA', side: 'BUY', type: 'LIMIT', quantity: 50, price: 862.50, status: 'FILLED' },
  { id: 'ORD-002', time: '09:45:28', symbol: 'AAPL', side: 'BUY', type: 'MARKET', quantity: 25, price: 189.84, status: 'FILLED' },
  { id: 'ORD-003', time: '10:12:45', symbol: 'TSLA', side: 'SELL', type: 'LIMIT', quantity: 30, price: 178.00, status: 'PENDING' },
  { id: 'ORD-004', time: '10:28:33', symbol: 'META', side: 'BUY', type: 'LIMIT', quantity: 15, price: 498.50, status: 'PARTIAL' },
  { id: 'ORD-005', time: '11:05:19', symbol: 'AMD', side: 'BUY', type: 'MARKET', quantity: 100, price: 164.28, status: 'FILLED' },
  { id: 'ORD-006', time: '11:22:08', symbol: 'GOOGL', side: 'SELL', type: 'STOP', quantity: 40, price: 152.00, status: 'CANCELLED' },
]

export const NEWS_FEED: NewsItem[] = [
  { id: '1', title: 'NVIDIA Reports Record Q4 Revenue of $22.1B, Beating Estimates', source: 'Reuters', time: '2m ago', symbol: 'NVDA', sentiment: 'bullish' },
  { id: '2', title: 'Fed Officials Signal Patience on Rate Cuts Amid Sticky Inflation', source: 'Bloomberg', time: '15m ago', sentiment: 'bearish' },
  { id: '3', title: 'Apple Vision Pro Sales Disappoint in First Quarter', source: 'WSJ', time: '28m ago', symbol: 'AAPL', sentiment: 'bearish' },
  { id: '4', title: 'Amazon Web Services Launches New AI Infrastructure Services', source: 'CNBC', time: '45m ago', symbol: 'AMZN', sentiment: 'bullish' },
  { id: '5', title: 'Tesla Cuts Prices in China Amid Growing BYD Competition', source: 'FT', time: '1h ago', symbol: 'TSLA', sentiment: 'bearish' },
  { id: '6', title: 'Bitcoin Surges Past $87K as Institutional Demand Accelerates', source: 'CoinDesk', time: '1h ago', symbol: 'BTC', sentiment: 'bullish' },
  { id: '7', title: 'JPMorgan Raises S&P 500 Year-End Target to 5,600', source: 'MarketWatch', time: '2h ago', sentiment: 'bullish' },
  { id: '8', title: 'Meta Unveils Llama 4 with Breakthrough Multimodal Capabilities', source: 'TechCrunch', time: '2h ago', symbol: 'META', sentiment: 'bullish' },
]

export function generateChartData(days: number = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  let price = 175
  const now = Date.now()
  const interval = (days * 24 * 60 * 60 * 1000) / (days * 8)

  for (let i = 0; i < days * 8; i++) {
    const time = new Date(now - (days * 8 - i) * interval)
    price += (Math.random() - 0.48) * 3
    price = Math.max(price, 140)
    data.push({
      time: time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000 + 10000000),
    })
  }
  return data
}

export function generateIntradayData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  let price = 878
  for (let hour = 9; hour <= 16; hour++) {
    for (let min = 0; min < 60; min += 5) {
      if (hour === 9 && min < 30) continue
      if (hour === 16 && min > 0) continue
      price += (Math.random() - 0.48) * 2
      data.push({
        time: `${hour}:${min.toString().padStart(2, '0')}`,
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 2000000 + 500000),
      })
    }
  }
  return data
}
