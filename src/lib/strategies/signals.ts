import type { OHLCV, Signal, TechnicalIndicators } from '@/types/market'
import { computeIndicators } from '@/lib/analytics/technicals'

interface SignalFactor {
  name: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  weight: number
  reason: string
}

function evaluateRSI(ind: TechnicalIndicators): SignalFactor {
  if (ind.rsi14 < 30) return { name: 'RSI', signal: 'BUY', weight: 15, reason: `RSI oversold at ${ind.rsi14.toFixed(1)}` }
  if (ind.rsi14 > 70) return { name: 'RSI', signal: 'SELL', weight: 15, reason: `RSI overbought at ${ind.rsi14.toFixed(1)}` }
  if (ind.rsi14 < 40) return { name: 'RSI', signal: 'BUY', weight: 5, reason: `RSI approaching oversold (${ind.rsi14.toFixed(1)})` }
  if (ind.rsi14 > 60) return { name: 'RSI', signal: 'SELL', weight: 5, reason: `RSI approaching overbought (${ind.rsi14.toFixed(1)})` }
  return { name: 'RSI', signal: 'HOLD', weight: 0, reason: `RSI neutral at ${ind.rsi14.toFixed(1)}` }
}

function evaluateMACD(ind: TechnicalIndicators): SignalFactor {
  const { macd: m, signal: s, histogram: h } = ind.macd
  if (h > 0 && m > s) return { name: 'MACD', signal: 'BUY', weight: 12, reason: 'MACD bullish crossover' }
  if (h < 0 && m < s) return { name: 'MACD', signal: 'SELL', weight: 12, reason: 'MACD bearish crossover' }
  return { name: 'MACD', signal: 'HOLD', weight: 0, reason: 'MACD neutral' }
}

function evaluateBollinger(ind: TechnicalIndicators, price: number): SignalFactor {
  const { upper, lower, middle } = ind.bollingerBands
  if (price <= lower) return { name: 'BB', signal: 'BUY', weight: 10, reason: `Price at lower Bollinger Band ($${lower.toFixed(2)})` }
  if (price >= upper) return { name: 'BB', signal: 'SELL', weight: 10, reason: `Price at upper Bollinger Band ($${upper.toFixed(2)})` }
  if (price < middle) return { name: 'BB', signal: 'BUY', weight: 3, reason: 'Price below BB middle band' }
  return { name: 'BB', signal: 'HOLD', weight: 0, reason: 'Price within Bollinger Bands' }
}

function evaluateMovingAverages(ind: TechnicalIndicators, price: number): SignalFactor {
  const aboveSma20 = price > ind.sma20
  const aboveSma50 = price > ind.sma50
  const aboveSma200 = price > ind.sma200
  const goldenCross = ind.sma50 > ind.sma200

  if (aboveSma20 && aboveSma50 && aboveSma200 && goldenCross) {
    return { name: 'MA', signal: 'BUY', weight: 15, reason: 'Strong uptrend: price above all MAs, golden cross' }
  }
  if (!aboveSma20 && !aboveSma50 && !aboveSma200 && !goldenCross) {
    return { name: 'MA', signal: 'SELL', weight: 15, reason: 'Strong downtrend: price below all MAs, death cross' }
  }
  if (aboveSma200 && goldenCross) {
    return { name: 'MA', signal: 'BUY', weight: 8, reason: 'Bullish: above SMA200 with golden cross' }
  }
  if (!aboveSma200) {
    return { name: 'MA', signal: 'SELL', weight: 8, reason: 'Bearish: below SMA200' }
  }
  return { name: 'MA', signal: 'HOLD', weight: 0, reason: 'Moving averages mixed' }
}

function evaluateStochastic(ind: TechnicalIndicators): SignalFactor {
  const { k, d } = ind.stochastic
  if (k < 20 && d < 20) return { name: 'STOCH', signal: 'BUY', weight: 10, reason: `Stochastic oversold (%K=${k.toFixed(1)})` }
  if (k > 80 && d > 80) return { name: 'STOCH', signal: 'SELL', weight: 10, reason: `Stochastic overbought (%K=${k.toFixed(1)})` }
  if (k > d && k < 50) return { name: 'STOCH', signal: 'BUY', weight: 5, reason: 'Stochastic bullish crossover' }
  if (k < d && k > 50) return { name: 'STOCH', signal: 'SELL', weight: 5, reason: 'Stochastic bearish crossover' }
  return { name: 'STOCH', signal: 'HOLD', weight: 0, reason: 'Stochastic neutral' }
}

function evaluateVolume(_ind: TechnicalIndicators, bars: OHLCV[]): SignalFactor {
  if (bars.length < 20) return { name: 'VOL', signal: 'HOLD', weight: 0, reason: 'Insufficient data' }

  const recentVol = bars.slice(-5).reduce((s, b) => s + b.volume, 0) / 5
  const avgVol = bars.slice(-20).reduce((s, b) => s + b.volume, 0) / 20
  const volRatio = recentVol / avgVol

  if (volRatio > 1.5 && bars[bars.length - 1].close > bars[bars.length - 2].close) {
    return { name: 'VOL', signal: 'BUY', weight: 8, reason: `Volume surge (${volRatio.toFixed(1)}x avg) on up move` }
  }
  if (volRatio > 1.5 && bars[bars.length - 1].close < bars[bars.length - 2].close) {
    return { name: 'VOL', signal: 'SELL', weight: 8, reason: `Volume surge (${volRatio.toFixed(1)}x avg) on down move` }
  }
  return { name: 'VOL', signal: 'HOLD', weight: 0, reason: `Volume normal (${volRatio.toFixed(1)}x avg)` }
}

function evaluateTrend(ind: TechnicalIndicators): SignalFactor {
  if (ind.adx14 > 25 && ind.ema12 > ind.ema26) {
    return { name: 'TREND', signal: 'BUY', weight: 10, reason: `Strong uptrend (ADX=${ind.adx14.toFixed(1)})` }
  }
  if (ind.adx14 > 25 && ind.ema12 < ind.ema26) {
    return { name: 'TREND', signal: 'SELL', weight: 10, reason: `Strong downtrend (ADX=${ind.adx14.toFixed(1)})` }
  }
  return { name: 'TREND', signal: 'HOLD', weight: 0, reason: `Weak trend (ADX=${ind.adx14.toFixed(1)})` }
}

export function generateSignal(symbol: string, bars: OHLCV[]): Signal {
  if (bars.length < 200) {
    return {
      symbol,
      type: 'HOLD',
      strength: 50,
      reason: 'Insufficient data for analysis',
      indicators: [],
      timestamp: Date.now(),
      price: bars[bars.length - 1]?.close ?? 0,
      stopLoss: 0,
      takeProfit: 0,
      riskReward: 0,
    }
  }

  const ind = computeIndicators(bars)
  const price = bars[bars.length - 1].close

  const factors: SignalFactor[] = [
    evaluateRSI(ind),
    evaluateMACD(ind),
    evaluateBollinger(ind, price),
    evaluateMovingAverages(ind, price),
    evaluateStochastic(ind),
    evaluateVolume(ind, bars),
    evaluateTrend(ind),
  ]

  let buyScore = 0
  let sellScore = 0
  const indicators: string[] = []

  for (const f of factors) {
    if (f.signal === 'BUY') buyScore += f.weight
    if (f.signal === 'SELL') sellScore += f.weight
    if (f.weight > 0) indicators.push(f.reason)
  }

  const totalPossible = 80 // max possible score
  const netScore = buyScore - sellScore
  const strength = Math.min(100, Math.round(50 + (netScore / totalPossible) * 50))

  let type: Signal['type'] = 'HOLD'
  let reason = 'Mixed signals - no clear direction'

  if (strength >= 65) {
    type = 'BUY'
    reason = `Bullish consensus: ${indicators.filter((_, i) => factors[i].signal === 'BUY').join('; ')}`
  } else if (strength <= 35) {
    type = 'SELL'
    reason = `Bearish consensus: ${indicators.filter((_, i) => factors[i].signal === 'SELL').join('; ')}`
  }

  // Calculate stop loss & take profit using ATR
  const stopDistance = ind.atr14 * 2
  const stopLoss = type === 'BUY' ? price - stopDistance : price + stopDistance
  const takeProfit = type === 'BUY' ? price + stopDistance * 2 : price - stopDistance * 2
  const riskReward = stopDistance > 0 ? (Math.abs(takeProfit - price) / stopDistance) : 0

  return {
    symbol,
    type,
    strength,
    reason,
    indicators,
    timestamp: Date.now(),
    price,
    stopLoss: parseFloat(stopLoss.toFixed(2)),
    takeProfit: parseFloat(takeProfit.toFixed(2)),
    riskReward: parseFloat(riskReward.toFixed(2)),
  }
}
