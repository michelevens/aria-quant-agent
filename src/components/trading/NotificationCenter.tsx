import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell, AlertTriangle, ShieldCheck,
  Zap, CheckCircle2, Info, Trash2,
} from 'lucide-react'

export type NotifType = 'trade' | 'alert' | 'signal' | 'system' | 'risk'

export interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  timestamp: number
  read: boolean
}

const STORAGE_KEY = 'aria-quant-notifications'

function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : getDefaultNotifications()
  } catch {
    return getDefaultNotifications()
  }
}

function saveNotifications(notifs: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs))
}

function getDefaultNotifications(): Notification[] {
  const now = Date.now()
  return [
    { id: 'n1', type: 'signal', title: 'Strong Buy Signal', message: 'NVDA triggered 7-factor buy signal (score: 0.82)', timestamp: now - 300000, read: false },
    { id: 'n2', type: 'alert', title: 'Price Alert Triggered', message: 'AAPL crossed above $195.00 target', timestamp: now - 1800000, read: false },
    { id: 'n3', type: 'trade', title: 'Order Filled', message: 'Buy 10 MSFT @ $425.30 executed', timestamp: now - 3600000, read: false },
    { id: 'n4', type: 'risk', title: 'Risk Warning', message: 'Portfolio VaR exceeded 2% threshold', timestamp: now - 7200000, read: true },
    { id: 'n5', type: 'system', title: 'Market Data Connected', message: 'Yahoo Finance real-time feed active', timestamp: now - 14400000, read: true },
    { id: 'n6', type: 'signal', title: 'Sell Signal', message: 'TSLA RSI overbought at 78.4', timestamp: now - 28800000, read: true },
  ]
}

const typeConfig: Record<NotifType, { icon: typeof Bell; color: string; bg: string }> = {
  trade: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  alert: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  signal: { icon: Zap, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  system: { icon: Info, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  risk: { icon: ShieldCheck, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications)

  useEffect(() => {
    saveNotifications(notifications)
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-white"
            style={{ fontSize: '9px', backgroundColor: '#ef4444' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">{unreadCount} new</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <ScrollArea style={{ maxHeight: '400px' }}>
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const cfg = typeConfig[n.type]
                const Icon = cfg.icon
                return (
                  <button
                    key={n.id}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                    style={!n.read ? { backgroundColor: 'rgba(59,130,246,0.04)' } : undefined}
                    onClick={() => markRead(n.id)}
                  >
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{n.title}</span>
                        {!n.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.timestamp)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
