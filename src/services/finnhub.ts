const FH_STORAGE_KEY = 'aria-quant-fh-key'
const FH_BASE = 'https://finnhub.io/api/v1'

export function getFinnhubKey(): string | null {
  return localStorage.getItem(FH_STORAGE_KEY)
}

export function setFinnhubKey(key: string) {
  localStorage.setItem(FH_STORAGE_KEY, key)
}

export function removeFinnhubKey() {
  localStorage.removeItem(FH_STORAGE_KEY)
}

export function isFinnhubConnected(): boolean {
  return !!getFinnhubKey()
}

async function fhFetch(path: string, params: Record<string, string> = {}) {
  const key = getFinnhubKey()
  if (!key) throw new Error('Finnhub API key not set')

  const qs = new URLSearchParams({ ...params, token: key }).toString()
  const res = await fetch(`${FH_BASE}${path}?${qs}`)
  if (!res.ok) throw new Error(`Finnhub request failed: ${res.status}`)
  return res.json()
}

export async function validateFinnhubKey(key: string): Promise<boolean> {
  const prev = getFinnhubKey()
  setFinnhubKey(key)
  try {
    const res = await fetch(`${FH_BASE}/quote?symbol=AAPL&token=${key}`)
    if (!res.ok) throw new Error('Invalid')
    const json = await res.json()
    if (!json.c || json.c === 0) throw new Error('Invalid response')
    return true
  } catch {
    if (prev) setFinnhubKey(prev)
    else removeFinnhubKey()
    return false
  }
}

export interface FHQuote {
  current: number
  change: number
  percentChange: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: number
}

export async function fetchFHQuote(symbol: string): Promise<FHQuote> {
  const json = await fhFetch('/quote', { symbol })
  return {
    current: json.c ?? 0,
    change: json.d ?? 0,
    percentChange: json.dp ?? 0,
    high: json.h ?? 0,
    low: json.l ?? 0,
    open: json.o ?? 0,
    previousClose: json.pc ?? 0,
    timestamp: (json.t ?? 0) * 1000,
  }
}

export interface FHCompanyProfile {
  country: string
  currency: string
  exchange: string
  ipo: string
  marketCap: number
  name: string
  ticker: string
  weburl: string
  logo: string
  industry: string
}

export async function fetchFHCompanyProfile(symbol: string): Promise<FHCompanyProfile> {
  const json = await fhFetch('/stock/profile2', { symbol })
  return {
    country: json.country ?? '',
    currency: json.currency ?? '',
    exchange: json.exchange ?? '',
    ipo: json.ipo ?? '',
    marketCap: json.marketCapitalization ?? 0,
    name: json.name ?? '',
    ticker: json.ticker ?? symbol,
    weburl: json.weburl ?? '',
    logo: json.logo ?? '',
    industry: json.finnhubIndustry ?? '',
  }
}

export interface FHRecommendation {
  period: string
  buy: number
  hold: number
  sell: number
  strongBuy: number
  strongSell: number
}

export async function fetchFHRecommendations(symbol: string): Promise<FHRecommendation[]> {
  const json = await fhFetch('/stock/recommendation', { symbol })
  if (!Array.isArray(json)) return []
  return json.slice(0, 6).map((r: Record<string, unknown>) => ({
    period: (r.period ?? '') as string,
    buy: (r.buy ?? 0) as number,
    hold: (r.hold ?? 0) as number,
    sell: (r.sell ?? 0) as number,
    strongBuy: (r.strongBuy ?? 0) as number,
    strongSell: (r.strongSell ?? 0) as number,
  }))
}

export interface FHNewsItem {
  id: number
  category: string
  datetime: number
  headline: string
  image: string
  source: string
  summary: string
  url: string
}

export async function fetchFHNews(category: string = 'general'): Promise<FHNewsItem[]> {
  const json = await fhFetch('/news', { category })
  if (!Array.isArray(json)) return []
  return json.slice(0, 20).map((n: Record<string, unknown>) => ({
    id: (n.id ?? 0) as number,
    category: (n.category ?? '') as string,
    datetime: (n.datetime ?? 0) as number,
    headline: (n.headline ?? '') as string,
    image: (n.image ?? '') as string,
    source: (n.source ?? '') as string,
    summary: (n.summary ?? '') as string,
    url: (n.url ?? '') as string,
  }))
}

export async function fetchFHCompanyNews(symbol: string): Promise<FHNewsItem[]> {
  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const json = await fhFetch('/company-news', { symbol, from, to })
  if (!Array.isArray(json)) return []
  return json.slice(0, 15).map((n: Record<string, unknown>) => ({
    id: (n.id ?? 0) as number,
    category: (n.category ?? '') as string,
    datetime: (n.datetime ?? 0) as number,
    headline: (n.headline ?? '') as string,
    image: (n.image ?? '') as string,
    source: (n.source ?? '') as string,
    summary: (n.summary ?? '') as string,
    url: (n.url ?? '') as string,
  }))
}
