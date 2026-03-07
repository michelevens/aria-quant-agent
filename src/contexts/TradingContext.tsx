import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useTradingEngine } from '@/hooks/useTradingEngine'

type TradingEngine = ReturnType<typeof useTradingEngine>

const TradingContext = createContext<TradingEngine | null>(null)

export function TradingProvider({ children }: { children: ReactNode }) {
  const engine = useTradingEngine()
  return <TradingContext.Provider value={engine}>{children}</TradingContext.Provider>
}

export function useTradingContext() {
  const ctx = useContext(TradingContext)
  if (!ctx) throw new Error('useTradingContext must be used within TradingProvider')
  return ctx
}
