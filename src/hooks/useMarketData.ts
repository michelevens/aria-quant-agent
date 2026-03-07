import { useState, useEffect, useCallback } from 'react'
import type { OHLCV, Quote, TimeRange, TechnicalIndicators, Signal } from '@/types/market'
import { fetchHistoricalData, fetchQuote, fetchMultipleQuotes, fetchMarketIndices } from '@/services/marketData'
import { computeIndicators } from '@/lib/analytics/technicals'
import { generateSignal } from '@/lib/strategies/signals'

interface UseChartDataResult {
  data: OHLCV[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useChartData(symbol: string, range: TimeRange = '1Y'): UseChartDataResult {
  const [data, setData] = useState<OHLCV[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchHistoricalData(symbol, range)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbol, range])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch }
}

export function useQuote(symbol: string) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchQuote(symbol)
      .then(setQuote)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbol])

  return { quote, loading, error }
}

export function useMultipleQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (symbols.length === 0) return
    setLoading(true)
    fetchMultipleQuotes(symbols)
      .then(setQuotes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbols.join(',')])

  return { quotes, loading, error }
}

export function useMarketIndices() {
  const [indices, setIndices] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketIndices()
      .then(setIndices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { indices, loading, error }
}

export function useTechnicalAnalysis(symbol: string, range: TimeRange = '1Y') {
  const { data, loading: chartLoading, error: chartError } = useChartData(symbol, range)
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null)
  const [signal, setSignal] = useState<Signal | null>(null)

  useEffect(() => {
    if (data.length === 0) return

    const ind = computeIndicators(data)
    setIndicators(ind)

    const sig = generateSignal(symbol, data)
    setSignal(sig)
  }, [data, symbol])

  return {
    data,
    indicators,
    signal,
    loading: chartLoading,
    error: chartError,
  }
}
