// Alpaca Trading API integration
// Supports both paper and live trading
// Paper: https://paper-api.alpaca.markets
// Live: https://api.alpaca.markets

const STORAGE_KEY = 'aria-alpaca-config'

export interface AlpacaConfig {
  apiKey: string
  secretKey: string
  paper: boolean
}

export interface AlpacaAccount {
  id: string
  account_number: string
  status: string
  currency: string
  buying_power: string
  cash: string
  portfolio_value: string
  equity: string
  last_equity: string
  long_market_value: string
  short_market_value: string
  pattern_day_trader: boolean
  daytrade_count: number
  daytrading_buying_power: string
}

export interface AlpacaPosition {
  asset_id: string
  symbol: string
  qty: string
  avg_entry_price: string
  market_value: string
  current_price: string
  unrealized_pl: string
  unrealized_plpc: string
  side: string
  change_today: string
}

export interface AlpacaOrder {
  id: string
  client_order_id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok'
  qty: string
  filled_qty: string
  filled_avg_price: string | null
  limit_price: string | null
  stop_price: string | null
  trail_percent: string | null
  trail_price: string | null
  status: string
  created_at: string
  filled_at: string | null
  submitted_at: string
}

function getBaseUrl(paper: boolean): string {
  return paper
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets'
}

export function getAlpacaConfig(): AlpacaConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

export function setAlpacaConfig(config: AlpacaConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function removeAlpacaConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function isAlpacaConnected(): boolean {
  return getAlpacaConfig() !== null
}

async function alpacaFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const config = getAlpacaConfig()
  if (!config) throw new Error('Alpaca not configured')

  const base = getBaseUrl(config.paper)
  const url = `${base}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.secretKey,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Alpaca API ${res.status}: ${text}`)
  }

  return res.json()
}

// === Account ===

export async function fetchAccount(): Promise<AlpacaAccount> {
  return alpacaFetch<AlpacaAccount>('/v2/account')
}

export async function validateAlpacaKeys(apiKey: string, secretKey: string, paper: boolean): Promise<boolean> {
  try {
    const base = getBaseUrl(paper)
    const res = await fetch(`${base}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    })
    return res.ok
  } catch {
    return false
  }
}

// === Positions ===

export async function fetchPositions(): Promise<AlpacaPosition[]> {
  return alpacaFetch<AlpacaPosition[]>('/v2/positions')
}

export async function closePosition(symbol: string): Promise<AlpacaOrder> {
  return alpacaFetch<AlpacaOrder>(`/v2/positions/${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
  })
}

// === Orders ===

export async function fetchOrders(status: 'open' | 'closed' | 'all' = 'all', limit = 50): Promise<AlpacaOrder[]> {
  return alpacaFetch<AlpacaOrder[]>(`/v2/orders?status=${status}&limit=${limit}&direction=desc`)
}

export interface PlaceOrderParams {
  symbol: string
  qty: number
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok'
  limit_price?: number
  stop_price?: number
  trail_percent?: number
  trail_price?: number
  order_class?: 'bracket' | 'oco' | 'simple'
  take_profit?: { limit_price: number }
  stop_loss?: { stop_price: number; limit_price?: number }
}

export async function placeAlpacaOrder(params: PlaceOrderParams): Promise<AlpacaOrder> {
  const body: Record<string, unknown> = {
    symbol: params.symbol,
    qty: params.qty.toString(),
    side: params.side,
    type: params.type,
    time_in_force: params.time_in_force,
  }

  if (params.limit_price !== undefined) body.limit_price = params.limit_price.toString()
  if (params.stop_price !== undefined) body.stop_price = params.stop_price.toString()
  if (params.trail_percent !== undefined) body.trail_percent = params.trail_percent.toString()
  if (params.trail_price !== undefined) body.trail_price = params.trail_price.toString()
  if (params.order_class) body.order_class = params.order_class
  if (params.take_profit) body.take_profit = { limit_price: params.take_profit.limit_price.toString() }
  if (params.stop_loss) {
    const sl: Record<string, string> = { stop_price: params.stop_loss.stop_price.toString() }
    if (params.stop_loss.limit_price !== undefined) sl.limit_price = params.stop_loss.limit_price.toString()
    body.stop_loss = sl
  }

  return alpacaFetch<AlpacaOrder>('/v2/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function cancelAlpacaOrder(orderId: string): Promise<void> {
  await alpacaFetch<void>(`/v2/orders/${orderId}`, { method: 'DELETE' })
}

// === Market Clock ===

export interface MarketClock {
  timestamp: string
  is_open: boolean
  next_open: string
  next_close: string
}

export async function fetchMarketClock(): Promise<MarketClock> {
  return alpacaFetch<MarketClock>('/v2/clock')
}
