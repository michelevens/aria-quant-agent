import type { OHLCV, Signal } from '@/types/market'
import { generateSignal } from './signals'

export interface BacktestConfig {
  initialCapital: number
  positionSize: number // fraction of capital per trade (0-1)
  stopLossMultiplier: number
  takeProfitMultiplier: number
  commission: number // per trade
}

export interface BacktestTrade {
  entryDate: string
  exitDate: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  pnlPercent: number
  exitReason: 'TP' | 'SL' | 'SIGNAL' | 'END'
}

export interface BacktestResult {
  symbol: string
  config: BacktestConfig
  trades: BacktestTrade[]
  equityCurve: { date: string; equity: number }[]
  totalReturn: number
  totalReturnPct: number
  winRate: number
  avgWin: number
  avgLoss: number
  maxDrawdown: number
  sharpe: number
  profitFactor: number
  totalTrades: number
  winners: number
  losers: number
}

const DEFAULT_CONFIG: BacktestConfig = {
  initialCapital: 100000,
  positionSize: 0.1,
  stopLossMultiplier: 2,
  takeProfitMultiplier: 4,
  commission: 0,
}

export function runBacktest(
  symbol: string,
  bars: OHLCV[],
  config: Partial<BacktestConfig> = {}
): BacktestResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const trades: BacktestTrade[] = []
  const equityCurve: { date: string; equity: number }[] = []
  let equity = cfg.initialCapital
  let peak = equity

  // State
  let position: {
    side: 'LONG' | 'SHORT'
    entryPrice: number
    quantity: number
    stopLoss: number
    takeProfit: number
    entryDate: string
  } | null = null

  // Need at least 200 bars for signal generation
  const startIdx = 200
  if (bars.length < startIdx + 50) {
    return emptyResult(symbol, cfg)
  }

  for (let i = startIdx; i < bars.length; i++) {
    const bar = bars[i]
    const date = new Date(bar.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

    // Check stop loss / take profit on existing position
    if (position) {
      let exitReason: BacktestTrade['exitReason'] | null = null
      let exitPrice = 0

      if (position.side === 'LONG') {
        if (bar.low <= position.stopLoss) {
          exitReason = 'SL'
          exitPrice = position.stopLoss
        } else if (bar.high >= position.takeProfit) {
          exitReason = 'TP'
          exitPrice = position.takeProfit
        }
      } else {
        if (bar.high >= position.stopLoss) {
          exitReason = 'SL'
          exitPrice = position.stopLoss
        } else if (bar.low <= position.takeProfit) {
          exitReason = 'TP'
          exitPrice = position.takeProfit
        }
      }

      if (exitReason) {
        const pnl = position.side === 'LONG'
          ? (exitPrice - position.entryPrice) * position.quantity - cfg.commission * 2
          : (position.entryPrice - exitPrice) * position.quantity - cfg.commission * 2

        trades.push({
          entryDate: position.entryDate,
          exitDate: date,
          side: position.side,
          entryPrice: position.entryPrice,
          exitPrice,
          quantity: position.quantity,
          pnl,
          pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
          exitReason,
        })

        equity += pnl
        position = null
      }
    }

    // Generate signal every 5 bars (not every bar for performance)
    if (i % 5 === 0 && !position) {
      const slice = bars.slice(0, i + 1)
      const signal: Signal = generateSignal(symbol, slice)

      if (signal.type === 'BUY' && signal.strength >= 60) {
        const capitalForTrade = equity * cfg.positionSize
        const quantity = Math.floor(capitalForTrade / bar.close)
        if (quantity > 0) {
          position = {
            side: 'LONG',
            entryPrice: bar.close,
            quantity,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            entryDate: date,
          }
        }
      } else if (signal.type === 'SELL' && signal.strength <= 40) {
        const capitalForTrade = equity * cfg.positionSize
        const quantity = Math.floor(capitalForTrade / bar.close)
        if (quantity > 0) {
          position = {
            side: 'SHORT',
            entryPrice: bar.close,
            quantity,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            entryDate: date,
          }
        }
      }
    }

    // Track equity
    if (i % 5 === 0) {
      let unrealized = 0
      if (position) {
        unrealized = position.side === 'LONG'
          ? (bar.close - position.entryPrice) * position.quantity
          : (position.entryPrice - bar.close) * position.quantity
      }
      equityCurve.push({ date, equity: equity + unrealized })
    }

    peak = Math.max(peak, equity)
  }

  // Close any open position at end
  if (position) {
    const lastBar = bars[bars.length - 1]
    const exitPrice = lastBar.close
    const pnl = position.side === 'LONG'
      ? (exitPrice - position.entryPrice) * position.quantity - cfg.commission * 2
      : (position.entryPrice - exitPrice) * position.quantity - cfg.commission * 2

    trades.push({
      entryDate: position.entryDate,
      exitDate: new Date(lastBar.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice,
      quantity: position.quantity,
      pnl,
      pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
      exitReason: 'END',
    })
    equity += pnl
  }

  // Calculate stats
  const winners = trades.filter((t) => t.pnl > 0)
  const losers = trades.filter((t) => t.pnl <= 0)
  const totalReturn = equity - cfg.initialCapital
  const totalReturnPct = (totalReturn / cfg.initialCapital) * 100
  const winRate = trades.length > 0 ? (winners.length / trades.length) * 100 : 0
  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0
  const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 0
  const grossProfit = winners.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

  // Max drawdown
  let maxDD = 0
  let eqPeak = cfg.initialCapital
  for (const pt of equityCurve) {
    eqPeak = Math.max(eqPeak, pt.equity)
    const dd = (eqPeak - pt.equity) / eqPeak
    maxDD = Math.max(maxDD, dd)
  }

  // Sharpe (annualized, simplified)
  const returns = equityCurve.slice(1).map((pt, i) =>
    (pt.equity - equityCurve[i].equity) / equityCurve[i].equity
  )
  const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0
  const stdReturn = returns.length > 1
    ? Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1))
    : 0
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0

  return {
    symbol,
    config: cfg,
    trades,
    equityCurve,
    totalReturn,
    totalReturnPct,
    winRate,
    avgWin,
    avgLoss,
    maxDrawdown: maxDD * 100,
    sharpe,
    profitFactor,
    totalTrades: trades.length,
    winners: winners.length,
    losers: losers.length,
  }
}

function emptyResult(symbol: string, config: BacktestConfig): BacktestResult {
  return {
    symbol,
    config,
    trades: [],
    equityCurve: [],
    totalReturn: 0,
    totalReturnPct: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    maxDrawdown: 0,
    sharpe: 0,
    profitFactor: 0,
    totalTrades: 0,
    winners: 0,
    losers: 0,
  }
}
