export interface OHLCV {
  timestamp: number
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  previousClose: number
  volume: number
  avgVolume: number
  marketCap: number
  pe: number
  eps: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  exchange: string
}

export interface PortfolioPosition {
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
  weight: number
  beta: number
  sector: string
}

export interface PortfolioMetrics {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  dayChange: number
  dayChangePercent: number
  buyingPower: number
  sharpeRatio: number
  beta: number
  alpha: number
  maxDrawdown: number
  var95: number
  var99: number
  volatility: number
  sortino: number
  calmarRatio: number
  informationRatio: number
  treynorRatio: number
}

export interface TechnicalIndicators {
  rsi14: number
  macd: { macd: number; signal: number; histogram: number }
  bollingerBands: { upper: number; middle: number; lower: number }
  sma20: number
  sma50: number
  sma200: number
  ema12: number
  ema26: number
  atr14: number
  adx14: number
  stochastic: { k: number; d: number }
  obv: number
  vwap: number
  support: number
  resistance: number
}

export interface Signal {
  symbol: string
  type: 'BUY' | 'SELL' | 'HOLD'
  strength: number // 0-100
  reason: string
  indicators: string[]
  timestamp: number
  price: number
  stopLoss: number
  takeProfit: number
  riskReward: number
}

export interface CorrelationMatrix {
  symbols: string[]
  matrix: number[][]
}

export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX'
export type Interval = '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo'
