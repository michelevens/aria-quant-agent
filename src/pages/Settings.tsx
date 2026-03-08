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
import {
  isFinnhubConnected,
  validateFinnhubKey,
  setFinnhubKey,
  removeFinnhubKey,
  getFinnhubKey,
} from '@/services/finnhub'
import {
  getAlpacaConfig,
  setAlpacaConfig,
  removeAlpacaConfig,
  validateAlpacaKeys,
  fetchAccount,
  type AlpacaAccount,
} from '@/services/alpaca'
import { CheckCircle2, Loader2, XCircle, ExternalLink } from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useTheme()

  // Alpha Vantage
  const [avKey, setAvKey] = useState('')
  const [avConnected, setAvConnected] = useState(isAlphaVantageConnected)
  const [avValidating, setAvValidating] = useState(false)
  const [avError, setAvError] = useState<string | null>(null)
  const [avSuccess, setAvSuccess] = useState(false)

  // Alpaca
  const [alpacaKey, setAlpacaKey] = useState('')
  const [alpacaSecret, setAlpacaSecret] = useState('')
  const [alpacaPaper, setAlpacaPaper] = useState(true)
  const [alpacaConnected, setAlpacaConnected] = useState(() => getAlpacaConfig() !== null)
  const [alpacaValidating, setAlpacaValidating] = useState(false)
  const [alpacaError, setAlpacaError] = useState<string | null>(null)
  const [alpacaSuccess, setAlpacaSuccess] = useState(false)
  const [alpacaAccount, setAlpacaAccount] = useState<AlpacaAccount | null>(null)

  // Finnhub
  const [fhKey, setFhKey] = useState('')
  const [fhConnected, setFhConnected] = useState(isFinnhubConnected)
  const [fhValidating, setFhValidating] = useState(false)
  const [fhError, setFhError] = useState<string | null>(null)
  const [fhSuccess, setFhSuccess] = useState(false)

  useEffect(() => {
    const key = getAlphaVantageKey()
    if (key) setAvKey(key)
    const fk = getFinnhubKey()
    if (fk) setFhKey(fk)
    const ac = getAlpacaConfig()
    if (ac) {
      setAlpacaKey(ac.apiKey)
      setAlpacaSecret(ac.secretKey)
      setAlpacaPaper(ac.paper)
      // Fetch account info
      fetchAccount().then(setAlpacaAccount).catch(() => {})
    }
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

  const handleConnectFH = async () => {
    if (!fhKey.trim()) return
    setFhValidating(true)
    setFhError(null)
    setFhSuccess(false)

    const valid = await validateFinnhubKey(fhKey.trim())
    if (valid) {
      setFinnhubKey(fhKey.trim())
      setFhConnected(true)
      setFhSuccess(true)
      setTimeout(() => setFhSuccess(false), 3000)
    } else {
      setFhError('Invalid API key. Please check your key.')
    }
    setFhValidating(false)
  }

  const handleDisconnectFH = () => {
    removeFinnhubKey()
    setFhKey('')
    setFhConnected(false)
    setFhError(null)
    setFhSuccess(false)
  }

  const handleConnectAlpaca = async () => {
    if (!alpacaKey.trim() || !alpacaSecret.trim()) return
    setAlpacaValidating(true)
    setAlpacaError(null)
    setAlpacaSuccess(false)

    const valid = await validateAlpacaKeys(alpacaKey.trim(), alpacaSecret.trim(), alpacaPaper)
    if (valid) {
      setAlpacaConfig({ apiKey: alpacaKey.trim(), secretKey: alpacaSecret.trim(), paper: alpacaPaper })
      setAlpacaConnected(true)
      setAlpacaSuccess(true)
      fetchAccount().then(setAlpacaAccount).catch(() => {})
      setTimeout(() => setAlpacaSuccess(false), 3000)
    } else {
      setAlpacaError('Invalid API keys. Check your key and secret.')
    }
    setAlpacaValidating(false)
  }

  const handleDisconnectAlpaca = () => {
    removeAlpacaConfig()
    setAlpacaKey('')
    setAlpacaSecret('')
    setAlpacaConnected(false)
    setAlpacaError(null)
    setAlpacaSuccess(false)
    setAlpacaAccount(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>

      {/* Alpaca Brokerage — Full Width */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Brokerage — Alpaca</CardTitle>
            {alpacaConnected ? (
              <div className="flex items-center gap-2">
                <Badge className="text-xs" style={{ backgroundColor: alpacaPaper ? '#3b82f6' : '#10b981' }}>
                  {alpacaPaper ? 'Paper Trading' : 'LIVE'}
                </Badge>
                <Badge className="bg-emerald-600 text-xs">Connected</Badge>
              </div>
            ) : (
              <Badge variant="outline" className="text-xs">Not Connected</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Connect your Alpaca account to place real orders, sync positions, and track P&L
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {alpacaConnected && alpacaAccount && (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 rounded-md bg-accent/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Equity</p>
                <p className="text-sm font-bold">${Number(alpacaAccount.equity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cash</p>
                <p className="text-sm font-bold">${Number(alpacaAccount.cash).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Buying Power</p>
                <p className="text-sm font-bold">${Number(alpacaAccount.buying_power).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-bold capitalize">{alpacaAccount.status}</p>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">API Key ID</label>
              <Input
                value={alpacaKey}
                onChange={(e) => setAlpacaKey(e.target.value)}
                placeholder="PK..."
                className="h-7 text-xs font-mono"
                type={alpacaConnected ? 'password' : 'text'}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Secret Key</label>
              <Input
                value={alpacaSecret}
                onChange={(e) => setAlpacaSecret(e.target.value)}
                placeholder="Secret key..."
                className="h-7 text-xs font-mono"
                type="password"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Mode:</label>
              <Select value={alpacaPaper ? 'paper' : 'live'} onValueChange={(v) => { if (v) setAlpacaPaper(v === 'paper') }}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">Paper</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {alpacaConnected ? (
              <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={handleDisconnectAlpaca}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" className="h-7 text-xs" onClick={handleConnectAlpaca} disabled={alpacaValidating || !alpacaKey.trim() || !alpacaSecret.trim()}>
                {alpacaValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
              </Button>
            )}
          </div>

          {alpacaError && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <XCircle className="h-3 w-3" />{alpacaError}
            </div>
          )}
          {alpacaSuccess && (
            <div className="flex items-center gap-1 text-xs text-emerald-500">
              <CheckCircle2 className="h-3 w-3" />Alpaca connected! {alpacaPaper ? 'Paper trading mode.' : 'LIVE trading mode.'}
            </div>
          )}

          {!alpacaConnected && (
            <p className="text-xs text-muted-foreground">
              Free paper trading account.{' '}
              <a href="https://app.alpaca.markets/signup" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                Sign up at Alpaca <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* API Connections — Left Column */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Data APIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Yahoo Finance</p>
                <p className="text-xs text-muted-foreground">Free — no key required</p>
              </div>
              <Badge className="bg-emerald-600 text-xs">Connected</Badge>
            </div>
            <Separator />

            {/* Alpha Vantage */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Alpha Vantage</p>
              {avConnected ? (
                <Badge className="bg-emerald-600 text-xs">Connected</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Not Connected</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={avKey}
                onChange={(e) => setAvKey(e.target.value)}
                placeholder="Enter your Alpha Vantage API key"
                className="h-7 text-xs"
                type={avConnected ? 'password' : 'text'}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConnectAV() }}
              />
              {avConnected ? (
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={handleDisconnectAV}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" className="h-7 text-xs" onClick={handleConnectAV} disabled={avValidating || !avKey.trim()}>
                  {avValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
                </Button>
              )}
            </div>
            {avError && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <XCircle className="h-3 w-3" />{avError}
              </div>
            )}
            {avSuccess && (
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />Connected!
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Free: 25 req/day.{' '}
              <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                Get key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>

            <Separator />

            {/* Finnhub */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Finnhub</p>
              {fhConnected ? (
                <Badge className="bg-emerald-600 text-xs">Connected</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Not Connected</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={fhKey}
                onChange={(e) => setFhKey(e.target.value)}
                placeholder="Enter your Finnhub API key"
                className="h-7 text-xs"
                type={fhConnected ? 'password' : 'text'}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConnectFH() }}
              />
              {fhConnected ? (
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={handleDisconnectFH}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" className="h-7 text-xs" onClick={handleConnectFH} disabled={fhValidating || !fhKey.trim()}>
                  {fhValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
                </Button>
              )}
            </div>
            {fhError && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <XCircle className="h-3 w-3" />{fhError}
              </div>
            )}
            {fhSuccess && (
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />Connected!
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Free: 60 calls/min.{' '}
              <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                Get key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Right Column — Agent Config + Appearance + Shortcuts */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agent Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Risk Tolerance</label>
                  <Select defaultValue="moderate">
                    <SelectTrigger className="h-7 text-xs">
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
                  <Input defaultValue="10000" className="h-7 text-xs" type="number" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Daily Loss Limit</label>
                  <Input defaultValue="2500" className="h-7 text-xs" type="number" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Max Open Positions</label>
                  <Input defaultValue="10" className="h-7 text-xs" type="number" />
                </div>
              </div>
              <Button size="sm" className="h-7 text-xs">Save Configuration</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Theme</label>
                <Select value={theme} onValueChange={(v: string | null) => { if (v) setTheme(v as 'dark' | 'light' | 'system') }}>
                  <SelectTrigger className="h-7 w-36 text-xs">
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  ['1', 'Dashboard'], ['2', 'Trade'], ['3', 'Portfolio'],
                  ['4', 'Charts'], ['5', 'Watchlist'], ['6', 'Orders'],
                  ['7', 'Screener'], ['8', 'News'], ['9', 'AI Agent'],
                  ['0', 'Settings'], ['/', 'Focus Search'], ['Esc', 'Close/Blur'],
                  ['Ctrl+K', 'Command Palette'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd className="rounded border border-border bg-accent px-1 py-0.5 font-mono text-xs">{key}</kbd>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
