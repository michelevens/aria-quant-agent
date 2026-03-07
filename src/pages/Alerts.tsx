import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAlerts } from '@/hooks/useAlerts'
import type { AlertCondition } from '@/hooks/useAlerts'
import { Bell, BellRing, Plus, Trash2, X } from 'lucide-react'

export function Alerts() {
  const { activeAlerts, triggeredAlerts, addAlert, removeAlert, clearTriggered } = useAlerts()
  const [symbol, setSymbol] = useState('')
  const [condition, setCondition] = useState<AlertCondition>('ABOVE')
  const [value, setValue] = useState('')

  const handleAdd = () => {
    if (!symbol || !value) return
    addAlert({ symbol, condition, value: parseFloat(value) })
    setSymbol('')
    setValue('')

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const conditionLabels: Record<AlertCondition, string> = {
    ABOVE: 'Price Above',
    BELOW: 'Price Below',
    RSI_ABOVE: 'RSI Above',
    RSI_BELOW: 'RSI Below',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Bell className="h-5 w-5" />
          Price Alerts
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{activeAlerts.length} active</Badge>
          {triggeredAlerts.length > 0 && (
            <Badge className="bg-yellow-600 text-xs">{triggeredAlerts.length} triggered</Badge>
          )}
        </div>
      </div>

      {/* Create Alert */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Create Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="NVDA"
                className="h-8 w-28 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Condition</label>
              <Select value={condition} onValueChange={(v: string | null) => { if (v) setCondition(v as AlertCondition) }}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABOVE">Price Above</SelectItem>
                  <SelectItem value="BELOW">Price Below</SelectItem>
                  <SelectItem value="RSI_ABOVE">RSI Above</SelectItem>
                  <SelectItem value="RSI_BELOW">RSI Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Value</label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="150.00"
                className="h-8 w-28 text-sm"
                type="number"
                step="0.01"
              />
            </div>
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BellRing className="h-4 w-4 text-yellow-500" />
                Triggered
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={clearTriggered}>
                <Trash2 className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {triggeredAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-md bg-yellow-500/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-bold">{alert.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {conditionLabels[alert.condition]} ${alert.value.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : ''}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAlert(alert.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active alerts. Create one above to get notified when conditions are met.
            </p>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-md bg-accent/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">{alert.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {conditionLabels[alert.condition]}
                    </Badge>
                    <span className="text-sm font-medium">${alert.value.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAlert(alert.id)}>
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
