import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchHistoricalData } from '@/services/marketData'
import { generateSignal } from '@/lib/strategies/signals'
import { computeIndicators } from '@/lib/analytics/technicals'
import { dailyReturns, stddev, correlation, sharpeRatio } from '@/lib/analytics/portfolio'
import type { Signal, OHLCV } from '@/types/market'
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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Crosshair,
  BarChart3,
} from 'lucide-react'

interface LogEntry {
  time: string
  type: 'info' | 'analysis' | 'signal' | 'trade' | 'risk' | 'warning'
  message: string
}

const logColors: Record<string, string> = {
  info: 'text-muted-foreground',
  analysis: 'text-blue-400',
  signal: 'text-yellow-400',
  trade: 'text-emerald-400',
  risk: 'text-red-400',
  warning: 'text-orange-400',
}

function timeStr(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

interface PortfolioInsight {
  type: 'risk' | 'opportunity' | 'warning'
  title: string
  description: string
}

interface StockAnalysis {
  symbol: string
  price: number
  rsi: number
  macd: number
  adx: number
  stochK: number
  signal: Signal
  weight: number
}

export function Agent() {
  const { holdings, totals } = usePortfolioContext()
  const [running, setRunning] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [insights, setInsights] = useState<PortfolioInsight[]>([])
  const [analyses, setAnalyses] = useState<StockAnalysis[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev, { time: timeStr(), type, message }])
  }, [])

  const runScan = useCallback(async () => {
    if (holdings.length === 0) return
    setScanning(true)
    setInsights([])
    setAnalyses([])
    addLog('info', `Aria Quant Agent v2.0 — Multi-Strategy Analysis`)
    addLog('info', `Scanning ${holdings.length} positions | Portfolio: $${totals.totalValue.toLocaleString()}`)
    addLog('info', '---')

    const newSignals: Signal[] = []
    const allHistoricals: OHLCV[][] = []
    const newInsights: PortfolioInsight[] = []
    const newAnalyses: StockAnalysis[] = []

    // Phase 1: Individual stock analysis
    addLog('analysis', 'Phase 1: Individual Technical Analysis')
    for (const holding of holdings) {
      try {
        addLog('info', `Analyzing ${holding.symbol}...`)
        const data = await fetchHistoricalData(holding.symbol, '1Y')
        allHistoricals.push(data)

        if (data.length < 50) {
          addLog('info', `${holding.symbol}: Insufficient data, skipping`)
          continue
        }

        const ind = computeIndicators(data)
        const signal = generateSignal(holding.symbol, data)
        newSignals.push(signal)

        newAnalyses.push({
          symbol: holding.symbol,
          price: holding.currentPrice,
          rsi: ind.rsi14,
          macd: ind.macd.histogram,
          adx: ind.adx14,
          stochK: ind.stochastic.k,
          signal,
          weight: holding.weight,
        })

        addLog('analysis', `${holding.symbol}: RSI=${ind.rsi14.toFixed(1)} | MACD hist=${ind.macd.histogram.toFixed(2)} | ADX=${ind.adx14.toFixed(1)} | Stoch %K=${ind.stochastic.k.toFixed(1)}`)

        if (signal.type !== 'HOLD') {
          addLog('signal', `${signal.type} ${holding.symbol} @ $${signal.price.toFixed(2)} | Confidence: ${signal.strength}% | R:R ${signal.riskReward}:1`)
        }

        if (ind.rsi14 > 75) {
          newInsights.push({ type: 'warning', title: `${holding.symbol} Extremely Overbought`, description: `RSI at ${ind.rsi14.toFixed(1)} — consider trimming position or tightening stops` })
        } else if (ind.rsi14 < 25) {
          newInsights.push({ type: 'opportunity', title: `${holding.symbol} Deeply Oversold`, description: `RSI at ${ind.rsi14.toFixed(1)} — potential mean-reversion opportunity` })
        }

        if (ind.adx14 > 40 && signal.type === 'SELL') {
          newInsights.push({ type: 'risk', title: `${holding.symbol} Strong Downtrend`, description: `ADX=${ind.adx14.toFixed(1)} with bearish signal — high conviction sell` })
        }
      } catch {
        addLog('info', `${holding.symbol}: Failed to fetch data`)
        allHistoricals.push([])
      }
    }

    // Phase 2: Portfolio-level risk analysis
    addLog('info', '---')
    addLog('risk', 'Phase 2: Portfolio Risk Assessment')

    try {
      const spData = await fetchHistoricalData('^GSPC', '1Y').catch(() => [] as OHLCV[])

      if (spData.length > 50) {
        const spReturns = dailyReturns(spData)
        const portfolioReturns: number[] = []
        const totalWeight = holdings.reduce((s, h) => s + h.marketValue, 0)
        const weights = holdings.map((h) => h.marketValue / (totalWeight || 1))
        const minLen = Math.min(spData.length, ...allHistoricals.map((h) => h.length))

        if (minLen > 30) {
          for (let i = 1; i < minLen; i++) {
            let dayReturn = 0
            for (let j = 0; j < allHistoricals.length; j++) {
              const d = allHistoricals[j]
              if (d.length >= minLen && d[i - 1].close > 0) {
                const ret = (d[i].close - d[i - 1].close) / d[i - 1].close
                dayReturn += ret * weights[j]
              }
            }
            portfolioReturns.push(dayReturn)
          }

          const vol = stddev(portfolioReturns) * Math.sqrt(252) * 100
          const corr = correlation(portfolioReturns, spReturns.slice(0, portfolioReturns.length))
          const sr = sharpeRatio(portfolioReturns)

          addLog('risk', `Portfolio Volatility: ${vol.toFixed(1)}% (annualized)`)
          addLog('risk', `S&P Correlation: ${corr.toFixed(2)}`)
          addLog('risk', `Sharpe Ratio: ${sr.toFixed(2)}`)

          if (vol > 35) {
            newInsights.push({ type: 'risk', title: 'High Portfolio Volatility', description: `Portfolio vol at ${vol.toFixed(1)}% — consider adding low-beta or bond positions` })
          }
          if (corr > 0.9) {
            newInsights.push({ type: 'warning', title: 'Low Diversification', description: `S&P correlation at ${corr.toFixed(2)} — portfolio moves in lockstep with market` })
          }
          if (sr < 0.5) {
            newInsights.push({ type: 'warning', title: 'Poor Risk-Adjusted Returns', description: `Sharpe ratio ${sr.toFixed(2)} — risk is not being compensated with returns` })
          }
        }
      }
    } catch {
      addLog('info', 'Could not compute portfolio-level risk metrics')
    }

    // Phase 3: Concentration risk
    addLog('info', '---')
    addLog('analysis', 'Phase 3: Concentration & Sector Analysis')

    const topHolding = holdings.reduce((max, h) => h.weight > max.weight ? h : max, holdings[0])
    if (topHolding && topHolding.weight > 20) {
      addLog('warning', `Concentration risk: ${topHolding.symbol} is ${topHolding.weight.toFixed(1)}% of portfolio`)
      newInsights.push({ type: 'risk', title: 'Concentration Risk', description: `${topHolding.symbol} represents ${topHolding.weight.toFixed(1)}% of portfolio — consider trimming to <15%` })
    }

    // Summary
    addLog('info', '---')
    const buySignalsList = newSignals.filter((s) => s.type === 'BUY')
    const sellSignalsList = newSignals.filter((s) => s.type === 'SELL')
    addLog('signal', `Scan complete: ${buySignalsList.length} BUY, ${sellSignalsList.length} SELL, ${newSignals.length - buySignalsList.length - sellSignalsList.length} HOLD`)
    addLog('info', `Generated ${newInsights.length} portfolio insights`)
    addLog('info', `Portfolio: $${totals.totalValue.toLocaleString()} | Day P&L: ${totals.dayChange >= 0 ? '+' : ''}$${totals.dayChange.toFixed(2)}`)

    setSignals(newSignals)
    setInsights(newInsights)
    setAnalyses(newAnalyses)
    setScanning(false)
  }, [holdings, totals, addLog])

  const handleStart = () => {
    setRunning(true)
    setLogs([])
    setSignals([])
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
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleStart} disabled={scanning}>
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
              <p className="text-sm font-medium">Multi-Factor v2</p>
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
              <p className="text-xs text-muted-foreground">Insights</p>
              <p className="text-sm font-medium">{insights.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Sub-sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <Bot className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="signals" className="gap-1 text-xs">
            <Crosshair className="h-3.5 w-3.5" /> Signals
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> Insights
            {insights.length > 0 && (
              <Badge className="ml-1 h-4 px-1 text-xs" variant="outline">{insights.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-1 text-xs">
            <Activity className="h-3.5 w-3.5" /> Log
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {insights.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Top Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.slice(0, 3).map((insight, i) => (
                  <InsightRow key={i} insight={insight} />
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Agent Log (Live)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-64">
                  <div className="space-y-1 p-3 font-mono text-xs">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground">Click Start to begin scanning your portfolio...</p>
                    ) : (
                      logs.slice(-30).map((log, i) => (
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

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Signals</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-64">
                  <div className="divide-y divide-border">
                    {signals.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        No signals yet. Start the agent to scan.
                      </p>
                    ) : (
                      signals
                        .filter((s) => s.type !== 'HOLD')
                        .sort((a, b) => b.strength - a.strength)
                        .slice(0, 5)
                        .map((sig) => <SignalRow key={sig.symbol} sig={sig} />)
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>All Generated Signals ({signals.length})</span>
                {signals.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={runScan} disabled={scanning}>
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="divide-y divide-border">
                  {signals.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Start the agent to generate signals.</p>
                  ) : (
                    signals
                      .sort((a, b) => Math.abs(b.strength - 50) - Math.abs(a.strength - 50))
                      .map((sig) => <SignalRow key={sig.symbol} sig={sig} />)
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Technical Analysis Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {analyses.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Run the agent to see analysis data.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Symbol</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Price</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">RSI</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">MACD Hist</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">ADX</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Stoch %K</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Weight</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Signal</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analyses.map((a) => (
                      <tr key={a.symbol} className="hover:bg-accent/30">
                        <td className="px-3 py-2 font-medium">{a.symbol}</td>
                        <td className="px-3 py-2 text-right">${a.price.toFixed(2)}</td>
                        <td className={`px-3 py-2 text-right ${a.rsi > 70 ? 'text-red-400' : a.rsi < 30 ? 'text-emerald-400' : ''}`}>
                          {a.rsi.toFixed(1)}
                        </td>
                        <td className={`px-3 py-2 text-right ${a.macd > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {a.macd.toFixed(3)}
                        </td>
                        <td className={`px-3 py-2 text-right ${a.adx > 25 ? 'font-medium' : 'text-muted-foreground'}`}>
                          {a.adx.toFixed(1)}
                        </td>
                        <td className={`px-3 py-2 text-right ${a.stochK > 80 ? 'text-red-400' : a.stochK < 20 ? 'text-emerald-400' : ''}`}>
                          {a.stochK.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{a.weight.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            className={`text-xs ${
                              a.signal.type === 'BUY' ? 'bg-emerald-600' : a.signal.type === 'SELL' ? 'bg-red-600' : 'bg-zinc-600'
                            }`}
                          >
                            {a.signal.type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{a.signal.strength}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Portfolio Insights ({insights.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Run the agent to generate insights.</p>
              ) : (
                insights.map((insight, i) => <InsightRow key={i} insight={insight} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full Log Tab */}
        <TabsContent value="log">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4" />
                Full Agent Log ({logs.length} entries)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-1 p-3 font-mono text-xs">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">Click Start to begin scanning...</p>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SignalRow({ sig }: { sig: Signal }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sig.type === 'BUY' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : sig.type === 'SELL' ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> : <Target className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm font-bold">{sig.symbol}</span>
          <Badge
            className={`text-xs ${
              sig.type === 'BUY' ? 'bg-emerald-600' : sig.type === 'SELL' ? 'bg-red-600' : 'bg-zinc-600'
            }`}
          >
            {sig.type}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{sig.strength}% confidence</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{sig.reason}</p>
      <div className="mt-2 flex gap-4 text-xs">
        <span>Entry: <span className="font-medium">${sig.price.toFixed(2)}</span></span>
        <span>SL: <span className="font-medium text-red-400">${sig.stopLoss.toFixed(2)}</span></span>
        <span>TP: <span className="font-medium text-emerald-400">${sig.takeProfit.toFixed(2)}</span></span>
        <span>R:R: <span className="font-medium">{sig.riskReward}:1</span></span>
      </div>
    </div>
  )
}

function InsightRow({ insight }: { insight: PortfolioInsight }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-md px-3 py-2 ${
        insight.type === 'risk' ? 'bg-red-500/10' : insight.type === 'warning' ? 'bg-yellow-500/10' : 'bg-emerald-500/10'
      }`}
    >
      <div className="mt-0.5">
        {insight.type === 'risk' ? <Shield className="h-4 w-4 text-red-500" /> :
         insight.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> :
         <TrendingUp className="h-4 w-4 text-emerald-500" />}
      </div>
      <div>
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="text-xs text-muted-foreground">{insight.description}</p>
      </div>
    </div>
  )
}
