import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FlaskConical, Plus, Trash2, Play, Save, GripVertical,
  TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

type Operator = '>' | '<' | '>=' | '<=' | 'crosses_above' | 'crosses_below'
type Indicator = 'RSI' | 'MACD' | 'SMA' | 'EMA' | 'BB_Upper' | 'BB_Lower' | 'Price' | 'Volume' | 'ATR' | 'ADX' | 'Stoch_K'

interface Condition {
  id: string
  indicator: Indicator
  operator: Operator
  value: string
}

interface Strategy {
  id: string
  name: string
  entryConditions: Condition[]
  exitConditions: Condition[]
  stopLoss: string
  takeProfit: string
  positionSize: string
}

const INDICATORS: Indicator[] = ['RSI', 'MACD', 'SMA', 'EMA', 'BB_Upper', 'BB_Lower', 'Price', 'Volume', 'ATR', 'ADX', 'Stoch_K']
const OPERATORS: { value: Operator; label: string }[] = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'crosses_above', label: 'Crosses Above' },
  { value: 'crosses_below', label: 'Crosses Below' },
]

const STORAGE_KEY = 'aria-quant-strategies'

function loadStrategies(): Strategy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStrategies(strategies: Strategy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies))
}

function newCondition(): Condition {
  return { id: crypto.randomUUID(), indicator: 'RSI', operator: '>', value: '70' }
}

function newStrategy(): Strategy {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Strategy',
    entryConditions: [newCondition()],
    exitConditions: [newCondition()],
    stopLoss: '2',
    takeProfit: '5',
    positionSize: '10',
  }
}

const PRESET_STRATEGIES: Strategy[] = [
  {
    id: 'preset-rsi-mean-reversion',
    name: 'RSI Mean Reversion',
    entryConditions: [
      { id: 'p1', indicator: 'RSI', operator: '<', value: '30' },
      { id: 'p2', indicator: 'ADX', operator: '>', value: '20' },
    ],
    exitConditions: [
      { id: 'p3', indicator: 'RSI', operator: '>', value: '70' },
    ],
    stopLoss: '3', takeProfit: '8', positionSize: '10',
  },
  {
    id: 'preset-macd-crossover',
    name: 'MACD Momentum',
    entryConditions: [
      { id: 'p4', indicator: 'MACD', operator: 'crosses_above', value: '0' },
      { id: 'p5', indicator: 'Volume', operator: '>', value: '1000000' },
    ],
    exitConditions: [
      { id: 'p6', indicator: 'MACD', operator: 'crosses_below', value: '0' },
    ],
    stopLoss: '2', takeProfit: '6', positionSize: '15',
  },
  {
    id: 'preset-bb-breakout',
    name: 'Bollinger Band Breakout',
    entryConditions: [
      { id: 'p7', indicator: 'Price', operator: '>', value: 'BB_Upper' },
      { id: 'p8', indicator: 'ATR', operator: '>', value: '2' },
    ],
    exitConditions: [
      { id: 'p9', indicator: 'Price', operator: '<', value: 'SMA' },
    ],
    stopLoss: '2.5', takeProfit: '7', positionSize: '8',
  },
]

function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: Condition
  onChange: (c: Condition) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
      <select
        value={condition.indicator}
        onChange={(e) => onChange({ ...condition, indicator: e.target.value as Indicator })}
        className="h-8 rounded-md border border-border bg-transparent px-2 text-sm"
      >
        {INDICATORS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
      </select>
      <select
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as Operator })}
        className="h-8 rounded-md border border-border bg-transparent px-2 text-sm"
      >
        {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>
      <Input
        value={condition.value}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
        className="h-8 w-24 text-sm"
        placeholder="Value"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  )
}

export function StrategyBuilder() {
  const [strategies, setStrategies] = useState<Strategy[]>(loadStrategies)
  const [active, setActive] = useState<Strategy>(strategies[0] ?? newStrategy())

  const save = useCallback(() => {
    const updated = strategies.some((s) => s.id === active.id)
      ? strategies.map((s) => s.id === active.id ? active : s)
      : [...strategies, active]
    setStrategies(updated)
    saveStrategies(updated)
    toast.success(`Strategy "${active.name}" saved`)
  }, [strategies, active])

  const deleteStrategy = useCallback((id: string) => {
    const updated = strategies.filter((s) => s.id !== id)
    setStrategies(updated)
    saveStrategies(updated)
    if (active.id === id) setActive(updated[0] ?? newStrategy())
    toast.success('Strategy deleted')
  }, [strategies, active])

  const loadPreset = (preset: Strategy) => {
    const s = { ...preset, id: crypto.randomUUID() }
    setActive(s)
  }

  const updateCondition = (type: 'entry' | 'exit', id: string, updated: Condition) => {
    const key = type === 'entry' ? 'entryConditions' : 'exitConditions'
    setActive((prev) => ({
      ...prev,
      [key]: prev[key].map((c) => c.id === id ? updated : c),
    }))
  }

  const removeCondition = (type: 'entry' | 'exit', id: string) => {
    const key = type === 'entry' ? 'entryConditions' : 'exitConditions'
    setActive((prev) => ({
      ...prev,
      [key]: prev[key].filter((c) => c.id !== id),
    }))
  }

  const addCondition = (type: 'entry' | 'exit') => {
    const key = type === 'entry' ? 'entryConditions' : 'exitConditions'
    setActive((prev) => ({
      ...prev,
      [key]: [...prev[key], newCondition()],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <FlaskConical className="h-5 w-5" />
          Strategy Builder
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setActive(newStrategy()) }}>
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={save}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" className="gap-1 text-xs">
            <Play className="h-3.5 w-3.5" />
            Backtest
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Saved Strategies Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Saved Strategies</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea style={{ maxHeight: '200px' }}>
                <div className="divide-y divide-border">
                  {strategies.length === 0 && (
                    <p className="px-4 py-6 text-center text-xs text-muted-foreground">No saved strategies</p>
                  )}
                  {strategies.map((s) => (
                    <div
                      key={s.id}
                      className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-accent/50"
                      style={s.id === active.id ? { backgroundColor: 'var(--accent)' } : undefined}
                      onClick={() => setActive(s)}
                    >
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.entryConditions.length} entry, {s.exitConditions.length} exit
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); deleteStrategy(s.id) }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preset Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {PRESET_STRATEGIES.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => loadPreset(p)}
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  {p.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Builder */}
        <div className="space-y-4 lg:col-span-3">
          {/* Strategy name */}
          <Card>
            <CardContent className="py-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Strategy Name</label>
              <Input
                value={active.name}
                onChange={(e) => setActive((prev) => ({ ...prev, name: e.target.value }))}
                className="h-9 text-sm font-semibold"
              />
            </CardContent>
          </Card>

          {/* Entry Conditions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Entry Conditions
                <Badge variant="outline" className="ml-auto h-5 text-xs">{active.entryConditions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {active.entryConditions.map((c, i) => (
                <div key={c.id}>
                  {i > 0 && <div className="my-1 text-center text-xs font-medium text-muted-foreground">AND</div>}
                  <ConditionRow
                    condition={c}
                    onChange={(updated) => updateCondition('entry', c.id, updated)}
                    onRemove={() => removeCondition('entry', c.id)}
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addCondition('entry')}>
                <Plus className="h-3.5 w-3.5" />
                Add Condition
              </Button>
            </CardContent>
          </Card>

          {/* Flow arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 rotate-90 text-muted-foreground" />
          </div>

          {/* Exit Conditions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Exit Conditions
                <Badge variant="outline" className="ml-auto h-5 text-xs">{active.exitConditions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {active.exitConditions.map((c, i) => (
                <div key={c.id}>
                  {i > 0 && <div className="my-1 text-center text-xs font-medium text-muted-foreground">OR</div>}
                  <ConditionRow
                    condition={c}
                    onChange={(updated) => updateCondition('exit', c.id, updated)}
                    onRemove={() => removeCondition('exit', c.id)}
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addCondition('exit')}>
                <Plus className="h-3.5 w-3.5" />
                Add Condition
              </Button>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Stop Loss (%)</label>
                  <Input
                    type="number"
                    value={active.stopLoss}
                    onChange={(e) => setActive((prev) => ({ ...prev, stopLoss: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Take Profit (%)</label>
                  <Input
                    type="number"
                    value={active.takeProfit}
                    onChange={(e) => setActive((prev) => ({ ...prev, takeProfit: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Position Size (%)</label>
                  <Input
                    type="number"
                    value={active.positionSize}
                    onChange={(e) => setActive((prev) => ({ ...prev, positionSize: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
