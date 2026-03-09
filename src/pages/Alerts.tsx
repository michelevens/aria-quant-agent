import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAlertContext } from '@/contexts/AlertContext'
import type { Alert, AlertCategory, WorkflowAction, WorkflowCondition } from '@/types/alerts'
import {
  Bell, BellRing, Plus, Trash2, X, Pause, Play, TrendingUp,
  Activity, Volume2, Newspaper, Briefcase, Workflow as WorkflowIcon, Clock,
  Zap, Filter,
} from 'lucide-react'

const categoryIcons: Record<AlertCategory, typeof Bell> = {
  price: TrendingUp,
  technical: Activity,
  volume: Volume2,
  sentiment: Newspaper,
  portfolio: Briefcase,
}

const categoryColors: Record<AlertCategory, string> = {
  price: 'text-blue-500',
  technical: 'text-purple-500',
  volume: 'text-amber-500',
  sentiment: 'text-cyan-500',
  portfolio: 'text-emerald-500',
}

function statusBadge(status: string) {
  if (status === 'active') return <Badge className="bg-emerald-600 text-xs">Active</Badge>
  if (status === 'triggered') return <Badge className="bg-yellow-600 text-xs">Triggered</Badge>
  if (status === 'paused') return <Badge variant="outline" className="text-xs text-muted-foreground">Paused</Badge>
  if (status === 'expired') return <Badge variant="outline" className="text-xs text-red-500">Expired</Badge>
  return null
}

function alertDescription(alert: Alert): string {
  switch (alert.category) {
    case 'price':
      if (alert.condition === 'percent_change') return `${alert.symbol} moves ${alert.targetValue}%`
      return `${alert.symbol} ${alert.condition} $${alert.targetValue.toFixed(2)}`
    case 'technical':
      return `${alert.symbol} ${alert.indicator} ${alert.condition} ${alert.threshold ?? ''}`
    case 'volume':
      return `${alert.symbol} volume ${alert.multiplier}x avg (${alert.direction})`
    case 'sentiment':
      return `${alert.symbol} ${alert.targetSentiment} news`
    case 'portfolio':
      return `${alert.metric.replace(/_/g, ' ')} ${alert.symbol ? `(${alert.symbol})` : ''} threshold: ${alert.threshold}`
    default:
      return ''
  }
}

// --- Alert List Component ---

function AlertList({ alerts, filter }: { alerts: Alert[]; filter?: AlertCategory }) {
  const { removeAlert, pauseAlert, resumeAlert } = useAlertContext()
  const filtered = filter ? alerts.filter((a) => a.category === filter) : alerts

  if (filtered.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No alerts in this category</p>
  }

  return (
    <div className="space-y-2">
      {filtered.map((alert) => {
        const Icon = categoryIcons[alert.category]
        return (
          <div key={alert.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <Icon className={`h-4 w-4 shrink-0 ${categoryColors[alert.category]}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{alert.name}</span>
                  {statusBadge(alert.status)}
                  {alert.recurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{alertDescription(alert)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {alert.triggerCount > 0 && (
                <span className="text-xs text-muted-foreground mr-1">×{alert.triggerCount}</span>
              )}
              {alert.status === 'active' && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => pauseAlert(alert.id)} title="Pause">
                  <Pause className="h-3 w-3" />
                </Button>
              )}
              {alert.status === 'paused' && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => resumeAlert(alert.id)} title="Resume">
                  <Play className="h-3 w-3" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAlert(alert.id)}>
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Price Alert Form ---

function PriceAlertForm() {
  const { addAlert } = useAlertContext()
  const [symbol, setSymbol] = useState('')
  const [condition, setCondition] = useState<'above' | 'below' | 'percent_change'>('above')
  const [value, setValue] = useState('')
  const [recurring, setRecurring] = useState(false)

  const handleAdd = () => {
    if (!symbol || !value) return
    addAlert({
      name: `${symbol.toUpperCase()} ${condition} ${condition === 'percent_change' ? value + '%' : '$' + value}`,
      category: 'price',
      symbol: symbol.toUpperCase(),
      condition,
      targetValue: parseFloat(value),
      recurring,
    })
    setSymbol('')
    setValue('')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
        <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="NVDA" className="h-8 w-28 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Condition</label>
        <Select value={condition} onValueChange={(v) => { if (v) setCondition(v as typeof condition) }}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="above">Price Above</SelectItem>
            <SelectItem value="below">Price Below</SelectItem>
            <SelectItem value="percent_change">% Change</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">{condition === 'percent_change' ? 'Percent' : 'Price'}</label>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={condition === 'percent_change' ? '5' : '150.00'} className="h-8 w-28 text-sm" type="number" step="0.01" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={recurring} onCheckedChange={setRecurring} />
        <span className="text-xs text-muted-foreground">Recurring</span>
      </div>
      <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  )
}

// --- Technical Alert Form ---

function TechnicalAlertForm() {
  const { addAlert } = useAlertContext()
  const [symbol, setSymbol] = useState('')
  const [indicator, setIndicator] = useState<'rsi' | 'macd_crossover' | 'bollinger_breach' | 'sma_crossover' | 'stochastic'>('rsi')
  const [condition, setCondition] = useState<'above' | 'below' | 'crosses_above' | 'crosses_below'>('above')
  const [threshold, setThreshold] = useState('')

  const needsThreshold = indicator === 'rsi' || indicator === 'stochastic'
  const isCrossover = indicator === 'macd_crossover' || indicator === 'sma_crossover'

  const handleAdd = () => {
    if (!symbol) return
    const indLabels: Record<string, string> = {
      rsi: 'RSI', macd_crossover: 'MACD', bollinger_breach: 'BB',
      sma_crossover: 'SMA', stochastic: 'Stoch',
    }
    addAlert({
      name: `${symbol.toUpperCase()} ${indLabels[indicator]} ${condition} ${threshold || ''}`.trim(),
      category: 'technical',
      symbol: symbol.toUpperCase(),
      indicator,
      condition: isCrossover ? condition as 'crosses_above' | 'crosses_below' : condition as 'above' | 'below',
      threshold: needsThreshold ? parseFloat(threshold) || undefined : undefined,
    })
    setSymbol('')
    setThreshold('')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
        <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="h-8 w-28 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Indicator</label>
        <Select value={indicator} onValueChange={(v) => {
          if (!v) return
          setIndicator(v as typeof indicator)
          if (v === 'macd_crossover' || v === 'sma_crossover') setCondition('crosses_above')
          else setCondition('above')
        }}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rsi">RSI</SelectItem>
            <SelectItem value="macd_crossover">MACD Crossover</SelectItem>
            <SelectItem value="bollinger_breach">Bollinger Band</SelectItem>
            <SelectItem value="sma_crossover">SMA Crossover</SelectItem>
            <SelectItem value="stochastic">Stochastic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Condition</label>
        <Select value={condition} onValueChange={(v) => { if (v) setCondition(v as typeof condition) }}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {isCrossover ? (
              <>
                <SelectItem value="crosses_above">Crosses Above</SelectItem>
                <SelectItem value="crosses_below">Crosses Below</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      {needsThreshold && (
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Threshold</label>
          <Input value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={indicator === 'rsi' ? '70' : '80'} className="h-8 w-20 text-sm" type="number" />
        </div>
      )}
      <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  )
}

// --- Volume Alert Form ---

function VolumeAlertForm() {
  const { addAlert } = useAlertContext()
  const [symbol, setSymbol] = useState('')
  const [multiplier, setMultiplier] = useState('2')
  const [direction, setDirection] = useState<'any' | 'up' | 'down'>('any')

  const handleAdd = () => {
    if (!symbol) return
    addAlert({
      name: `${symbol.toUpperCase()} volume ${multiplier}x (${direction})`,
      category: 'volume',
      symbol: symbol.toUpperCase(),
      multiplier: parseFloat(multiplier) || 2,
      direction,
    })
    setSymbol('')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
        <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="TSLA" className="h-8 w-28 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Multiplier (x avg)</label>
        <Input value={multiplier} onChange={(e) => setMultiplier(e.target.value)} placeholder="2" className="h-8 w-20 text-sm" type="number" step="0.5" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Direction</label>
        <Select value={direction} onValueChange={(v) => { if (v) setDirection(v as typeof direction) }}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="up">Up Move</SelectItem>
            <SelectItem value="down">Down Move</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  )
}

// --- Sentiment Alert Form ---

function SentimentAlertForm() {
  const { addAlert } = useAlertContext()
  const [symbol, setSymbol] = useState('')
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish'>('bearish')

  const handleAdd = () => {
    if (!symbol) return
    addAlert({
      name: `${symbol.toUpperCase()} ${sentiment} news`,
      category: 'sentiment',
      symbol: symbol.toUpperCase(),
      targetSentiment: sentiment,
    })
    setSymbol('')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
        <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="META" className="h-8 w-28 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Sentiment</label>
        <Select value={sentiment} onValueChange={(v) => { if (v) setSentiment(v as typeof sentiment) }}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bullish">Bullish</SelectItem>
            <SelectItem value="bearish">Bearish</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  )
}

// --- Portfolio Alert Form ---

function PortfolioAlertForm() {
  const { addAlert } = useAlertContext()
  const [metric, setMetric] = useState<'position_pnl_percent' | 'position_pnl_dollar' | 'daily_loss_percent' | 'daily_loss_dollar' | 'portfolio_value_below' | 'portfolio_value_above'>('daily_loss_percent')
  const [symbol, setSymbol] = useState('')
  const [threshold, setThreshold] = useState('')

  const isPositionLevel = metric === 'position_pnl_percent' || metric === 'position_pnl_dollar'
  const metricLabels: Record<string, string> = {
    position_pnl_percent: 'Position P&L %',
    position_pnl_dollar: 'Position P&L $',
    daily_loss_percent: 'Daily Loss %',
    daily_loss_dollar: 'Daily Loss $',
    portfolio_value_below: 'Value Below',
    portfolio_value_above: 'Value Above',
  }

  const handleAdd = () => {
    if (!threshold) return
    if (isPositionLevel && !symbol) return
    addAlert({
      name: `${metricLabels[metric]} ${isPositionLevel ? symbol.toUpperCase() + ' ' : ''}${threshold}`,
      category: 'portfolio',
      metric,
      symbol: isPositionLevel ? symbol.toUpperCase() : undefined,
      threshold: parseFloat(threshold),
      recurring: true,
      cooldownMs: 600000,
    })
    setSymbol('')
    setThreshold('')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Metric</label>
        <Select value={metric} onValueChange={(v) => { if (v) setMetric(v as typeof metric) }}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="position_pnl_percent">Position P&L %</SelectItem>
            <SelectItem value="position_pnl_dollar">Position P&L $</SelectItem>
            <SelectItem value="daily_loss_percent">Daily Loss %</SelectItem>
            <SelectItem value="daily_loss_dollar">Daily Loss $</SelectItem>
            <SelectItem value="portfolio_value_below">Portfolio Value Below</SelectItem>
            <SelectItem value="portfolio_value_above">Portfolio Value Above</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isPositionLevel && (
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Symbol</label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="NVDA" className="h-8 w-28 text-sm" />
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Threshold</label>
        <Input value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={metric.includes('percent') ? '-5' : '-1000'} className="h-8 w-28 text-sm" type="number" step="0.01" />
      </div>
      <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  )
}

// --- Workflow Builder ---

function WorkflowBuilder() {
  const { alerts, workflows, addWorkflow, removeWorkflow, toggleWorkflow } = useAlertContext()
  const [name, setName] = useState('')
  const [triggerAlertId, setTriggerAlertId] = useState('')
  const [actions, setActions] = useState<WorkflowAction[]>([{ type: 'notify', params: { message: '' } }])
  const [conditions, setConditions] = useState<WorkflowCondition[]>([])

  const activeAlerts = alerts.filter((a) => a.status === 'active')

  const addAction = () => setActions((prev) => [...prev, { type: 'notify', params: { message: '' } }])
  const removeAction = (idx: number) => setActions((prev) => prev.filter((_, i) => i !== idx))
  const updateAction = (idx: number, action: WorkflowAction) => setActions((prev) => prev.map((a, i) => i === idx ? action : a))

  const addCondition = () => setConditions((prev) => [...prev, { type: 'market_hours_only', params: {} }])
  const removeCondition = (idx: number) => setConditions((prev) => prev.filter((_, i) => i !== idx))

  const handleCreate = () => {
    if (!name || !triggerAlertId) return
    addWorkflow({ name, enabled: true, triggerAlertId, conditions, actions })
    setName('')
    setTriggerAlertId('')
    setActions([{ type: 'notify', params: { message: '' } }])
    setConditions([])
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Create Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Stop loss workflow" className="h-8 w-48 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">When alert triggers</label>
              <Select value={triggerAlertId} onValueChange={(v) => { if (v) setTriggerAlertId(v) }}>
                <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="Select alert..." /></SelectTrigger>
                <SelectContent>
                  {activeAlerts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">IF conditions (optional)</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addCondition}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {conditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <Select value={cond.type} onValueChange={(v) => {
                  if (!v) return
                  const updated = [...conditions]
                  updated[idx] = { type: v as WorkflowCondition['type'], params: cond.params }
                  setConditions(updated)
                }}>
                  <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market_hours_only">Market Hours Only</SelectItem>
                    <SelectItem value="price_above">Price Above</SelectItem>
                    <SelectItem value="price_below">Price Below</SelectItem>
                  </SelectContent>
                </Select>
                {(cond.type === 'price_above' || cond.type === 'price_below') && (
                  <>
                    <Input placeholder="SYM" className="h-7 w-20 text-xs" value={String(cond.params.symbol ?? '')}
                      onChange={(e) => {
                        const updated = [...conditions]
                        updated[idx] = { ...cond, params: { ...cond.params, symbol: e.target.value.toUpperCase() } }
                        setConditions(updated)
                      }}
                    />
                    <Input placeholder="$" className="h-7 w-20 text-xs" type="number" value={String(cond.params.value ?? '')}
                      onChange={(e) => {
                        const updated = [...conditions]
                        updated[idx] = { ...cond, params: { ...cond.params, value: e.target.value } }
                        setConditions(updated)
                      }}
                    />
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCondition(idx)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">THEN actions</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addAction}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {actions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <Select value={action.type} onValueChange={(v) => {
                  if (!v) return
                  updateAction(idx, { type: v as WorkflowAction['type'], params: action.params })
                }}>
                  <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notify">Notify</SelectItem>
                    <SelectItem value="add_to_watchlist">Add to Watchlist</SelectItem>
                    <SelectItem value="remove_from_watchlist">Remove from Watchlist</SelectItem>
                    <SelectItem value="log_journal">Log to Journal</SelectItem>
                  </SelectContent>
                </Select>
                {action.type === 'notify' && (
                  <Input placeholder="Custom message..." className="h-7 flex-1 text-xs" value={String(action.params.message ?? '')}
                    onChange={(e) => updateAction(idx, { ...action, params: { ...action.params, message: e.target.value } })}
                  />
                )}
                {(action.type === 'add_to_watchlist' || action.type === 'remove_from_watchlist') && (
                  <Input placeholder="Symbol" className="h-7 w-24 text-xs" value={String(action.params.symbol ?? '')}
                    onChange={(e) => updateAction(idx, { ...action, params: { ...action.params, symbol: e.target.value.toUpperCase() } })}
                  />
                )}
                {action.type === 'log_journal' && (
                  <Input placeholder="Note..." className="h-7 flex-1 text-xs" value={String(action.params.note ?? '')}
                    onChange={(e) => updateAction(idx, { ...action, params: { ...action.params, note: e.target.value } })}
                  />
                )}
                {actions.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAction(idx)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" /> Create Workflow
          </Button>
        </CardContent>
      </Card>

      {/* Existing Workflows */}
      {workflows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Workflows ({workflows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workflows.map((wf) => {
              const triggerAlert = alerts.find((a) => a.id === wf.triggerAlertId)
              return (
                <div key={wf.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <WorkflowIcon className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">{wf.name}</span>
                      {wf.enabled ? <Badge className="bg-emerald-600 text-xs">On</Badge> : <Badge variant="outline" className="text-xs">Off</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When: {triggerAlert?.name ?? 'Unknown alert'} → {wf.actions.length} action{wf.actions.length !== 1 ? 's' : ''}
                      {wf.triggerCount > 0 && ` (triggered ${wf.triggerCount}x)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={wf.enabled} onCheckedChange={() => toggleWorkflow(wf.id)} />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeWorkflow(wf.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// --- Alert History ---

function AlertHistory() {
  const { history, clearHistory } = useAlertContext()

  return (
    <div className="space-y-3">
      {history.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={clearHistory}>
            <Trash2 className="h-3 w-3" /> Clear History
          </Button>
        </div>
      )}
      {history.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No triggered alerts yet</p>
      ) : (
        <div className="space-y-2">
          {history.map((h, i) => {
            const Icon = categoryIcons[h.category] ?? Bell
            return (
              <div key={`${h.alertId}-${i}`} className="flex items-start gap-3 rounded-md border border-border px-3 py-2">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${categoryColors[h.category] ?? ''}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{h.alertName}</span>
                    <Badge variant="outline" className="text-xs">{h.category}</Badge>
                    {h.symbol && <Badge variant="outline" className="text-xs">{h.symbol}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(h.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Main Page ---

export function Alerts() {
  const { alerts, workflows, history, clearTriggered } = useAlertContext()

  const activeCount = alerts.filter((a) => a.status === 'active').length
  const triggeredCount = alerts.filter((a) => a.status === 'triggered').length
  const pausedCount = alerts.filter((a) => a.status === 'paused').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Bell className="h-5 w-5" />
          Alerts & Workflows
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{activeCount} active</Badge>
          {triggeredCount > 0 && (
            <Badge className="bg-yellow-600 text-xs">{triggeredCount} triggered</Badge>
          )}
          {pausedCount > 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">{pausedCount} paused</Badge>
          )}
          <Badge variant="outline" className="text-xs">{workflows.length} workflows</Badge>
        </div>
      </div>

      {/* Triggered alerts banner */}
      {triggeredCount > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{triggeredCount} alert{triggeredCount !== 1 ? 's' : ''} triggered</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={clearTriggered}>
                <Trash2 className="h-3 w-3" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all" className="gap-1 text-xs"><Filter className="h-3 w-3" /> All</TabsTrigger>
          <TabsTrigger value="price" className="gap-1 text-xs"><TrendingUp className="h-3 w-3" /> Price</TabsTrigger>
          <TabsTrigger value="technical" className="gap-1 text-xs"><Activity className="h-3 w-3" /> Technical</TabsTrigger>
          <TabsTrigger value="volume" className="gap-1 text-xs"><Volume2 className="h-3 w-3" /> Volume</TabsTrigger>
          <TabsTrigger value="sentiment" className="gap-1 text-xs"><Newspaper className="h-3 w-3" /> Sentiment</TabsTrigger>
          <TabsTrigger value="portfolio" className="gap-1 text-xs"><Briefcase className="h-3 w-3" /> Portfolio</TabsTrigger>
          <TabsTrigger value="workflows" className="gap-1 text-xs"><Zap className="h-3 w-3" /> Workflows</TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-xs"><Clock className="h-3 w-3" /> History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-4">
              <AlertList alerts={alerts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Create Price Alert</CardTitle></CardHeader>
            <CardContent><PriceAlertForm /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Price Alerts</CardTitle></CardHeader>
            <CardContent><AlertList alerts={alerts} filter="price" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Create Technical Alert</CardTitle></CardHeader>
            <CardContent><TechnicalAlertForm /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Technical Alerts</CardTitle></CardHeader>
            <CardContent><AlertList alerts={alerts} filter="technical" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Create Volume Alert</CardTitle></CardHeader>
            <CardContent><VolumeAlertForm /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Volume Alerts</CardTitle></CardHeader>
            <CardContent><AlertList alerts={alerts} filter="volume" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Create Sentiment Alert</CardTitle></CardHeader>
            <CardContent><SentimentAlertForm /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sentiment Alerts</CardTitle></CardHeader>
            <CardContent><AlertList alerts={alerts} filter="sentiment" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Create Portfolio Alert</CardTitle></CardHeader>
            <CardContent><PortfolioAlertForm /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Portfolio Alerts</CardTitle></CardHeader>
            <CardContent><AlertList alerts={alerts} filter="portfolio" /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-4">
              <AlertHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
