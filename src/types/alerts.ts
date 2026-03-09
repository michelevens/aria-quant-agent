import type { Signal, TechnicalIndicators, Quote, NewsItem } from './market'
import type { Holding } from '@/hooks/usePortfolio'

// --- Alert Category & Status ---

export type AlertCategory = 'price' | 'technical' | 'volume' | 'sentiment' | 'portfolio'
export type AlertStatus = 'active' | 'triggered' | 'paused' | 'expired'

// --- Base alert fields ---

export interface AlertBase {
  id: string
  name: string
  category: AlertCategory
  status: AlertStatus
  createdAt: number
  triggeredAt?: number
  lastCheckedAt?: number
  recurring: boolean
  cooldownMs: number
  expiresAt?: number
  triggerCount: number
}

// --- Per-category configs ---

export interface PriceAlertConfig {
  category: 'price'
  symbol: string
  condition: 'above' | 'below' | 'percent_change'
  targetValue: number
  referencePrice?: number
}

export interface TechnicalAlertConfig {
  category: 'technical'
  symbol: string
  indicator: 'rsi' | 'macd_crossover' | 'bollinger_breach' | 'sma_crossover' | 'stochastic'
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below'
  threshold?: number
}

export interface VolumeAlertConfig {
  category: 'volume'
  symbol: string
  multiplier: number
  direction: 'any' | 'up' | 'down'
}

export interface SentimentAlertConfig {
  category: 'sentiment'
  symbol: string
  targetSentiment: 'bullish' | 'bearish'
}

export interface PortfolioAlertConfig {
  category: 'portfolio'
  metric: 'position_pnl_percent' | 'position_pnl_dollar' | 'daily_loss_percent' | 'daily_loss_dollar' | 'portfolio_value_below' | 'portfolio_value_above'
  symbol?: string
  threshold: number
}

export type AlertConfig = PriceAlertConfig | TechnicalAlertConfig | VolumeAlertConfig | SentimentAlertConfig | PortfolioAlertConfig
export type Alert = AlertBase & AlertConfig

// --- Workflow / Trigger System ---

export type WorkflowActionType = 'notify' | 'add_to_watchlist' | 'remove_from_watchlist' | 'create_alert' | 'log_journal'

export interface WorkflowAction {
  type: WorkflowActionType
  params: Record<string, string | number | boolean>
}

export interface WorkflowCondition {
  type: 'price_above' | 'price_below' | 'market_hours_only'
  params: Record<string, string | number>
}

export interface Workflow {
  id: string
  name: string
  enabled: boolean
  triggerAlertId: string
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  createdAt: number
  lastTriggeredAt?: number
  triggerCount: number
}

// --- Signal Snapshot ---

export interface SignalSnapshot {
  signal: Signal
  indicators: TechnicalIndicators
  computedAt: number
}

// --- Alert Notification ---

export interface AlertNotification {
  alertId: string
  alertName: string
  category: AlertCategory
  symbol?: string
  message: string
  timestamp: number
}

// --- Evaluation Context ---

export interface EvalContext {
  quotes: Map<string, Quote>
  indicators: Map<string, TechnicalIndicators>
  holdings: Holding[]
  totals: {
    totalValue: number
    dayChange: number
    dayChangePercent: number
  }
  news: NewsItem[]
  previousIndicatorValues: Map<string, Record<string, number>>
}

// --- Alert Result ---

export interface AlertResult {
  alertId: string
  triggered: boolean
  message: string
  currentValue?: number
}
