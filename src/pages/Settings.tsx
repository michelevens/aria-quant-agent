import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from '@/contexts/ThemeContext'
import {
  isAlphaVantageConnected,
  validateKey,
  setAlphaVantageKey,
  removeAlphaVantageKey,
  getAlphaVantageKey,
} from '@/services/alphaVantage'
import { CheckCircle2, Loader2, XCircle, ExternalLink } from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const [avKey, setAvKey] = useState('')
  const [avConnected, setAvConnected] = useState(isAlphaVantageConnected)
  const [avValidating, setAvValidating] = useState(false)
  const [avError, setAvError] = useState<string | null>(null)
  const [avSuccess, setAvSuccess] = useState(false)

  useEffect(() => {
    const key = getAlphaVantageKey()
    if (key) setAvKey(key)
  }, [])

  const handleConnectAV = async () => {
    if (!avKey.trim()) return
    setAvValidating(true)
    setAvError(null)
    setAvSuccess(false)

    const valid = await validateKey(avKey.trim())
    if (valid) {
      setAlphaVantageKey(avKey.trim())
      setAvConnected(true)
      setAvSuccess(true)
      setTimeout(() => setAvSuccess(false), 3000)
    } else {
      setAvError('Invalid API key or rate limit exceeded. Please check your key.')
    }
    setAvValidating(false)
  }

  const handleDisconnectAV = () => {
    removeAlphaVantageKey()
    setAvKey('')
    setAvConnected(false)
    setAvError(null)
    setAvSuccess(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-lg font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">API Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Yahoo Finance</p>
              <p className="text-xs text-muted-foreground">Free market data provider — no key required</p>
            </div>
            <Badge className="bg-emerald-600 text-xs">Connected</Badge>
          </div>
          <Separator />

          {/* Alpha Vantage */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Alpha Vantage</p>
              <p className="text-xs text-muted-foreground">
                Technical indicators, fundamentals & earnings
              </p>
            </div>
            {avConnected ? (
              <Badge className="bg-emerald-600 text-xs">Connected</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Not Connected</Badge>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">API Key</label>
            <div className="flex gap-2">
              <Input
                value={avKey}
                onChange={(e) => setAvKey(e.target.value)}
                placeholder="Enter your Alpha Vantage API key"
                className="h-8 text-sm"
                type={avConnected ? 'password' : 'text'}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConnectAV() }}
              />
              {avConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-red-500"
                  onClick={handleDisconnectAV}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleConnectAV}
                  disabled={avValidating || !avKey.trim()}
                >
                  {avValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
                </Button>
              )}
            </div>
            {avError && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <XCircle className="h-3 w-3" />
                {avError}
              </div>
            )}
            {avSuccess && (
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />
                Alpha Vantage connected successfully!
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Free key: 25 requests/day.{' '}
              <a
                href="https://www.alphavantage.co/support/#api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                Get a free key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>

          {avConnected && (
            <div className="rounded-md bg-emerald-500/10 px-3 py-2">
              <p className="text-xs text-emerald-500 font-medium">Alpha Vantage features unlocked:</p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                <li>• Company fundamentals (P/E, EPS, margins, beta, sector)</li>
                <li>• Earnings history with surprise tracking</li>
                <li>• Alpha Vantage RSI, MACD, SMA indicators</li>
                <li>• Analyst target prices</li>
              </ul>
            </div>
          )}

          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Finnhub</p>
              <p className="text-xs text-muted-foreground">Real-time quotes & news</p>
            </div>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Risk Tolerance</label>
              <Select defaultValue="moderate">
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Max Position Size</label>
              <Input defaultValue="10000" className="h-8 text-sm" type="number" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Daily Loss Limit</label>
              <Input defaultValue="2500" className="h-8 text-sm" type="number" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Max Open Positions</label>
              <Input defaultValue="10" className="h-8 text-sm" type="number" />
            </div>
          </div>
          <Button size="sm" className="text-xs">Save Configuration</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Theme</label>
            <Select value={theme} onValueChange={(v: string | null) => { if (v) setTheme(v as 'dark' | 'light' | 'system') }}>
              <SelectTrigger className="h-8 w-48 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
            {[
              ['1', 'Dashboard'], ['2', 'Trade'], ['3', 'Portfolio'],
              ['4', 'Charts'], ['5', 'Watchlist'], ['6', 'Orders'],
              ['7', 'Screener'], ['8', 'News'], ['9', 'AI Agent'],
              ['0', 'Settings'], ['/', 'Focus Search'], ['Esc', 'Close/Blur'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-2">
                <kbd className="rounded border border-border bg-accent px-1.5 py-0.5 font-mono text-xs">{key}</kbd>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
