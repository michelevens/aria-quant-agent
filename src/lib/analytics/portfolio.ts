import type { OHLCV, PortfolioMetrics, CorrelationMatrix } from '@/types/market'

// --- Returns ---

export function dailyReturns(bars: OHLCV[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < bars.length; i++) {
    if (bars[i - 1].close > 0) {
      returns.push((bars[i].close - bars[i - 1].close) / bars[i - 1].close)
    }
  }
  return returns
}

export function logReturns(bars: OHLCV[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < bars.length; i++) {
    if (bars[i - 1].close > 0 && bars[i].close > 0) {
      returns.push(Math.log(bars[i].close / bars[i - 1].close))
    }
  }
  return returns
}

// --- Statistical Functions ---

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

export function stddev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

export function downside_deviation(returns: number[], mar: number = 0): number {
  const downside = returns.filter((r) => r < mar).map((r) => (r - mar) ** 2)
  if (downside.length === 0) return 0
  return Math.sqrt(downside.reduce((s, v) => s + v, 0) / returns.length)
}

export function covariance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return 0
  const ma = mean(a.slice(0, n))
  const mb = mean(b.slice(0, n))
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += (a[i] - ma) * (b[i] - mb)
  }
  return sum / (n - 1)
}

export function correlation(a: number[], b: number[]): number {
  const cov = covariance(a, b)
  const sdA = stddev(a)
  const sdB = stddev(b)
  if (sdA === 0 || sdB === 0) return 0
  return cov / (sdA * sdB)
}

// --- Risk Metrics ---

export function sharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.05,
  annualizationFactor: number = 252
): number {
  const annualReturn = mean(returns) * annualizationFactor
  const annualVol = stddev(returns) * Math.sqrt(annualizationFactor)
  if (annualVol === 0) return 0
  return (annualReturn - riskFreeRate) / annualVol
}

export function sortinoRatio(
  returns: number[],
  riskFreeRate: number = 0.05,
  annualizationFactor: number = 252
): number {
  const annualReturn = mean(returns) * annualizationFactor
  const dd = downside_deviation(returns) * Math.sqrt(annualizationFactor)
  if (dd === 0) return 0
  return (annualReturn - riskFreeRate) / dd
}

export function maxDrawdown(bars: OHLCV[]): number {
  let peak = -Infinity
  let maxDD = 0
  for (const bar of bars) {
    if (bar.close > peak) peak = bar.close
    const dd = (peak - bar.close) / peak
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}

export function calmarRatio(
  returns: number[],
  bars: OHLCV[],
  annualizationFactor: number = 252
): number {
  const annualReturn = mean(returns) * annualizationFactor
  const mdd = maxDrawdown(bars)
  if (mdd === 0) return 0
  return annualReturn / mdd
}

export function valueAtRisk(
  returns: number[],
  confidence: number = 0.95,
  portfolioValue: number = 100000
): number {
  const sorted = [...returns].sort((a, b) => a - b)
  const idx = Math.floor((1 - confidence) * sorted.length)
  const varReturn = sorted[idx] ?? 0
  return Math.abs(varReturn * portfolioValue)
}

export function beta(
  assetReturns: number[],
  benchmarkReturns: number[]
): number {
  const cov = covariance(assetReturns, benchmarkReturns)
  const benchVar = stddev(benchmarkReturns) ** 2
  if (benchVar === 0) return 1
  return cov / benchVar
}

export function alpha(
  assetReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number = 0.05,
  annualizationFactor: number = 252
): number {
  const b = beta(assetReturns, benchmarkReturns)
  const assetAnnual = mean(assetReturns) * annualizationFactor
  const benchAnnual = mean(benchmarkReturns) * annualizationFactor
  return assetAnnual - (riskFreeRate + b * (benchAnnual - riskFreeRate))
}

export function informationRatio(
  assetReturns: number[],
  benchmarkReturns: number[],
  annualizationFactor: number = 252
): number {
  const n = Math.min(assetReturns.length, benchmarkReturns.length)
  const excess = assetReturns.slice(0, n).map((r, i) => r - benchmarkReturns[i])
  const trackingError = stddev(excess) * Math.sqrt(annualizationFactor)
  if (trackingError === 0) return 0
  return (mean(excess) * annualizationFactor) / trackingError
}

export function treynorRatio(
  returns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number = 0.05,
  annualizationFactor: number = 252
): number {
  const b = beta(returns, benchmarkReturns)
  if (b === 0) return 0
  const annualReturn = mean(returns) * annualizationFactor
  return (annualReturn - riskFreeRate) / b
}

// --- Correlation Matrix ---

export function correlationMatrix(
  symbols: string[],
  returnsSets: number[][]
): CorrelationMatrix {
  const n = symbols.length
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0)
  )

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1
      } else if (j > i) {
        const corr = correlation(returnsSets[i], returnsSets[j])
        matrix[i][j] = corr
        matrix[j][i] = corr
      }
    }
  }

  return { symbols, matrix }
}

// --- Portfolio-Level Metrics ---

export function computePortfolioMetrics(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  bars: OHLCV[],
  totalValue: number,
  totalCost: number,
  dayChange: number
): PortfolioMetrics {
  const totalGain = totalValue - totalCost
  const vol = stddev(portfolioReturns) * Math.sqrt(252)

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
    dayChange,
    dayChangePercent: totalValue - dayChange > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0,
    buyingPower: 48250,
    sharpeRatio: sharpeRatio(portfolioReturns),
    beta: beta(portfolioReturns, benchmarkReturns),
    alpha: alpha(portfolioReturns, benchmarkReturns),
    maxDrawdown: maxDrawdown(bars) * 100,
    var95: valueAtRisk(portfolioReturns, 0.95, totalValue),
    var99: valueAtRisk(portfolioReturns, 0.99, totalValue),
    volatility: vol * 100,
    sortino: sortinoRatio(portfolioReturns),
    calmarRatio: calmarRatio(portfolioReturns, bars),
    informationRatio: informationRatio(portfolioReturns, benchmarkReturns),
    treynorRatio: treynorRatio(portfolioReturns, benchmarkReturns),
  }
}
