import { useState, useEffect, useCallback } from 'react'
import {
  isAlpacaConnected,
  placeAlpacaOrder,
  cancelAlpacaOrder,
  fetchOrders as fetchAlpacaOrders,
  type PlaceOrderParams,
  type AlpacaOrder,
} from '@/services/alpaca'
import { orders as ordersApi, getToken } from '@/services/api'

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

function alpacaStatusToLocal(status: string): OrderStatus {
  if (status === 'filled') return 'FILLED'
  if (status === 'partially_filled') return 'PARTIAL'
  if (status === 'canceled' || status === 'expired' || status === 'rejected') return 'CANCELLED'
  return 'OPEN'
}

function alpacaOrderToLocal(ao: AlpacaOrder): Order {
  const typeMap: Record<string, OrderType> = {
    market: 'MARKET', limit: 'LIMIT', stop: 'STOP',
    stop_limit: 'STOP_LIMIT', trailing_stop: 'TRAILING_STOP',
  }
  const tifMap: Record<string, TimeInForce> = {
    day: 'DAY', gtc: 'GTC', ioc: 'IOC', fok: 'FOK',
  }
  return {
    id: ao.id,
    symbol: ao.symbol,
    side: ao.side.toUpperCase() as OrderSide,
    type: typeMap[ao.type] ?? 'MARKET',
    quantity: Number(ao.qty),
    limitPrice: ao.limit_price ? Number(ao.limit_price) : undefined,
    stopPrice: ao.stop_price ? Number(ao.stop_price) : undefined,
    trailPercent: ao.trail_percent ? Number(ao.trail_percent) : undefined,
    trailAmount: ao.trail_price ? Number(ao.trail_price) : undefined,
    tif: tifMap[ao.time_in_force] ?? 'DAY',
    status: alpacaStatusToLocal(ao.status),
    filledQty: Number(ao.filled_qty),
    filledPrice: ao.filled_avg_price ? Number(ao.filled_avg_price) : 0,
    createdAt: new Date(ao.created_at).getTime(),
    filledAt: ao.filled_at ? new Date(ao.filled_at).getTime() : undefined,
  }
}

export function useTradingEngine() {
  const [state, setState] = useState<TradingState>(loadTradingState)

  useEffect(() => { saveTradingState(state) }, [state])

  // Load orders from API on mount
  useEffect(() => {
    if (!getToken()) return
    Promise.all([ordersApi.list(), ordersApi.trades()])
      .then(([ordersRes, tradesRes]) => {
        if (ordersRes.orders.length > 0 || tradesRes.trades.length > 0) {
          setState({
            orders: ordersRes.orders.map((o) => ({
              id: String(o.id),
              symbol: o.symbol,
              side: o.side,
              type: o.type as OrderType,
              quantity: o.quantity,
              limitPrice: o.limit_price ?? undefined,
              stopPrice: o.stop_price ?? undefined,
              tif: o.tif as TimeInForce,
              status: o.status as OrderStatus,
              filledQty: o.filled_qty,
              filledPrice: o.filled_price,
              pnl: o.pnl ?? undefined,
              filledAt: o.filled_at ? new Date(o.filled_at).getTime() : undefined,
              createdAt: new Date(o.created_at).getTime(),
            })),
            trades: tradesRes.trades.map((t) => ({
              id: String(t.id),
              orderId: String(t.order_id ?? ''),
              symbol: t.symbol,
              side: t.side,
              quantity: t.quantity,
              price: t.price,
              total: t.total,
              timestamp: new Date(t.created_at).getTime(),
            })),
          })
        }
      })
      .catch(() => { /* fall back to localStorage */ })
  }, [])

  // Sync orders from Alpaca
  const syncAlpacaOrders = useCallback(async () => {
    if (!isAlpacaConnected()) return
    try {
      const alpacaOrders = await fetchAlpacaOrders('all', 100)
      const localOrders = alpacaOrders.map(alpacaOrderToLocal)
      const trades: TradeRecord[] = alpacaOrders
        .filter((ao) => ao.status === 'filled' && ao.filled_avg_price)
        .map((ao) => ({
          id: `TRD-${ao.id}`,
          orderId: ao.id,
          symbol: ao.symbol,
          side: ao.side.toUpperCase() as OrderSide,
          quantity: Number(ao.filled_qty),
          price: Number(ao.filled_avg_price),
          total: Number(ao.filled_qty) * Number(ao.filled_avg_price),
          timestamp: ao.filled_at ? new Date(ao.filled_at).getTime() : Date.now(),
        }))
      setState({ orders: localOrders, trades })
    } catch { /* ignore sync errors */ }
  }, [])

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

    // Route through Alpaca if connected
    if (isAlpacaConnected()) {
      const alpacaType = type === 'MARKET' ? 'market' : type === 'LIMIT' ? 'limit'
        : type === 'STOP' ? 'stop' : type === 'STOP_LIMIT' ? 'stop_limit'
        : type === 'TRAILING_STOP' ? 'trailing_stop' : 'market'
      const alpacaTif = tif === 'DAY' ? 'day' : tif === 'GTC' ? 'gtc' : tif === 'IOC' ? 'ioc' : 'fok'

      const orderParams: PlaceOrderParams = {
        symbol,
        qty: quantity,
        side: side.toLowerCase() as 'buy' | 'sell',
        type: alpacaType,
        time_in_force: alpacaTif,
      }

      if (limitPrice !== undefined) orderParams.limit_price = limitPrice
      if (stopPrice !== undefined) orderParams.stop_price = stopPrice
      if (trailPercent !== undefined) orderParams.trail_percent = trailPercent
      if (trailAmount !== undefined) orderParams.trail_price = trailAmount

      if (type === 'BRACKET' && bracketTakeProfit && bracketStopLoss) {
        orderParams.type = 'market'
        orderParams.order_class = 'bracket'
        orderParams.take_profit = { limit_price: bracketTakeProfit }
        orderParams.stop_loss = { stop_price: bracketStopLoss }
      }

      placeAlpacaOrder(orderParams)
        .then(() => { syncAlpacaOrders() })
        .catch((err) => { console.error('Alpaca order failed:', err) })

      const optimistic: Order = {
        id: `ALPACA-PENDING-${Date.now()}`,
        symbol, side, type, quantity, limitPrice, stopPrice, tif,
        status: 'OPEN', filledQty: 0, filledPrice: 0, createdAt: Date.now(),
      }
      setState((prev) => ({ ...prev, orders: [optimistic, ...prev.orders] }))
      return optimistic
    }

    const order: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      symbol, side, type, quantity, limitPrice, stopPrice, tif,
      status: 'OPEN', filledQty: 0, filledPrice: 0, createdAt: Date.now(),
    }

    // Sync to API
    if (getToken()) {
      ordersApi.create({
        symbol, side, type, quantity,
        limit_price: limitPrice,
        stop_price: stopPrice,
        trail_amount: trailAmount,
        trail_percent: trailPercent,
        bracket_take_profit: bracketTakeProfit,
        bracket_stop_loss: bracketStopLoss,
        tif,
      }).catch(() => { /* ignore */ })
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
        symbol, side, quantity,
        price: currentPrice,
        total: currentPrice * quantity,
        timestamp: Date.now(),
      }

      setState((prev) => ({
        orders: [order, ...prev.orders],
        trades: [trade, ...prev.trades],
      }))
    } else if (type === 'LIMIT') {
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
          symbol, side, quantity,
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
      const trail = trailAmount ?? (trailPercent ? currentPrice * trailPercent / 100 : 0)
      order.stopPrice = side === 'SELL' ? currentPrice - trail : currentPrice + trail

      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
      }))
    } else {
      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
      }))
    }

    return order
  }, [])

  const cancelOrder = useCallback((orderId: string) => {
    if (isAlpacaConnected() && !orderId.startsWith('ORD-')) {
      cancelAlpacaOrder(orderId)
        .then(() => { syncAlpacaOrders() })
        .catch((err) => { console.error('Alpaca cancel failed:', err) })
    }

    // Cancel on API
    if (getToken()) {
      const numId = parseInt(orderId)
      if (!isNaN(numId)) ordersApi.cancel(numId).catch(() => { /* ignore */ })
    }

    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId && o.status === 'OPEN'
          ? { ...o, status: 'CANCELLED' as OrderStatus }
          : o
      ),
    }))
  }, [syncAlpacaOrders])

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
    syncAlpacaOrders,
  }
}
