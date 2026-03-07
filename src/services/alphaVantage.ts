const AV_STORAGE_KEY = 'aria-quant-av-key'
const AV_BASE = 'https://www.alphavantage.co/query'

export function getAlphaVantageKey(): string | null {
  return localStorage.getItem(AV_STORAGE_KEY)
}

export function setAlphaVantageKey(key: string) {
  localStorage.setItem(AV_STORAGE_KEY, key)
}

export function removeAlphaVantageKey() {
  localStorage.removeItem(AV_STORAGE_KEY)
}

export function isAlphaVantageConnected(): boolean {
  return !!getAlphaVantageKey()
}

async function avFetch(params: Record<string, string>) {
  const key = getAlphaVantageKey()
  if (!key) throw new Error('Alpha Vantage API key not set')

  const qs = new URLSearchParams({ ...params, apikey: key }).toString()
  const res = await fetch(`${AV_BASE}?${qs}`)
  if (!res.ok) throw new Error(`Alpha Vantage request failed: ${res.status}`)

  const json = await res.json()
  if (json['Error Message']) throw new Error(json['Error Message'])
  if (json['Note']) throw new Error('Alpha Vantage rate limit exceeded. Free tier allows 25 requests/day.')
  return json
}

// Validate key by making a lightweight request
export async function validateKey(key: string): Promise<boolean> {
  const prev = getAlphaVantageKey()
  setAlphaVantageKey(key)
  try {
    await avFetch({ function: 'GLOBAL_QUOTE', symbol: 'IBM' })
    return true
  } catch {
    if (prev) setAlphaVantageKey(prev)
    else removeAlphaVantageKey()
    return false
  }
}

export interface AVGlobalQuote {
  symbol: string
  open: number
  high: number
  low: number
  price: number
  volume: number
  latestDay: string
  previousClose: number
  change: number
  changePercent: number
}

export async function fetchGlobalQuote(symbol: string): Promise<AVGlobalQuote> {
  const json = await avFetch({ function: 'GLOBAL_QUOTE', symbol })
  const gq = json['Global Quote']
  if (!gq) throw new Error(`No quote data for ${symbol}`)

  return {
    symbol: gq['01. symbol'],
    open: parseFloat(gq['02. open']),
    high: parseFloat(gq['03. high']),
    low: parseFloat(gq['04. low']),
    price: parseFloat(gq['05. price']),
    volume: parseInt(gq['06. volume']),
    latestDay: gq['07. latest trading day'],
    previousClose: parseFloat(gq['08. previous close']),
    change: parseFloat(gq['09. change']),
    changePercent: parseFloat(gq['10. change percent']?.replace('%', '')),
  }
}

export interface AVCompanyOverview {
  symbol: string
  name: string
  description: string
  sector: string
  industry: string
  marketCap: number
  peRatio: number
  pegRatio: number
  bookValue: number
  dividendYield: number
  eps: number
  revenuePerShare: number
  profitMargin: number
  operatingMargin: number
  returnOnAssets: number
  returnOnEquity: number
  beta: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  analystTargetPrice: number
  forwardPE: number
}

export async function fetchCompanyOverview(symbol: string): Promise<AVCompanyOverview> {
  const json = await avFetch({ function: 'OVERVIEW', symbol })
  if (!json.Symbol) throw new Error(`No overview data for ${symbol}`)

  return {
    symbol: json.Symbol,
    name: json.Name,
    description: json.Description,
    sector: json.Sector,
    industry: json.Industry,
    marketCap: parseFloat(json.MarketCapitalization) || 0,
    peRatio: parseFloat(json.PERatio) || 0,
    pegRatio: parseFloat(json.PEGRatio) || 0,
    bookValue: parseFloat(json.BookValue) || 0,
    dividendYield: parseFloat(json.DividendYield) || 0,
    eps: parseFloat(json.EPS) || 0,
    revenuePerShare: parseFloat(json.RevenuePerShareTTM) || 0,
    profitMargin: parseFloat(json.ProfitMargin) || 0,
    operatingMargin: parseFloat(json.OperatingMarginTTM) || 0,
    returnOnAssets: parseFloat(json.ReturnOnAssetsTTM) || 0,
    returnOnEquity: parseFloat(json.ReturnOnEquityTTM) || 0,
    beta: parseFloat(json.Beta) || 0,
    fiftyTwoWeekHigh: parseFloat(json['52WeekHigh']) || 0,
    fiftyTwoWeekLow: parseFloat(json['52WeekLow']) || 0,
    analystTargetPrice: parseFloat(json.AnalystTargetPrice) || 0,
    forwardPE: parseFloat(json.ForwardPE) || 0,
  }
}

export interface AVTechnicalValue {
  date: string
  value: number
}

export async function fetchRSI(symbol: string, period = 14): Promise<AVTechnicalValue[]> {
  const json = await avFetch({
    function: 'RSI',
    symbol,
    interval: 'daily',
    time_period: String(period),
    series_type: 'close',
  })

  const data = json['Technical Analysis: RSI']
  if (!data) return []

  return Object.entries(data)
    .slice(0, 60)
    .map(([date, val]) => ({
      date,
      value: parseFloat((val as Record<string, string>).RSI),
    }))
    .reverse()
}

export async function fetchMACD(symbol: string): Promise<{ date: string; macd: number; signal: number; histogram: number }[]> {
  const json = await avFetch({
    function: 'MACD',
    symbol,
    interval: 'daily',
    series_type: 'close',
  })

  const data = json['Technical Analysis: MACD']
  if (!data) return []

  return Object.entries(data)
    .slice(0, 60)
    .map(([date, val]) => {
      const v = val as Record<string, string>
      return {
        date,
        macd: parseFloat(v.MACD),
        signal: parseFloat(v.MACD_Signal),
        histogram: parseFloat(v.MACD_Hist),
      }
    })
    .reverse()
}

export async function fetchSMA(symbol: string, period = 50): Promise<AVTechnicalValue[]> {
  const json = await avFetch({
    function: 'SMA',
    symbol,
    interval: 'daily',
    time_period: String(period),
    series_type: 'close',
  })

  const data = json['Technical Analysis: SMA']
  if (!data) return []

  return Object.entries(data)
    .slice(0, 60)
    .map(([date, val]) => ({
      date,
      value: parseFloat((val as Record<string, string>).SMA),
    }))
    .reverse()
}

export interface AVEarnings {
  symbol: string
  reportedDate: string
  reportedEPS: number
  estimatedEPS: number
  surprise: number
  surprisePercentage: number
}

export async function fetchEarnings(symbol: string): Promise<AVEarnings[]> {
  const json = await avFetch({ function: 'EARNINGS', symbol })
  const quarterly = json.quarterlyEarnings ?? []

  return quarterly.slice(0, 8).map((e: Record<string, string>) => ({
    symbol,
    reportedDate: e.reportedDate,
    reportedEPS: parseFloat(e.reportedEPS) || 0,
    estimatedEPS: parseFloat(e.estimatedEPS) || 0,
    surprise: parseFloat(e.surprise) || 0,
    surprisePercentage: parseFloat(e.surprisePercentage) || 0,
  }))
}
