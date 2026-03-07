import type { OHLCV, TechnicalIndicators } from '@/types/market'

// --- Moving Averages ---

export function sma(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    result.push(sum / period)
  }
  return result
}

export function ema(data: number[], period: number): number[] {
  const result: number[] = []
  const k = 2 / (period + 1)
  let prev = NaN

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    if (i === period - 1) {
      let sum = 0
      for (let j = 0; j < period; j++) sum += data[j]
      prev = sum / period
      result.push(prev)
      continue
    }
    prev = data[i] * k + prev * (1 - k)
    result.push(prev)
  }
  return result
}

// --- RSI ---

export function rsi(closes: number[], period: number = 14): number[] {
  const result: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(NaN)
      gains.push(0)
      losses.push(0)
      continue
    }

    const change = closes[i] - closes[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? -change : 0)

    if (i < period) {
      result.push(NaN)
      continue
    }

    if (i === period) {
      let avgGain = 0
      let avgLoss = 0
      for (let j = 1; j <= period; j++) {
        avgGain += gains[j]
        avgLoss += losses[j]
      }
      avgGain /= period
      avgLoss /= period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(100 - 100 / (1 + rs))
      continue
    }

    // Wilder's smoothing
    const prevRsi = result[i - 1]
    if (isNaN(prevRsi)) {
      result.push(NaN)
      continue
    }

    // Re-derive avg gain/loss from running calculation
    let avgGain = 0
    let avgLoss = 0
    for (let j = i - period + 1; j <= i; j++) {
      avgGain += gains[j]
      avgLoss += losses[j]
    }
    avgGain /= period
    avgLoss /= period

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push(100 - 100 / (1 + rs))
  }
  return result
}

// --- MACD ---

export function macd(
  closes: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = ema(closes, fast)
  const emaSlow = ema(closes, slow)

  const macdLine: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macdLine.push(NaN)
    } else {
      macdLine.push(emaFast[i] - emaSlow[i])
    }
  }

  const validMacd = macdLine.filter((v) => !isNaN(v))
  const signalLine = ema(validMacd, signal)

  // Re-align signal line
  const fullSignal: number[] = []
  let si = 0
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(macdLine[i])) {
      fullSignal.push(NaN)
    } else {
      fullSignal.push(si < signalLine.length ? signalLine[si] : NaN)
      si++
    }
  }

  const histogram: number[] = macdLine.map((m, i) =>
    isNaN(m) || isNaN(fullSignal[i]) ? NaN : m - fullSignal[i]
  )

  return { macd: macdLine, signal: fullSignal, histogram }
}

// --- Bollinger Bands ---

export function bollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(closes, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (isNaN(middle[i])) {
      upper.push(NaN)
      lower.push(NaN)
      continue
    }
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (closes[j] - middle[i]) ** 2
    }
    const sd = Math.sqrt(sumSq / period)
    upper.push(middle[i] + stdDev * sd)
    lower.push(middle[i] - stdDev * sd)
  }

  return { upper, middle, lower }
}

// --- ATR (Average True Range) ---

export function atr(bars: OHLCV[], period: number = 14): number[] {
  const result: number[] = []
  const trueRanges: number[] = []

  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      trueRanges.push(bars[i].high - bars[i].low)
      result.push(NaN)
      continue
    }
    const tr = Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close)
    )
    trueRanges.push(tr)

    if (i < period) {
      result.push(NaN)
      continue
    }
    if (i === period) {
      let sum = 0
      for (let j = 1; j <= period; j++) sum += trueRanges[j]
      result.push(sum / period)
      continue
    }

    const prev = result[i - 1]
    if (isNaN(prev)) {
      result.push(NaN)
      continue
    }
    result.push((prev * (period - 1) + tr) / period)
  }
  return result
}

// --- Stochastic Oscillator ---

export function stochastic(
  bars: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  const kValues: number[] = []

  for (let i = 0; i < bars.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(NaN)
      continue
    }
    let highest = -Infinity
    let lowest = Infinity
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (bars[j].high > highest) highest = bars[j].high
      if (bars[j].low < lowest) lowest = bars[j].low
    }
    const range = highest - lowest
    kValues.push(range === 0 ? 50 : ((bars[i].close - lowest) / range) * 100)
  }

  const dValues = sma(
    kValues.filter((v) => !isNaN(v)),
    dPeriod
  )

  // Re-align %D
  const fullD: number[] = []
  let di = 0
  for (let i = 0; i < bars.length; i++) {
    if (isNaN(kValues[i])) {
      fullD.push(NaN)
    } else {
      fullD.push(di < dValues.length ? dValues[di] : NaN)
      di++
    }
  }

  return { k: kValues, d: fullD }
}

// --- OBV (On-Balance Volume) ---

export function obv(bars: OHLCV[]): number[] {
  const result: number[] = [0]
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].close > bars[i - 1].close) {
      result.push(result[i - 1] + bars[i].volume)
    } else if (bars[i].close < bars[i - 1].close) {
      result.push(result[i - 1] - bars[i].volume)
    } else {
      result.push(result[i - 1])
    }
  }
  return result
}

// --- VWAP ---

export function vwap(bars: OHLCV[]): number[] {
  const result: number[] = []
  let cumulativeTPV = 0
  let cumulativeVol = 0

  for (let i = 0; i < bars.length; i++) {
    const typicalPrice = (bars[i].high + bars[i].low + bars[i].close) / 3
    cumulativeTPV += typicalPrice * bars[i].volume
    cumulativeVol += bars[i].volume
    result.push(cumulativeVol > 0 ? cumulativeTPV / cumulativeVol : typicalPrice)
  }
  return result
}

// --- ADX (Average Directional Index) ---

export function adx(bars: OHLCV[], period: number = 14): number[] {
  const result: number[] = []
  if (bars.length < period * 2) return bars.map(() => NaN)

  const plusDM: number[] = [0]
  const minusDM: number[] = [0]
  const trueRanges: number[] = [bars[0].high - bars[0].low]

  for (let i = 1; i < bars.length; i++) {
    const upMove = bars[i].high - bars[i - 1].high
    const downMove = bars[i - 1].low - bars[i].low
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    trueRanges.push(
      Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      )
    )
  }

  const smoothedPlusDM = ema(plusDM, period)
  const smoothedMinusDM = ema(minusDM, period)
  const smoothedTR = ema(trueRanges, period)

  const dx: number[] = []
  for (let i = 0; i < bars.length; i++) {
    if (isNaN(smoothedPlusDM[i]) || isNaN(smoothedMinusDM[i]) || isNaN(smoothedTR[i]) || smoothedTR[i] === 0) {
      dx.push(NaN)
      continue
    }
    const plusDI = (smoothedPlusDM[i] / smoothedTR[i]) * 100
    const minusDI = (smoothedMinusDM[i] / smoothedTR[i]) * 100
    const sum = plusDI + minusDI
    dx.push(sum === 0 ? 0 : (Math.abs(plusDI - minusDI) / sum) * 100)
  }

  const validDx = dx.filter((v) => !isNaN(v))
  const adxValues = ema(validDx, period)

  let ai = 0
  for (let i = 0; i < bars.length; i++) {
    if (isNaN(dx[i])) {
      result.push(NaN)
    } else {
      result.push(ai < adxValues.length ? adxValues[ai] : NaN)
      ai++
    }
  }

  return result
}

// --- Support & Resistance ---

export function findSupportResistance(
  bars: OHLCV[],
  lookback: number = 20
): { support: number; resistance: number } {
  if (bars.length < lookback) {
    return { support: 0, resistance: 0 }
  }

  const recent = bars.slice(-lookback)
  const lows = recent.map((b) => b.low)
  const highs = recent.map((b) => b.high)

  return {
    support: Math.min(...lows),
    resistance: Math.max(...highs),
  }
}

// --- Compute all indicators for latest bar ---

export function computeIndicators(bars: OHLCV[]): TechnicalIndicators {
  const closes = bars.map((b) => b.close)
  const last = bars.length - 1

  const rsiValues = rsi(closes, 14)
  const macdResult = macd(closes)
  const bbResult = bollingerBands(closes)
  const sma20Values = sma(closes, 20)
  const sma50Values = sma(closes, 50)
  const sma200Values = sma(closes, 200)
  const ema12Values = ema(closes, 12)
  const ema26Values = ema(closes, 26)
  const atr14Values = atr(bars, 14)
  const adx14Values = adx(bars, 14)
  const stochResult = stochastic(bars)
  const obvValues = obv(bars)
  const vwapValues = vwap(bars)
  const sr = findSupportResistance(bars)

  return {
    rsi14: rsiValues[last] ?? 0,
    macd: {
      macd: macdResult.macd[last] ?? 0,
      signal: macdResult.signal[last] ?? 0,
      histogram: macdResult.histogram[last] ?? 0,
    },
    bollingerBands: {
      upper: bbResult.upper[last] ?? 0,
      middle: bbResult.middle[last] ?? 0,
      lower: bbResult.lower[last] ?? 0,
    },
    sma20: sma20Values[last] ?? 0,
    sma50: sma50Values[last] ?? 0,
    sma200: sma200Values[last] ?? 0,
    ema12: ema12Values[last] ?? 0,
    ema26: ema26Values[last] ?? 0,
    atr14: atr14Values[last] ?? 0,
    adx14: adx14Values[last] ?? 0,
    stochastic: {
      k: stochResult.k[last] ?? 0,
      d: stochResult.d[last] ?? 0,
    },
    obv: obvValues[last] ?? 0,
    vwap: vwapValues[last] ?? 0,
    support: sr.support,
    resistance: sr.resistance,
  }
}
