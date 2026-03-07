import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  Bot,
  Play,
  Square,
  Send,
  Activity,
  Brain,
  Shield,
  Zap,
} from 'lucide-react'

const agentLogs = [
  { time: '09:30:01', type: 'info', message: 'Agent initialized. Scanning market conditions...' },
  { time: '09:30:05', type: 'analysis', message: 'Detected bullish momentum on NVDA (RSI: 68.2, MACD crossover)' },
  { time: '09:30:12', type: 'signal', message: 'BUY signal generated: NVDA @ $862.50 | Confidence: 87%' },
  { time: '09:32:14', type: 'trade', message: 'Executed BUY 50 NVDA @ $862.50 (LIMIT)' },
  { time: '09:45:00', type: 'analysis', message: 'AAPL approaching support at $188.50, volume increasing' },
  { time: '09:45:28', type: 'trade', message: 'Executed BUY 25 AAPL @ $189.84 (MARKET)' },
  { time: '10:00:00', type: 'info', message: 'Portfolio risk check: VaR within limits (2.3% < 5% max)' },
  { time: '10:12:30', type: 'analysis', message: 'TSLA showing weakness. Head & shoulders pattern forming on 1H' },
  { time: '10:12:45', type: 'signal', message: 'SELL signal generated: TSLA @ $178.00 | Confidence: 72%' },
  { time: '10:30:00', type: 'info', message: 'Mid-morning scan: 3 active positions, 1 pending order' },
]

const logColors: Record<string, string> = {
  info: 'text-muted-foreground',
  analysis: 'text-blue-400',
  signal: 'text-yellow-400',
  trade: 'text-emerald-400',
}

export function Agent() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">AI Trading Agent</h2>
          <Badge className="bg-emerald-600 text-xs">Active</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Play className="h-3.5 w-3.5" />
            Start
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs text-red-500">
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Strategy</p>
              <p className="text-sm font-medium">Momentum + Mean Rev</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Activity className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="text-sm font-medium">68.4%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Zap className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Trades Today</p>
              <p className="text-sm font-medium">6</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Risk Level</p>
              <p className="text-sm font-medium">Moderate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4" />
              Agent Log
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-80">
              <div className="space-y-1 p-3 font-mono text-xs">
                {agentLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="shrink-0 text-muted-foreground">[{log.time}]</span>
                    <span className={logColors[log.type] ?? 'text-foreground'}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chat with Agent</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ScrollArea className="mb-3 flex-1 rounded-md border border-border p-3">
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Aria
                  </Badge>
                  <p className="text-muted-foreground">
                    I'm monitoring 8 positions across your portfolio. NVDA is showing
                    strong momentum with a 2.14% gain today. I executed 2 trades this
                    morning based on technical signals. Would you like me to analyze any
                    specific position or adjust the strategy parameters?
                  </p>
                </div>
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Aria about your portfolio..."
                className="h-9 text-sm"
              />
              <Button size="sm" className="h-9 px-3">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
