import { useState, useCallback } from 'react'

export type DrawingType = 'hline' | 'fibonacci'

export interface HLineDrawing {
  id: string
  type: 'hline'
  price: number
  label: string
  color: string
}

export interface FibonacciDrawing {
  id: string
  type: 'fibonacci'
  high: number
  low: number
  levels: { ratio: number; price: number; label: string }[]
}

export type Drawing = HLineDrawing | FibonacciDrawing

const FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
const FIB_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444']

export function useChartDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([])

  const addHLine = useCallback((price: number, label?: string, color?: string) => {
    const drawing: HLineDrawing = {
      id: `hline-${Date.now()}`,
      type: 'hline',
      price,
      label: label ?? `$${price.toFixed(2)}`,
      color: color ?? '#f59e0b',
    }
    setDrawings((prev) => [...prev, drawing])
  }, [])

  const addFibonacci = useCallback((high: number, low: number) => {
    const range = high - low
    const levels = FIB_RATIOS.map((ratio) => ({
      ratio,
      price: high - range * ratio,
      label: `${(ratio * 100).toFixed(1)}% ($${(high - range * ratio).toFixed(2)})`,
    }))
    const drawing: FibonacciDrawing = {
      id: `fib-${Date.now()}`,
      type: 'fibonacci',
      high,
      low,
      levels,
    }
    setDrawings((prev) => [...prev, drawing])
  }, [])

  const removeDrawing = useCallback((id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const clearDrawings = useCallback(() => {
    setDrawings([])
  }, [])

  const getFibColors = () => FIB_COLORS

  return {
    drawings,
    addHLine,
    addFibonacci,
    removeDrawing,
    clearDrawings,
    getFibColors,
  }
}
