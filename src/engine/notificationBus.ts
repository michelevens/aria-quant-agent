import type { Notification } from '@/components/trading/NotificationCenter'

type Listener = (notif: Notification) => void

class NotificationBus {
  private listeners: Set<Listener> = new Set()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(notif: Notification): void {
    this.listeners.forEach((fn) => fn(notif))
  }
}

export const notificationBus = new NotificationBus()
