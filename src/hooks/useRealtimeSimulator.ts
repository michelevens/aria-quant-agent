import { useEffect, useRef, useCallback, useState } from 'react'
import type { Quote } from '@/types/market'

/**
 * Simulates real-time price updates by applying small random jitter
 * to existing quote data at a configurable interval.
 * This creates a "live market" feel without actual WebSocket connections.
 */
export function useRealtimeSimulator(
  baseQuotes: Quote[],
  intervalMs = 3000,
  enabled = true
): Quote[] {
  const [quotes, setQuotes] = useState<Quote[]>(baseQuotes)
  const baseRef = useRef(baseQuotes)

  // Keep base quotes in sync when they change (from actual API fetches)
  useEffect(() => {
    baseRef.current = baseQuotes
    setQuotes(baseQuotes)
  }, [baseQuotes])

  const tick = useCallback(() => {
    setQuotes((prev) =>
      prev.map((q) => {
        // Random jitter: ±0.15% max per tick
        const jitter = (Math.random() - 0.5) * 0.003 * q.price
        const newPrice = Math.max(0.01, q.price + jitter)
        const base = baseRef.current.find((b) => b.symbol === q.symbol)
        const previousClose = base?.previousClose ?? q.previousClose
        const change = previousClose > 0 ? newPrice - previousClose : 0
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

        return {
          ...q,
          price: newPrice,
          change,
          changePercent,
          high: Math.max(q.high, newPrice),
          low: Math.min(q.low, newPrice),
        }
      })
    )
  }, [])

  useEffect(() => {
    if (!enabled || baseQuotes.length === 0) return
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [enabled, intervalMs, tick, baseQuotes.length])

  return quotes
}
