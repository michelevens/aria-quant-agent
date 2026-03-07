import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { ScrollArea } from '@/components/ui/scroll-area'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchHistoricalData } from '@/services/marketData'
import { generateSignal } from '@/lib/strategies/signals'
import { computeIndicators } from '@/lib/analytics/technicals'
import type { Signal } from '@/types/market'
import {
  Bot,
  Play,
  Square,

  Activity,
  Brain,
  Shield,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface LogEntry {
  time: string
  type: 'info' | 'analysis' | 'signal' | 'trade' | 'risk'
  message: string
}

const logColors: Record<string, string> = {
  info: 'text-muted-foreground',
  analysis: 'text-blue-400',
  signal: 'text-yellow-400',
  trade: 'text-emerald-400',
  risk: 'text-red-400',
}

function timeStr(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

export function Agent() {
  const { holdings, totals } = usePortfolioContext()
  const [running, setRunning] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [signals, setSignals] = useState<Signal[]>([])

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev, { time: timeStr(), type, message }])
  }, [])

  const runScan = useCallback(async () => {
    if (holdings.length === 0) return
    setScanning(true)
    addLog('info', `Starting scan of ${holdings.length} positions...`)

    const newSignals: Signal[] = []

    for (const holding of holdings) {
      try {
        addLog('info', `Analyzing ${holding.symbol}...`)
        const data = await fetchHistoricalData(holding.symbol, '1Y')

        if (data.length < 50) {
          addLog('info', `${holding.symbol}: Insufficient data, skipping`)
          continue
        }

        const ind = computeIndicators(data)
        const signal = generateSignal(holding.symbol, data)
        newSignals.push(signal)

        // Log analysis
        addLog('analysis', `${holding.symbol}: RSI=${ind.rsi14.toFixed(1)} | MACD hist=${ind.macd.histogram.toFixed(2)} | ADX=${ind.adx14.toFixed(1)}`)

        if (signal.type !== 'HOLD') {
          addLog('signal', `${signal.type} ${holding.symbol} @ $${signal.price.toFixed(2)} | Confidence: ${signal.strength}% | R:R ${signal.riskReward}:1`)
        }
      } catch {
        addLog('info', `${holding.symbol}: Failed to fetch data`)
      }
    }

    // Risk assessment
    const buySignals = newSignals.filter((s) => s.type === 'BUY').length
    const sellSignals = newSignals.filter((s) => s.type === 'SELL').length
    addLog('risk', `Scan complete: ${buySignals} BUY, ${sellSignals} SELL, ${newSignals.length - buySignals - sellSignals} HOLD`)
    addLog('info', `Portfolio value: $${totals.totalValue.toLocaleString()} | Day P&L: ${totals.dayChange >= 0 ? '+' : ''}$${totals.dayChange.toFixed(2)}`)

    setSignals(newSignals)
    setScanning(false)
  }, [holdings, totals, addLog])

  const handleStart = () => {
    setRunning(true)
    setLogs([])
    addLog('info', 'Aria Quant Agent activated. Initializing market scan...')
    runScan()
  }

  const handleStop = () => {
    setRunning(false)
    addLog('info', 'Agent stopped.')
  }

  const buySignals = signals.filter((s) => s.type === 'BUY')
  const sellSignals = signals.filter((s) => s.type === 'SELL')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">AI Trading Agent</h2>
          <Badge className={running ? 'bg-emerald-600 text-xs' : 'bg-zinc-600 text-xs'}>
            {running ? 'Active' : 'Idle'}
          </Badge>
          {scanning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={handleStart}
            disabled={scanning}
          >
            <Play className="h-3.5 w-3.5" />
            {running ? 'Re-scan' : 'Start'}
          </Button>
          {running && (
            <Button variant="outline" size="sm" className="gap-1 text-xs text-red-500" onClick={handleStop}>
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Strategy</p>
              <p className="text-sm font-medium">Multi-Factor Quant</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Activity className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Buy Signals</p>
              <p className="text-sm font-medium text-emerald-500">{buySignals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Zap className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sell Signals</p>
              <p className="text-sm font-medium text-red-500">{sellSignals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Positions Scanned</p>
              <p className="text-sm font-medium">{signals.length} / {holdings.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agent Log */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4" />
              Agent Log
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-96">
              <div className="space-y-1 p-3 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Click Start to begin scanning your portfolio...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="shrink-0 text-muted-foreground">[{log.time}]</span>
                      <span className={logColors[log.type] ?? 'text-foreground'}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Signals */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Generated Signals</span>
              {signals.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={runScan} disabled={scanning}>
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-96">
              <div className="divide-y divide-border">
                {signals.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No signals yet. Start the agent to scan your portfolio.
                  </p>
                ) : (
                  signals
                    .sort((a, b) => Math.abs(b.strength - 50) - Math.abs(a.strength - 50))
                    .map((sig) => (
                      <div key={sig.symbol} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{sig.symbol}</span>
                            <Badge
                              className={`text-xs ${
                                sig.type === 'BUY'
                                  ? 'bg-emerald-600'
                                  : sig.type === 'SELL'
                                  ? 'bg-red-600'
                                  : 'bg-zinc-600'
                              }`}
                            >
                              {sig.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {sig.strength}% confidence
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{sig.reason}</p>
                        <div className="mt-2 flex gap-4 text-xs">
                          <span>Entry: <span className="font-medium">${sig.price.toFixed(2)}</span></span>
                          <span>SL: <span className="font-medium text-red-400">${sig.stopLoss.toFixed(2)}</span></span>
                          <span>TP: <span className="font-medium text-emerald-400">${sig.takeProfit.toFixed(2)}</span></span>
                          <span>R:R: <span className="font-medium">{sig.riskReward}:1</span></span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
