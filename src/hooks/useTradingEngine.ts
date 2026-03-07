import { useState, useEffect, useCallback } from 'react'

export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'TRAILING_STOP' | 'OCO' | 'BRACKET'
export type OrderStatus = 'OPEN' | 'FILLED' | 'PARTIAL' | 'CANCELLED'
export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK'

export interface Order {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  limitPrice?: number
  stopPrice?: number
  trailAmount?: number
  trailPercent?: number
  bracketTakeProfit?: number
  bracketStopLoss?: number
  linkedOrderId?: string
  parentOrderId?: string
  tif: TimeInForce
  status: OrderStatus
  filledQty: number
  filledPrice: number
  createdAt: number
  filledAt?: number
  pnl?: number
}

export interface TradeRecord {
  id: string
  orderId: string
  symbol: string
  side: OrderSide
  quantity: number
  price: number
  total: number
  timestamp: number
}

interface TradingState {
  orders: Order[]
  trades: TradeRecord[]
}

const TRADING_KEY = 'aria-quant-trading'

function loadTradingState(): TradingState {
  try {
    const raw = localStorage.getItem(TRADING_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { orders: [], trades: [] }
}

function saveTradingState(state: TradingState) {
  localStorage.setItem(TRADING_KEY, JSON.stringify(state))
}

export function useTradingEngine() {
  const [state, setState] = useState<TradingState>(loadTradingState)

  useEffect(() => { saveTradingState(state) }, [state])

  const placeOrder = useCallback((params: {
    symbol: string
    side: OrderSide
    type: OrderType
    quantity: number
    limitPrice?: number
    stopPrice?: number
    trailAmount?: number
    trailPercent?: number
    bracketTakeProfit?: number
    bracketStopLoss?: number
    tif: TimeInForce
    currentPrice: number
  }): Order => {
    const { symbol, side, type, quantity, limitPrice, stopPrice, tif, currentPrice, trailAmount, trailPercent, bracketTakeProfit, bracketStopLoss } = params

    const order: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      symbol,
      side,
      type,
      quantity,
      limitPrice,
      stopPrice,
      tif,
      status: 'OPEN',
      filledQty: 0,
      filledPrice: 0,
      createdAt: Date.now(),
    }

    // Market orders fill immediately at current price
    if (type === 'MARKET') {
      order.status = 'FILLED'
      order.filledQty = quantity
      order.filledPrice = currentPrice
      order.filledAt = Date.now()

      const trade: TradeRecord = {
        id: `TRD-${Date.now()}`,
        orderId: order.id,
        symbol,
        side,
        quantity,
        price: currentPrice,
        total: currentPrice * quantity,
        timestamp: Date.now(),
      }

      setState((prev) => ({
        orders: [order, ...prev.orders],
        trades: [trade, ...prev.trades],
      }))
    } else if (type === 'LIMIT') {
      // Check if limit is already met
      const canFill = side === 'BUY'
        ? currentPrice <= (limitPrice ?? Infinity)
        : currentPrice >= (limitPrice ?? 0)

      if (canFill) {
        order.status = 'FILLED'
        order.filledQty = quantity
        order.filledPrice = limitPrice ?? currentPrice
        order.filledAt = Date.now()

        const trade: TradeRecord = {
          id: `TRD-${Date.now()}`,
          orderId: order.id,
          symbol,
          side,
          quantity,
          price: limitPrice ?? currentPrice,
          total: (limitPrice ?? currentPrice) * quantity,
          timestamp: Date.now(),
        }

        setState((prev) => ({
          orders: [order, ...prev.orders],
          trades: [trade, ...prev.trades],
        }))
      } else {
        setState((prev) => ({
          ...prev,
          orders: [order, ...prev.orders],
        }))
      }
    } else if (type === 'BRACKET') {
      // Bracket: fill entry at market, create TP and SL child orders
      order.status = 'FILLED'
      order.filledQty = quantity
      order.filledPrice = currentPrice
      order.filledAt = Date.now()
      order.bracketTakeProfit = bracketTakeProfit
      order.bracketStopLoss = bracketStopLoss

      const trade: TradeRecord = {
        id: `TRD-${Date.now()}`,
        orderId: order.id,
        symbol, side, quantity,
        price: currentPrice,
        total: currentPrice * quantity,
        timestamp: Date.now(),
      }

      const exitSide: OrderSide = side === 'BUY' ? 'SELL' : 'BUY'
      const tpOrder: Order = {
        id: `ORD-${Date.now()}-TP`,
        symbol, side: exitSide, type: 'LIMIT',
        quantity, limitPrice: bracketTakeProfit, tif: 'GTC',
        status: 'OPEN', filledQty: 0, filledPrice: 0,
        createdAt: Date.now(), parentOrderId: order.id,
        linkedOrderId: `ORD-${Date.now()}-SL`,
      }
      const slOrder: Order = {
        id: `ORD-${Date.now()}-SL`,
        symbol, side: exitSide, type: 'STOP',
        quantity, stopPrice: bracketStopLoss, tif: 'GTC',
        status: 'OPEN', filledQty: 0, filledPrice: 0,
        createdAt: Date.now(), parentOrderId: order.id,
        linkedOrderId: tpOrder.id,
      }

      setState((prev) => ({
        orders: [slOrder, tpOrder, order, ...prev.orders],
        trades: [trade, ...prev.trades],
      }))
    } else if (type === 'OCO') {
      // OCO: two linked orders, filling one cancels the other
      order.limitPrice = limitPrice
      order.stopPrice = stopPrice
      order.linkedOrderId = `ORD-${Date.now()}-OCO2`

      const ocoOrder2: Order = {
        id: `ORD-${Date.now()}-OCO2`,
        symbol, side, type: 'STOP',
        quantity, stopPrice, tif: 'GTC',
        status: 'OPEN', filledQty: 0, filledPrice: 0,
        createdAt: Date.now(), linkedOrderId: order.id,
      }
      order.type = 'LIMIT'

      setState((prev) => ({
        ...prev,
        orders: [ocoOrder2, order, ...prev.orders],
      }))
    } else if (type === 'TRAILING_STOP') {
      order.trailAmount = trailAmount
      order.trailPercent = trailPercent
      // Calculate initial stop from current price
      const trail = trailAmount ?? (trailPercent ? currentPrice * trailPercent / 100 : 0)
      order.stopPrice = side === 'SELL' ? currentPrice - trail : currentPrice + trail

      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
      }))
    } else {
      // STOP and STOP_LIMIT stay open
      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
      }))
    }

    return order
  }, [])

  const cancelOrder = useCallback((orderId: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId && o.status === 'OPEN'
          ? { ...o, status: 'CANCELLED' as OrderStatus }
          : o
      ),
    }))
  }, [])

  const fillOpenOrders = useCallback((prices: Map<string, number>) => {
    setState((prev) => {
      let changed = false
      const newTrades: TradeRecord[] = []

      const orders = prev.orders.map((o) => {
        if (o.status !== 'OPEN') return o
        const price = prices.get(o.symbol)
        if (!price) return o

        let shouldFill = false
        let fillPrice = price

        if (o.type === 'LIMIT') {
          if (o.side === 'BUY' && price <= (o.limitPrice ?? Infinity)) {
            shouldFill = true
            fillPrice = o.limitPrice ?? price
          } else if (o.side === 'SELL' && price >= (o.limitPrice ?? 0)) {
            shouldFill = true
            fillPrice = o.limitPrice ?? price
          }
        } else if (o.type === 'STOP') {
          if (o.side === 'BUY' && price >= (o.stopPrice ?? Infinity)) {
            shouldFill = true
          } else if (o.side === 'SELL' && price <= (o.stopPrice ?? 0)) {
            shouldFill = true
          }
        }

        if (shouldFill) {
          changed = true
          newTrades.push({
            id: `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            orderId: o.id,
            symbol: o.symbol,
            side: o.side,
            quantity: o.quantity,
            price: fillPrice,
            total: fillPrice * o.quantity,
            timestamp: Date.now(),
          })
          return {
            ...o,
            status: 'FILLED' as OrderStatus,
            filledQty: o.quantity,
            filledPrice: fillPrice,
            filledAt: Date.now(),
          }
        }

        return o
      })

      if (!changed) return prev

      // Cancel linked orders (OCO / bracket)
      const filledIds = new Set(orders.filter((o) => o.status === 'FILLED' && o.filledAt).map((o) => o.id))
      const cancelledLinked = orders.map((o) => {
        if (o.status === 'OPEN' && o.linkedOrderId && filledIds.has(o.linkedOrderId)) {
          return { ...o, status: 'CANCELLED' as OrderStatus }
        }
        return o
      })

      return { orders: cancelledLinked, trades: [...newTrades, ...prev.trades] }
    })
  }, [])

  const clearHistory = useCallback(() => {
    setState({ orders: [], trades: [] })
  }, [])

  // Stats
  const openOrders = state.orders.filter((o) => o.status === 'OPEN')
  const filledOrders = state.orders.filter((o) => o.status === 'FILLED')
  const totalTrades = state.trades.length
  const totalVolume = state.trades.reduce((s, t) => s + t.total, 0)

  return {
    orders: state.orders,
    trades: state.trades,
    openOrders,
    filledOrders,
    totalTrades,
    totalVolume,
    placeOrder,
    cancelOrder,
    fillOpenOrders,
    clearHistory,
  }
}
