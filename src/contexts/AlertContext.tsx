import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { Alert, AlertConfig, AlertNotification, Workflow, EvalContext } from '@/types/alerts'
import type { TechnicalIndicators, NewsItem } from '@/types/market'
import { evaluateAll } from '@/engine/AlertEngine'
import { executeWorkflow } from '@/engine/WorkflowExecutor'
import { notificationBus } from '@/engine/notificationBus'
import { usePortfolioContext } from './PortfolioContext'
import { fetchNews } from '@/services/marketData'
import { fetchHistoricalData } from '@/services/marketData'
import { computeIndicators } from '@/lib/analytics/technicals'
import { alerts as alertsApi, workflows as workflowsApi, getToken } from '@/services/api'
import { toast } from 'sonner'
import type { Notification } from '@/components/trading/NotificationCenter'

const ALERTS_KEY = 'aria-quant-alerts-v2'
const WORKFLOWS_KEY = 'aria-quant-workflows'
const HISTORY_KEY = 'aria-quant-alert-history'
const PREV_IND_KEY = 'aria-quant-prev-indicators'

function loadAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }

  // Migrate from old format
  try {
    const old = localStorage.getItem('aria-quant-alerts')
    if (old) {
      const oldAlerts = JSON.parse(old) as Array<{
        id: string; symbol: string; condition: string; value: number;
        createdAt: number; triggered: boolean; triggeredAt?: number
      }>
      const migrated: Alert[] = oldAlerts.map((a) => ({
        id: a.id,
        name: `${a.symbol} ${a.condition.toLowerCase()}`,
        category: 'price' as const,
        status: a.triggered ? 'triggered' as const : 'active' as const,
        createdAt: a.createdAt,
        triggeredAt: a.triggeredAt,
        recurring: false,
        cooldownMs: 300000,
        triggerCount: a.triggered ? 1 : 0,
        symbol: a.symbol,
        condition: a.condition === 'ABOVE' || a.condition === 'RSI_ABOVE' ? 'above' as const : 'below' as const,
        targetValue: a.value,
      }))
      localStorage.setItem(ALERTS_KEY, JSON.stringify(migrated))
      localStorage.removeItem('aria-quant-alerts')
      return migrated
    }
  } catch { /* ignore */ }

  return []
}

function loadWorkflows(): Workflow[] {
  try {
    const raw = localStorage.getItem(WORKFLOWS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function loadHistory(): AlertNotification[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function loadPrevIndicators(): Map<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(PREV_IND_KEY)
    if (raw) return new Map(Object.entries(JSON.parse(raw)))
  } catch { /* ignore */ }
  return new Map()
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

interface AlertContextType {
  alerts: Alert[]
  workflows: Workflow[]
  history: AlertNotification[]
  addAlert: (config: AlertConfig & { name: string; recurring?: boolean; cooldownMs?: number; expiresAt?: number }) => Alert
  removeAlert: (id: string) => void
  pauseAlert: (id: string) => void
  resumeAlert: (id: string) => void
  clearTriggered: () => void
  addWorkflow: (wf: Omit<Workflow, 'id' | 'createdAt' | 'triggerCount'>) => Workflow
  removeWorkflow: (id: string) => void
  toggleWorkflow: (id: string) => void
  clearHistory: () => void
  indicatorCache: Map<string, TechnicalIndicators>
}

const AlertCtx = createContext<AlertContextType | null>(null)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { holdings, totals, watchlistQuotes } = usePortfolioContext()
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts)
  const [workflows, setWorkflows] = useState<Workflow[]>(loadWorkflows)
  const [history, setHistory] = useState<AlertNotification[]>(loadHistory)
  const [indicatorCache, setIndicatorCache] = useState<Map<string, TechnicalIndicators>>(new Map())
  const [newsCache, setNewsCache] = useState<NewsItem[]>([])
  const prevIndicatorsRef = useRef<Map<string, Record<string, number>>>(loadPrevIndicators())
  const lastNewsCheckRef = useRef(0)
  const lastTechCheckRef = useRef(0)

  // Load alerts from API on mount
  useEffect(() => {
    if (!getToken()) return
    alertsApi.list()
      .then((res) => {
        if (res.alerts.length > 0) {
          const mapped: Alert[] = res.alerts.map((a) => ({
            id: String(a.id),
            name: a.name,
            category: a.category as Alert['category'],
            status: a.status as Alert['status'],
            createdAt: new Date(a.created_at).getTime(),
            triggeredAt: a.triggered_at ? new Date(a.triggered_at).getTime() : undefined,
            recurring: a.recurring,
            cooldownMs: a.cooldown_ms,
            triggerCount: a.trigger_count,
            ...(a.config as Record<string, unknown>),
          })) as Alert[]
          setAlerts(mapped)
        }
      })
      .catch(() => { /* fall back to localStorage */ })
  }, [])

  // Persist locally
  useEffect(() => { localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)) }, [alerts])
  useEffect(() => { localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows)) }, [workflows])
  useEffect(() => {
    const capped = history.slice(0, 200)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(capped))
  }, [history])

  // Build quotes map from portfolio context
  const quotesMapRef = useRef(new Map<string, import('@/types/market').Quote>())
  useEffect(() => {
    const map = new Map<string, import('@/types/market').Quote>()
    for (const h of holdings) {
      map.set(h.symbol, {
        symbol: h.symbol, name: h.name, price: h.currentPrice,
        change: h.change, changePercent: h.changePercent,
        open: 0, high: h.high, low: h.low, previousClose: h.previousClose,
        volume: h.volume, avgVolume: 0, marketCap: h.marketCap, pe: h.pe,
        eps: 0, fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0, exchange: '',
      })
    }
    for (const q of watchlistQuotes) {
      map.set(q.symbol, q)
    }
    quotesMapRef.current = map
  }, [holdings, watchlistQuotes])

  // Emit notification helper
  const emitNotification = useCallback((alertNotif: AlertNotification) => {
    const typeMap: Record<string, 'alert' | 'signal' | 'risk'> = {
      price: 'alert', technical: 'signal', volume: 'alert',
      sentiment: 'signal', portfolio: 'risk',
    }
    const notif: Notification = {
      id: `notif-${uid()}`,
      type: typeMap[alertNotif.category] ?? 'alert',
      title: alertNotif.alertName,
      message: alertNotif.message,
      timestamp: alertNotif.timestamp,
      read: false,
    }
    notificationBus.emit(notif)
    toast(alertNotif.alertName, { description: alertNotif.message })

    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(`Aria Quant: ${alertNotif.alertName}`, { body: alertNotif.message })
    }
  }, [])

  // Fetch indicators for symbols with technical alerts
  const fetchIndicators = useCallback(async () => {
    const techSymbols = new Set(
      alerts
        .filter((a) => a.status === 'active' && (a.category === 'technical'))
        .map((a) => (a as Extract<Alert, { category: 'technical' }>).symbol)
    )
    if (techSymbols.size === 0) return

    const newCache = new Map(indicatorCache)
    for (const sym of techSymbols) {
      try {
        const bars = await fetchHistoricalData(sym, '3M')
        if (bars.length >= 50) {
          const ind = computeIndicators(bars)
          newCache.set(sym, ind)
        }
      } catch { /* skip */ }
    }
    setIndicatorCache(newCache)
  }, [alerts, indicatorCache])

  // Main evaluation tick
  const runEvaluation = useCallback(() => {
    const activeAlerts = alerts.filter((a) => a.status === 'active')
    if (activeAlerts.length === 0) return

    const ctx: EvalContext = {
      quotes: quotesMapRef.current,
      indicators: indicatorCache,
      holdings,
      totals: {
        totalValue: totals.totalValue,
        dayChange: totals.dayChange,
        dayChangePercent: totals.dayChangePercent,
      },
      news: newsCache,
      previousIndicatorValues: prevIndicatorsRef.current,
    }

    const results = evaluateAll(activeAlerts, ctx)
    const triggered = results.filter((r) => r.triggered)

    if (triggered.length === 0) return

    setAlerts((prev) => {
      const updated = [...prev]
      for (const result of triggered) {
        const idx = updated.findIndex((a) => a.id === result.alertId)
        if (idx === -1) continue
        const alert = updated[idx]

        if (alert.recurring) {
          updated[idx] = {
            ...alert,
            lastCheckedAt: Date.now(),
            triggerCount: alert.triggerCount + 1,
          }
        } else {
          updated[idx] = {
            ...alert,
            status: 'triggered',
            triggeredAt: Date.now(),
            triggerCount: alert.triggerCount + 1,
          }
        }

        const notif: AlertNotification = {
          alertId: alert.id,
          alertName: alert.name,
          category: alert.category,
          symbol: 'symbol' in alert ? (alert as { symbol: string }).symbol : undefined,
          message: result.message,
          timestamp: Date.now(),
        }
        emitNotification(notif)
        setHistory((prev) => [notif, ...prev].slice(0, 200))

        const matchingWorkflows = workflows.filter((w) => w.enabled && w.triggerAlertId === alert.id)
        for (const wf of matchingWorkflows) {
          executeWorkflow(wf, notif, quotesMapRef.current, {
            addToWatchlist: () => {},
            removeFromWatchlist: () => {},
            addAlert: () => {},
            logJournal: (note) => {
              try {
                const entries = JSON.parse(localStorage.getItem('aria-quant-journal') ?? '[]')
                entries.unshift({ id: uid(), date: new Date().toISOString().split('T')[0], notes: note, trades: [], mood: 3, lessons: '' })
                localStorage.setItem('aria-quant-journal', JSON.stringify(entries))
              } catch { /* skip */ }
            },
            notify: (title, message) => {
              const n: Notification = { id: `wf-${uid()}`, type: 'system', title, message, timestamp: Date.now(), read: false }
              notificationBus.emit(n)
              toast(title, { description: message })
            },
          })
          setWorkflows((prev) => prev.map((w2) =>
            w2.id === wf.id ? { ...w2, lastTriggeredAt: Date.now(), triggerCount: wf.triggerCount + 1 } : w2
          ))
        }
      }
      return updated
    })

    const newPrev = new Map(prevIndicatorsRef.current)
    for (const [sym, ind] of indicatorCache) {
      newPrev.set(sym, {
        macd_macd: ind.macd.macd,
        macd_signal: ind.macd.signal,
        sma50: ind.sma50,
        sma200: ind.sma200,
        rsi14: ind.rsi14,
        stochastic_k: ind.stochastic.k,
      })
    }
    prevIndicatorsRef.current = newPrev
    localStorage.setItem(PREV_IND_KEY, JSON.stringify(Object.fromEntries(newPrev)))
  }, [alerts, holdings, totals, indicatorCache, newsCache, workflows, emitNotification])

  // Polling timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      if (now - lastNewsCheckRef.current > 300000) {
        const sentimentSymbols = alerts
          .filter((a) => a.status === 'active' && a.category === 'sentiment')
          .map((a) => (a as Extract<Alert, { category: 'sentiment' }>).symbol)
        if (sentimentSymbols.length > 0) {
          fetchNews(sentimentSymbols).then(setNewsCache).catch(() => {})
        }
        lastNewsCheckRef.current = now
      }

      if (now - lastTechCheckRef.current > 60000) {
        fetchIndicators()
        lastTechCheckRef.current = now
      }

      runEvaluation()
    }, 10000)

    return () => clearInterval(interval)
  }, [runEvaluation, fetchIndicators, alerts])

  // Actions
  const addAlert = useCallback((config: AlertConfig & { name: string; recurring?: boolean; cooldownMs?: number; expiresAt?: number }): Alert => {
    const { name, recurring, cooldownMs, expiresAt, ...rest } = config
    const alert: Alert = {
      ...rest,
      id: `alert-${uid()}`,
      name,
      status: 'active',
      createdAt: Date.now(),
      recurring: recurring ?? false,
      cooldownMs: cooldownMs ?? 300000,
      expiresAt,
      triggerCount: 0,
    } as Alert
    setAlerts((prev) => [alert, ...prev])

    // Sync to API
    if (getToken()) {
      alertsApi.create({
        name,
        category: rest.category,
        config: rest as unknown as Record<string, unknown>,
        recurring,
        cooldown_ms: cooldownMs,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }).catch(() => { /* ignore */ })
    }

    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission()
    }

    return alert
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    if (getToken()) {
      const numId = parseInt(id)
      if (!isNaN(numId)) alertsApi.destroy(numId).catch(() => { /* ignore */ })
    }
  }, [])

  const pauseAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'paused' as const } : a))
    if (getToken()) {
      const numId = parseInt(id)
      if (!isNaN(numId)) alertsApi.update(numId, { status: 'paused' }).catch(() => { /* ignore */ })
    }
  }, [])

  const resumeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'active' as const } : a))
    if (getToken()) {
      const numId = parseInt(id)
      if (!isNaN(numId)) alertsApi.update(numId, { status: 'active' }).catch(() => { /* ignore */ })
    }
  }, [])

  const clearTriggered = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => a.status !== 'triggered'))
  }, [])

  const addWorkflow = useCallback((wf: Omit<Workflow, 'id' | 'createdAt' | 'triggerCount'>): Workflow => {
    const workflow: Workflow = { ...wf, id: `wf-${uid()}`, createdAt: Date.now(), triggerCount: 0 }
    setWorkflows((prev) => [workflow, ...prev])
    return workflow
  }, [])

  const removeWorkflow = useCallback((id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id))
    if (getToken()) {
      const numId = parseInt(id)
      if (!isNaN(numId)) workflowsApi.destroy(numId).catch(() => { /* ignore */ })
    }
  }, [])

  const toggleWorkflow = useCallback((id: string) => {
    setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return (
    <AlertCtx.Provider value={{
      alerts, workflows, history, indicatorCache,
      addAlert, removeAlert, pauseAlert, resumeAlert, clearTriggered,
      addWorkflow, removeWorkflow, toggleWorkflow, clearHistory,
    }}>
      {children}
    </AlertCtx.Provider>
  )
}

export function useAlertContext() {
  const ctx = useContext(AlertCtx)
  if (!ctx) throw new Error('useAlertContext must be used within AlertProvider')
  return ctx
}
