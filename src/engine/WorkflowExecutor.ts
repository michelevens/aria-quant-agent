import type { Workflow, AlertNotification } from '@/types/alerts'
import type { Quote } from '@/types/market'

interface WorkflowActions {
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  addAlert: (config: Record<string, unknown>) => void
  logJournal: (note: string) => void
  notify: (title: string, message: string) => void
}

export function executeWorkflow(
  workflow: Workflow,
  trigger: AlertNotification,
  quotes: Map<string, Quote>,
  actions: WorkflowActions,
): boolean {
  // Check conditions
  for (const cond of workflow.conditions) {
    if (cond.type === 'price_above') {
      const sym = String(cond.params.symbol ?? trigger.symbol ?? '')
      const q = quotes.get(sym)
      if (!q || q.price < Number(cond.params.value ?? 0)) return false
    }
    if (cond.type === 'price_below') {
      const sym = String(cond.params.symbol ?? trigger.symbol ?? '')
      const q = quotes.get(sym)
      if (!q || q.price > Number(cond.params.value ?? 0)) return false
    }
    if (cond.type === 'market_hours_only') {
      const now = new Date()
      const hour = now.getHours()
      const day = now.getDay()
      if (day === 0 || day === 6) return false
      if (hour < 9 || hour >= 16) return false
    }
  }

  // Execute actions
  for (const action of workflow.actions) {
    switch (action.type) {
      case 'notify':
        actions.notify(
          String(action.params.title ?? `Workflow: ${workflow.name}`),
          String(action.params.message ?? trigger.message),
        )
        break
      case 'add_to_watchlist':
        actions.addToWatchlist(String(action.params.symbol ?? trigger.symbol ?? ''))
        break
      case 'remove_from_watchlist':
        actions.removeFromWatchlist(String(action.params.symbol ?? trigger.symbol ?? ''))
        break
      case 'create_alert':
        actions.addAlert(action.params)
        break
      case 'log_journal':
        actions.logJournal(String(action.params.note ?? trigger.message))
        break
    }
  }

  return true
}
