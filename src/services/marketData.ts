import type { OHLCV, Quote, NewsItem, TimeRange, Interval } from '@/types/market'

const PROXY = 'https://corsproxy.io/?url='
const YAHOO_BASE = 'https://query1.finance.yahoo.com'

function buildYahooUrl(path: string): string {
  return `${PROXY}${encodeURIComponent(`${YAHOO_BASE}${path}`)}`
}

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
  const url = buildYahooUrl(
    `/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&includePrePost=false`
  )

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

export async function fetchQuote(symbol: string): Promise<Quote> {
  const url = buildYahooUrl(
    `/v6/finance/quote?symbols=${symbol}`
  )

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`)

  const json = await res.json()
  const q = json.quoteResponse?.result?.[0]
  if (!q) throw new Error(`No quote data for ${symbol}`)

  return {
    symbol: q.symbol,
    name: q.shortName ?? q.longName ?? symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    open: q.regularMarketOpen ?? 0,
    high: q.regularMarketDayHigh ?? 0,
    low: q.regularMarketDayLow ?? 0,
    previousClose: q.regularMarketPreviousClose ?? 0,
    volume: q.regularMarketVolume ?? 0,
    avgVolume: q.averageDailyVolume3Month ?? 0,
    marketCap: q.marketCap ?? 0,
    pe: q.trailingPE ?? 0,
    eps: q.epsTrailingTwelveMonths ?? 0,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
    exchange: q.exchange ?? '',
  }
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<Quote[]> {
  const url = buildYahooUrl(
    `/v6/finance/quote?symbols=${symbols.join(',')}`
  )

  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch quotes')

  const json = await res.json()
  const results = json.quoteResponse?.result ?? []

  return results.map((q: Record<string, unknown>) => ({
    symbol: q.symbol as string,
    name: (q.shortName ?? q.longName ?? q.symbol) as string,
    price: (q.regularMarketPrice ?? 0) as number,
    change: (q.regularMarketChange ?? 0) as number,
    changePercent: (q.regularMarketChangePercent ?? 0) as number,
    open: (q.regularMarketOpen ?? 0) as number,
    high: (q.regularMarketDayHigh ?? 0) as number,
    low: (q.regularMarketDayLow ?? 0) as number,
    previousClose: (q.regularMarketPreviousClose ?? 0) as number,
    volume: (q.regularMarketVolume ?? 0) as number,
    avgVolume: (q.averageDailyVolume3Month ?? 0) as number,
    marketCap: (q.marketCap ?? 0) as number,
    pe: (q.trailingPE ?? 0) as number,
    eps: (q.epsTrailingTwelveMonths ?? 0) as number,
    fiftyTwoWeekHigh: (q.fiftyTwoWeekHigh ?? 0) as number,
    fiftyTwoWeekLow: (q.fiftyTwoWeekLow ?? 0) as number,
    exchange: (q.exchange ?? '') as string,
  }))
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
  const url = `${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=20&quotesCount=0`)}`

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
