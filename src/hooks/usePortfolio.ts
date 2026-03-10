import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Quote } from '@/types/market'
import { fetchMultipleQuotes } from '@/services/marketData'
import { isAlpacaConnected, fetchAccount, fetchPositions } from '@/services/alpaca'
import { portfolio as portfolioApi, watchlists as watchlistsApi, getToken } from '@/services/api'

export interface HoldingInput {
  symbol: string
  quantity: number
  avgCost: number
}

export interface Holding extends HoldingInput {
  name: string
  currentPrice: number
  change: number
  changePercent: number
  marketValue: number
  costBasis: number
  totalGain: number
  totalGainPercent: number
  dayGain: number
  weight: number
  previousClose: number
  high: number
  low: number
  volume: number
  pe: number
  marketCap: number
}

export interface PortfolioState {
  holdings: HoldingInput[]
  watchlist: string[]
  cash: number
}

const STORAGE_KEY = 'aria-quant-portfolio'

const DEFAULT_STATE: PortfolioState = {
  holdings: [
    { symbol: 'NVDA', quantity: 200, avgCost: 485.60 },
    { symbol: 'AAPL', quantity: 150, avgCost: 172.50 },
    { symbol: 'MSFT', quantity: 80, avgCost: 378.20 },
    { symbol: 'GOOGL', quantity: 120, avgCost: 138.45 },
    { symbol: 'AMZN', quantity: 90, avgCost: 145.80 },
    { symbol: 'META', quantity: 60, avgCost: 325.40 },
    { symbol: 'TSLA', quantity: 100, avgCost: 248.90 },
    { symbol: 'JPM', quantity: 75, avgCost: 168.30 },
  ],
  watchlist: ['AMD', 'PLTR', 'SOFI', 'COIN', 'RIVN', 'SQ', 'CRWD', 'SNOW', 'ARM', 'SMCI'],
  cash: 48250,
}

function loadState(): PortfolioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return DEFAULT_STATE
}

function saveState(state: PortfolioState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function usePortfolio() {
  const [state, setState] = useState<PortfolioState>(loadState)
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alpacaSynced, setAlpacaSynced] = useState(false)
  const [apiSynced, setApiSynced] = useState(false)

  // Persist state changes to localStorage + API
  useEffect(() => {
    saveState(state)

    // Debounced API sync when authenticated
    if (!getToken() || !apiSynced) return
    const timer = setTimeout(() => {
      portfolioApi.sync(
        state.holdings.map((h) => ({ symbol: h.symbol, quantity: h.quantity, avg_cost: h.avgCost })),
        state.cash
      ).catch(() => { /* ignore sync errors */ })
    }, 2000)
    return () => clearTimeout(timer)
  }, [state, apiSynced])

  // Load portfolio from API on mount when authenticated
  useEffect(() => {
    if (!getToken()) return
    portfolioApi.get()
      .then((res) => {
        if (res.holdings.length > 0) {
          setState((prev) => ({
            holdings: res.holdings.map((h) => ({ symbol: h.symbol, quantity: h.quantity, avgCost: h.avg_cost })),
            watchlist: prev.watchlist,
            cash: res.cash,
          }))
        }
        setApiSynced(true)
      })
      .catch(() => { setApiSynced(true) })
  }, [])

  // Load watchlist from API
  useEffect(() => {
    if (!getToken()) return
    watchlistsApi.list()
      .then((res) => {
        const defaultWl = res.watchlists.find((w) => w.category === 'stocks')
        if (defaultWl && defaultWl.items.length > 0) {
          setState((prev) => ({
            ...prev,
            watchlist: defaultWl.items.map((i) => i.symbol),
          }))
        }
      })
      .catch(() => { /* ignore */ })
  }, [])

  // Sync holdings and cash from Alpaca when connected
  const syncAlpacaPortfolio = useCallback(async () => {
    if (!isAlpacaConnected()) return
    try {
      const [account, positions] = await Promise.all([fetchAccount(), fetchPositions()])
      const alpacaHoldings: HoldingInput[] = positions.map((p) => ({
        symbol: p.symbol,
        quantity: Math.abs(Number(p.qty)),
        avgCost: Number(p.avg_entry_price),
      }))
      setState((prev) => ({
        ...prev,
        holdings: alpacaHoldings.length > 0 ? alpacaHoldings : prev.holdings,
        cash: Number(account.cash),
      }))
      setAlpacaSynced(true)
    } catch { /* ignore sync errors, fall back to local data */ }
  }, [])

  useEffect(() => {
    syncAlpacaPortfolio()
  }, [syncAlpacaPortfolio])

  // Fetch live quotes for all holdings
  const allSymbols = useMemo(() => {
    const symbols = new Set(state.holdings.map((h) => h.symbol))
    state.watchlist.forEach((s) => symbols.add(s))
    return Array.from(symbols)
  }, [state.holdings, state.watchlist])

  const refreshQuotes = useCallback(() => {
    if (allSymbols.length === 0) return
    setLoading(true)
    setError(null)
    fetchMultipleQuotes(allSymbols)
      .then((results) => {
        const map = new Map<string, Quote>()
        results.forEach((q) => map.set(q.symbol, q))
        setQuotes(map)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [allSymbols.join(',')])

  useEffect(() => { refreshQuotes() }, [refreshQuotes])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshQuotes, 30000)
    return () => clearInterval(interval)
  }, [refreshQuotes])

  // Computed holdings with live data
  const holdings: Holding[] = useMemo(() => {
    const totalValue = state.holdings.reduce((sum, h) => {
      const q = quotes.get(h.symbol)
      return sum + (q ? q.price * h.quantity : h.avgCost * h.quantity)
    }, 0) + state.cash

    return state.holdings.map((h) => {
      const q = quotes.get(h.symbol)
      const price = q?.price ?? h.avgCost
      const marketValue = price * h.quantity
      const costBasis = h.avgCost * h.quantity
      const totalGain = marketValue - costBasis

      return {
        ...h,
        name: q?.name ?? h.symbol,
        currentPrice: price,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        marketValue,
        costBasis,
        totalGain,
        totalGainPercent: costBasis > 0 ? (totalGain / costBasis) * 100 : 0,
        dayGain: (q?.change ?? 0) * h.quantity,
        weight: totalValue > 0 ? (marketValue / totalValue) * 100 : 0,
        previousClose: q?.previousClose ?? 0,
        high: q?.high ?? 0,
        low: q?.low ?? 0,
        volume: q?.volume ?? 0,
        pe: q?.pe ?? 0,
        marketCap: q?.marketCap ?? 0,
      }
    })
  }, [state.holdings, state.cash, quotes])

  // Watchlist with live data
  const watchlistQuotes: Quote[] = useMemo(() => {
    return state.watchlist
      .map((s) => quotes.get(s))
      .filter((q): q is Quote => q !== undefined)
  }, [state.watchlist, quotes])

  // Portfolio totals
  const totals = useMemo(() => {
    const totalMarketValue = holdings.reduce((s, h) => s + h.marketValue, 0)
    const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0)
    const totalGain = totalMarketValue - totalCost
    const dayChange = holdings.reduce((s, h) => s + h.dayGain, 0)
    const totalValue = totalMarketValue + state.cash
    const winners = holdings.filter((h) => h.totalGain >= 0).length

    return {
      totalValue,
      totalMarketValue,
      totalCost,
      totalGain,
      totalGainPercent: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
      dayChange,
      dayChangePercent: totalMarketValue - dayChange > 0 ? (dayChange / (totalMarketValue - dayChange)) * 100 : 0,
      cash: state.cash,
      positionCount: holdings.length,
      winners,
      losers: holdings.length - winners,
    }
  }, [holdings, state.cash])

  // Actions
  const addHolding = useCallback((holding: HoldingInput) => {
    setState((prev) => ({
      ...prev,
      holdings: [...prev.holdings.filter((h) => h.symbol !== holding.symbol), holding],
    }))
  }, [])

  const removeHolding = useCallback((symbol: string) => {
    setState((prev) => ({
      ...prev,
      holdings: prev.holdings.filter((h) => h.symbol !== symbol),
    }))
  }, [])

  const addToWatchlist = useCallback((symbol: string) => {
    setState((prev) => ({
      ...prev,
      watchlist: prev.watchlist.includes(symbol) ? prev.watchlist : [...prev.watchlist, symbol],
    }))
  }, [])

  const removeFromWatchlist = useCallback((symbol: string) => {
    setState((prev) => ({
      ...prev,
      watchlist: prev.watchlist.filter((s) => s !== symbol),
    }))
  }, [])

  const setCash = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, cash: amount }))
  }, [])

  return {
    holdings,
    watchlistQuotes,
    watchlistSymbols: state.watchlist,
    totals,
    loading,
    error,
    alpacaSynced,
    refreshQuotes,
    syncAlpacaPortfolio,
    addHolding,
    removeHolding,
    addToWatchlist,
    removeFromWatchlist,
    setCash,
  }
}
