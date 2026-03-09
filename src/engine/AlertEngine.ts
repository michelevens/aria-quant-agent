import type { Alert, AlertResult, EvalContext } from '@/types/alerts'

export function evaluateAlert(alert: Alert, ctx: EvalContext): AlertResult {
  const base = { alertId: alert.id, triggered: false, message: '' }

  switch (alert.category) {
    case 'price':
      return evaluatePrice(alert, ctx)
    case 'technical':
      return evaluateTechnical(alert, ctx)
    case 'volume':
      return evaluateVolume(alert, ctx)
    case 'sentiment':
      return evaluateSentiment(alert, ctx)
    case 'portfolio':
      return evaluatePortfolio(alert, ctx)
    default:
      return base
  }
}

export function evaluateAll(alerts: Alert[], ctx: EvalContext): AlertResult[] {
  return alerts
    .filter((a) => a.status === 'active')
    .filter((a) => {
      if (a.expiresAt && Date.now() > a.expiresAt) return false
      if (a.lastCheckedAt && a.cooldownMs > 0 && Date.now() - a.lastCheckedAt < a.cooldownMs) return false
      return true
    })
    .map((a) => evaluateAlert(a, ctx))
}

// --- Price Alerts ---

function evaluatePrice(alert: Extract<Alert, { category: 'price' }>, ctx: EvalContext): AlertResult {
  const base = { alertId: alert.id, triggered: false, message: '' }
  const quote = ctx.quotes.get(alert.symbol)
  if (!quote) return base

  const price = quote.price

  if (alert.condition === 'above' && price >= alert.targetValue) {
    return {
      alertId: alert.id,
      triggered: true,
      message: `${alert.symbol} is above $${alert.targetValue.toFixed(2)} (now $${price.toFixed(2)})`,
      currentValue: price,
    }
  }

  if (alert.condition === 'below' && price <= alert.targetValue) {
    return {
      alertId: alert.id,
      triggered: true,
      message: `${alert.symbol} is below $${alert.targetValue.toFixed(2)} (now $${price.toFixed(2)})`,
      currentValue: price,
    }
  }

  if (alert.condition === 'percent_change') {
    const ref = alert.referencePrice ?? quote.previousClose
    if (ref > 0) {
      const pctChange = ((price - ref) / ref) * 100
      if (Math.abs(pctChange) >= Math.abs(alert.targetValue)) {
        return {
          alertId: alert.id,
          triggered: true,
          message: `${alert.symbol} moved ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}% (target: ${alert.targetValue}%)`,
          currentValue: pctChange,
        }
      }
    }
  }

  return base
}

// --- Technical Alerts ---

function evaluateTechnical(alert: Extract<Alert, { category: 'technical' }>, ctx: EvalContext): AlertResult {
  const base = { alertId: alert.id, triggered: false, message: '' }
  const ind = ctx.indicators.get(alert.symbol)
  if (!ind) return base

  const prev = ctx.previousIndicatorValues.get(alert.symbol)

  switch (alert.indicator) {
    case 'rsi': {
      const val = ind.rsi14
      if (alert.condition === 'above' && val >= (alert.threshold ?? 70)) {
        return { alertId: alert.id, triggered: true, message: `${alert.symbol} RSI above ${alert.threshold ?? 70} (now ${val.toFixed(1)})`, currentValue: val }
      }
      if (alert.condition === 'below' && val <= (alert.threshold ?? 30)) {
        return { alertId: alert.id, triggered: true, message: `${alert.symbol} RSI below ${alert.threshold ?? 30} (now ${val.toFixed(1)})`, currentValue: val }
      }
      break
    }

    case 'macd_crossover': {
      const prevMacd = prev?.macd_macd
      const prevSignal = prev?.macd_signal
      if (prevMacd !== undefined && prevSignal !== undefined) {
        const wasBullish = prevMacd > prevSignal
        const isBullish = ind.macd.macd > ind.macd.signal
        if (alert.condition === 'crosses_above' && !wasBullish && isBullish) {
          return { alertId: alert.id, triggered: true, message: `${alert.symbol} MACD bullish crossover`, currentValue: ind.macd.macd }
        }
        if (alert.condition === 'crosses_below' && wasBullish && !isBullish) {
          return { alertId: alert.id, triggered: true, message: `${alert.symbol} MACD bearish crossover`, currentValue: ind.macd.macd }
        }
      }
      break
    }

    case 'bollinger_breach': {
      const quote = ctx.quotes.get(alert.symbol)
      if (quote) {
        if (alert.condition === 'above' && quote.price >= ind.bollingerBands.upper) {
          return { alertId: alert.id, triggered: true, message: `${alert.symbol} breached upper Bollinger Band ($${ind.bollingerBands.upper.toFixed(2)})`, currentValue: quote.price }
        }
        if (alert.condition === 'below' && quote.price <= ind.bollingerBands.lower) {
          return { alertId: alert.id, triggered: true, message: `${alert.symbol} breached lower Bollinger Band ($${ind.bollingerBands.lower.toFixed(2)})`, currentValue: quote.price }
        }
      }
      break
    }

    case 'sma_crossover': {
      const prevSma50 = prev?.sma50
      const prevSma200 = prev?.sma200
      if (prevSma50 !== undefined && prevSma200 !== undefined) {
        const wasGolden = prevSma50 > prevSma200
        const isGolden = ind.sma50 > ind.sma200
        if (alert.condition === 'crosses_above' && !wasGolden && isGolden) {
          return { alertId: alert.id, triggered: true, message: `${alert.symbol} Golden Cross (SMA50 crossed above SMA200)`, currentValue: ind.sma50 }
        }
        if (alert.condition === 'crosses_below' && wasGolden && !isGolden) {
          return { alertId: alert.id, triggered: true, message: `${alert.symbol} Death Cross (SMA50 crossed below SMA200)`, currentValue: ind.sma50 }
        }
      }
      break
    }

    case 'stochastic': {
      const val = ind.stochastic.k
      if (alert.condition === 'above' && val >= (alert.threshold ?? 80)) {
        return { alertId: alert.id, triggered: true, message: `${alert.symbol} Stochastic overbought (%K=${val.toFixed(1)})`, currentValue: val }
      }
      if (alert.condition === 'below' && val <= (alert.threshold ?? 20)) {
        return { alertId: alert.id, triggered: true, message: `${alert.symbol} Stochastic oversold (%K=${val.toFixed(1)})`, currentValue: val }
      }
      break
    }
  }

  return base
}

// --- Volume Alerts ---

function evaluateVolume(alert: Extract<Alert, { category: 'volume' }>, ctx: EvalContext): AlertResult {
  const base = { alertId: alert.id, triggered: false, message: '' }
  const quote = ctx.quotes.get(alert.symbol)
  if (!quote || quote.avgVolume <= 0) return base

  const ratio = quote.volume / quote.avgVolume

  if (ratio >= alert.multiplier) {
    if (alert.direction === 'up' && quote.changePercent <= 0) return base
    if (alert.direction === 'down' && quote.changePercent >= 0) return base

    return {
      alertId: alert.id,
      triggered: true,
      message: `${alert.symbol} volume spike ${ratio.toFixed(1)}x avg (${alert.direction === 'any' ? 'any direction' : quote.changePercent >= 0 ? 'up move' : 'down move'})`,
      currentValue: ratio,
    }
  }

  return base
}

// --- Sentiment Alerts ---

function evaluateSentiment(alert: Extract<Alert, { category: 'sentiment' }>, ctx: EvalContext): AlertResult {
  const base = { alertId: alert.id, triggered: false, message: '' }
  const matchingNews = ctx.news.filter(
    (n) => n.relatedSymbols.includes(alert.symbol) && n.sentiment === alert.targetSentiment
  )

  if (matchingNews.length > 0) {
    const latest = matchingNews[0]
    return {
      alertId: alert.id,
      triggered: true,
      message: `${alert.targetSentiment} news for ${alert.symbol}: "${latest.title}"`,
      currentValue: matchingNews.length,
    }
  }

  return base
}

// --- Portfolio Alerts ---

function evaluatePortfolio(alert: Extract<Alert, { category: 'portfolio' }>, ctx: EvalContext): AlertResult {
  const base = { alertId: alert.id, triggered: false, message: '' }

  switch (alert.metric) {
    case 'position_pnl_percent': {
      if (!alert.symbol) return base
      const holding = ctx.holdings.find((h) => h.symbol === alert.symbol)
      if (!holding) return base
      if (holding.totalGainPercent <= alert.threshold) {
        return { alertId: alert.id, triggered: true, message: `${alert.symbol} P&L at ${holding.totalGainPercent.toFixed(2)}% (threshold: ${alert.threshold}%)`, currentValue: holding.totalGainPercent }
      }
      break
    }

    case 'position_pnl_dollar': {
      if (!alert.symbol) return base
      const holding = ctx.holdings.find((h) => h.symbol === alert.symbol)
      if (!holding) return base
      if (holding.totalGain <= alert.threshold) {
        return { alertId: alert.id, triggered: true, message: `${alert.symbol} P&L at $${holding.totalGain.toFixed(2)} (threshold: $${alert.threshold})`, currentValue: holding.totalGain }
      }
      break
    }

    case 'daily_loss_percent': {
      if (ctx.totals.dayChangePercent <= alert.threshold) {
        return { alertId: alert.id, triggered: true, message: `Daily portfolio loss at ${ctx.totals.dayChangePercent.toFixed(2)}% (threshold: ${alert.threshold}%)`, currentValue: ctx.totals.dayChangePercent }
      }
      break
    }

    case 'daily_loss_dollar': {
      if (ctx.totals.dayChange <= alert.threshold) {
        return { alertId: alert.id, triggered: true, message: `Daily portfolio loss at $${ctx.totals.dayChange.toFixed(2)} (threshold: $${alert.threshold})`, currentValue: ctx.totals.dayChange }
      }
      break
    }

    case 'portfolio_value_below': {
      if (ctx.totals.totalValue <= alert.threshold) {
        return { alertId: alert.id, triggered: true, message: `Portfolio value $${ctx.totals.totalValue.toFixed(0)} below $${alert.threshold}`, currentValue: ctx.totals.totalValue }
      }
      break
    }

    case 'portfolio_value_above': {
      if (ctx.totals.totalValue >= alert.threshold) {
        return { alertId: alert.id, triggered: true, message: `Portfolio value $${ctx.totals.totalValue.toFixed(0)} above $${alert.threshold}`, currentValue: ctx.totals.totalValue }
      }
      break
    }
  }

  return base
}
