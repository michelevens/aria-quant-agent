import type { OHLCV, Quote, NewsItem, TimeRange, Interval } from '@/types/market'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function rangeToParams(range: TimeRange): { range: string; interval: Interval } {
  const map: Record<TimeRange, { range: string; interval: Interval }> = {
    '1D': { range: '1d', interval: '5m' },
    '5D': { range: '5d', interval: '15m' },
    '1M': { range: '1mo', interval: '1h' },
    '3M': { range: '3mo', interval: '1d' },
    '6M': { range: '6mo', interval: '1d' },
    '1Y': { range: '1y', interval: '1d' },
    '2Y': { range: '2y', interval: '1wk' },
    '5Y': { range: '5y', interval: '1wk' },
    'MAX': { range: 'max', interval: '1mo' },
  }
  return map[range]
}

export async function fetchHistoricalData(
  symbol: string,
  timeRange: TimeRange = '1Y'
): Promise<OHLCV[]> {
  const { range, interval } = rangeToParams(timeRange)
  const url = `${API_BASE}/market/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${symbol}: ${res.status}`)

  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`No data for ${symbol}`)

  const timestamps: number[] = result.timestamp ?? []
  const quotes = result.indicators?.quote?.[0] ?? {}

  return timestamps.map((ts, i) => ({
    timestamp: ts * 1000,
    date: new Date(ts * 1000).toISOString(),
    open: quotes.open?.[i] ?? 0,
    high: quotes.high?.[i] ?? 0,
    low: quotes.low?.[i] ?? 0,
    close: quotes.close?.[i] ?? 0,
    volume: quotes.volume?.[i] ?? 0,
  })).filter((bar) => bar.close > 0)
}

// Extract quote data from v8 chart endpoint (v6 quote endpoint is deprecated)
function parseChartToQuote(json: Record<string, unknown>, symbol: string): Quote | null {
  const result = (json as { chart?: { result?: Record<string, unknown>[] } }).chart?.result?.[0]
  if (!result) return null

  const meta = result.meta as Record<string, unknown> | undefined
  if (!meta) return null

  const quotesArr = ((result.indicators as Record<string, unknown>)?.quote as Record<string, unknown>[]) ?? []
  const q = quotesArr[0] ?? {}
  const volumes = (q.volume as (number | null)[]) ?? []
  const closes = (q.close as (number | null)[]) ?? []
  const highs = (q.high as (number | null)[]) ?? []
  const lows = (q.low as (number | null)[]) ?? []
  const opens = (q.open as (number | null)[]) ?? []

  const price = (meta.regularMarketPrice as number) ?? closes.filter(Boolean).pop() ?? 0
  const previousClose = (meta.chartPreviousClose as number) ?? (meta.previousClose as number) ?? 0
  const change = previousClose > 0 ? price - previousClose : 0
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

  const totalVolume = volumes.reduce<number>((sum, v) => sum + (v ?? 0), 0)

  return {
    symbol: (meta.symbol as string) ?? symbol,
    name: (meta.shortName as string) ?? (meta.longName as string) ?? symbol,
    price,
    change,
    changePercent,
    open: opens[0] ?? price,
    high: Math.max(...highs.filter((v): v is number => v !== null && v > 0), price),
    low: Math.min(...lows.filter((v): v is number => v !== null && v > 0), price),
    previousClose,
    volume: (meta.regularMarketVolume as number) ?? totalVolume,
    avgVolume: 0,
    marketCap: 0,
    pe: 0,
    eps: 0,
    fiftyTwoWeekHigh: (meta.fiftyTwoWeekHigh as number) ?? 0,
    fiftyTwoWeekLow: (meta.fiftyTwoWeekLow as number) ?? 0,
    exchange: (meta.exchangeName as string) ?? '',
  }
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const url = `${API_BASE}/market/chart?symbol=${encodeURIComponent(symbol)}&range=1d&interval=5m`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`)

  const json = await res.json()
  const quote = parseChartToQuote(json, symbol)
  if (!quote) throw new Error(`No quote data for ${symbol}`)
  return quote
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<Quote[]> {
  // Fetch in parallel batches of 6 to avoid rate limiting
  const batchSize = 6
  const results: Quote[] = []

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    const promises = batch.map(async (symbol) => {
      try {
        return await fetchQuote(symbol)
      } catch {
        return null
      }
    })
    const batchResults = await Promise.all(promises)
    results.push(...batchResults.filter((q): q is Quote => q !== null))
  }

  return results
}

export async function fetchMarketIndices(): Promise<Quote[]> {
  return fetchMultipleQuotes([
    '^GSPC',   // S&P 500
    '^DJI',    // Dow Jones
    '^IXIC',   // Nasdaq
    '^RUT',    // Russell 2000
    '^VIX',    // VIX
    '^TNX',    // 10Y Treasury
    'BTC-USD', // Bitcoin
    'ETH-USD', // Ethereum
  ])
}

function guessSentiment(title: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = title.toLowerCase()
  const bullish = ['surge', 'rally', 'gain', 'jump', 'soar', 'rise', 'bull', 'record', 'beat', 'upgrade', 'buy', 'boom', 'breakout', 'high', 'profit', 'growth', 'recover']
  const bearish = ['crash', 'drop', 'fall', 'plunge', 'sink', 'bear', 'sell', 'loss', 'downgrade', 'decline', 'slump', 'cut', 'fear', 'warn', 'miss', 'risk', 'layoff', 'recession']
  const bScore = bullish.filter((w) => lower.includes(w)).length
  const sScore = bearish.filter((w) => lower.includes(w)).length
  if (bScore > sScore) return 'bullish'
  if (sScore > bScore) return 'bearish'
  return 'neutral'
}

export async function fetchNews(symbols: string[] = []): Promise<NewsItem[]> {
  const query = symbols.length > 0 ? symbols.slice(0, 5).join(',') : 'stock market'
  const url = `${API_BASE}/market/search?q=${encodeURIComponent(query)}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch news')

  const json = await res.json()
  const news = json.news ?? []

  return news.map((item: Record<string, unknown>, i: number) => {
    const title = (item.title ?? '') as string
    const relatedTickers = (item.relatedTickers ?? []) as string[]
    return {
      id: `news-${i}-${Date.now()}`,
      title,
      summary: (item.summary ?? '') as string,
      url: (item.link ?? '#') as string,
      source: (item.publisher ?? 'Unknown') as string,
      publishedAt: ((item.providerPublishTime as number) ?? 0) * 1000,
      relatedSymbols: relatedTickers,
      sentiment: guessSentiment(title),
    }
  })
}
