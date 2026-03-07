import { useState, useEffect, useCallback } from 'react'

export type AlertCondition = 'ABOVE' | 'BELOW' | 'RSI_ABOVE' | 'RSI_BELOW'

export interface PriceAlert {
  id: string
  symbol: string
  condition: AlertCondition
  value: number
  createdAt: number
  triggered: boolean
  triggeredAt?: number
}

const ALERTS_KEY = 'aria-quant-alerts'

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts)

  useEffect(() => { saveAlerts(alerts) }, [alerts])

  const addAlert = useCallback((params: {
    symbol: string
    condition: AlertCondition
    value: number
  }) => {
    const alert: PriceAlert = {
      id: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      symbol: params.symbol.toUpperCase(),
      condition: params.condition,
      value: params.value,
      createdAt: Date.now(),
      triggered: false,
    }
    setAlerts((prev) => [alert, ...prev])
    return alert
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const checkAlerts = useCallback((prices: Map<string, number>) => {
    setAlerts((prev) => {
      let changed = false
      const updated = prev.map((alert) => {
        if (alert.triggered) return alert
        const price = prices.get(alert.symbol)
        if (!price) return alert

        let shouldTrigger = false
        if (alert.condition === 'ABOVE' && price >= alert.value) shouldTrigger = true
        if (alert.condition === 'BELOW' && price <= alert.value) shouldTrigger = true

        if (shouldTrigger) {
          changed = true
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Aria Quant Alert: ${alert.symbol}`, {
              body: `${alert.symbol} is ${alert.condition === 'ABOVE' ? 'above' : 'below'} $${alert.value.toFixed(2)} (now $${price.toFixed(2)})`,
            })
          }
          return { ...alert, triggered: true, triggeredAt: Date.now() }
        }
        return alert
      })
      return changed ? updated : prev
    })
  }, [])

  const clearTriggered = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.triggered))
  }, [])

  const activeAlerts = alerts.filter((a) => !a.triggered)
  const triggeredAlerts = alerts.filter((a) => a.triggered)

  return {
    alerts,
    activeAlerts,
    triggeredAlerts,
    addAlert,
    removeAlert,
    checkAlerts,
    clearTriggered,
  }
}
