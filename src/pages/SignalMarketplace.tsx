import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShoppingCart, Star, Users,
  Zap, Search, CheckCircle2, Clock,
  Eye, Bell, ArrowUpDown, Bot,
} from 'lucide-react'
import { toast } from 'sonner'

// --- Types ---

interface SignalProvider {
  id: string
  name: string
  avatar: string
  verified: boolean // true = production-ready strategy
  rating: number
  subscribers: number // users running this strategy
  price: number // credits/month — 0 = free tier
  signals30d: number
  winRate: number
  avgReturn: number
  totalReturn: number
  sharpe: number
  maxDrawdown: number
  strategy: string
  markets: string[]
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive'
  source: 'platform' | 'community'
  description: string
  recentSignals: RecentSignal[]
  since: string
}

interface RecentSignal {
  symbol: string
  type: 'BUY' | 'SELL'
  price: number
  target: number
  stopLoss: number
  timestamp: number
  result?: 'win' | 'loss' | 'open'
  pnlPercent?: number
}

// --- Mock Data ---

const PROVIDERS: SignalProvider[] = [
  {
    id: 'sp-1', name: 'Aria Momentum Engine', avatar: 'AM', verified: true, source: 'platform', rating: 4.8,
    subscribers: 3240, price: 0, signals30d: 42, winRate: 73.2, avgReturn: 4.8,
    totalReturn: 342.8, sharpe: 2.84, maxDrawdown: -8.2,
    strategy: '7-factor momentum analysis with multi-timeframe confirmation',
    markets: ['US Equities', 'ETFs'], riskLevel: 'Moderate',
    description: 'Core Aria signal engine using RSI, MACD, Bollinger Bands, Moving Averages, Stochastic, Volume, and Trend/ADX analysis. Automatically scans your portfolio and watchlist for high-conviction setups.',
    since: '2023-03',
    recentSignals: [
      { symbol: 'NVDA', type: 'BUY', price: 875.50, target: 950, stopLoss: 840, timestamp: Date.now() - 86400000, result: 'win', pnlPercent: 8.5 },
      { symbol: 'META', type: 'BUY', price: 485.20, target: 520, stopLoss: 465, timestamp: Date.now() - 172800000, result: 'win', pnlPercent: 5.2 },
      { symbol: 'TSLA', type: 'SELL', price: 248.80, target: 220, stopLoss: 260, timestamp: Date.now() - 259200000, result: 'loss', pnlPercent: -3.1 },
      { symbol: 'AMZN', type: 'BUY', price: 178.40, target: 195, stopLoss: 170, timestamp: Date.now() - 345600000, result: 'open' },
      { symbol: 'AAPL', type: 'BUY', price: 192.30, target: 210, stopLoss: 185, timestamp: Date.now() - 432000000, result: 'win', pnlPercent: 4.1 },
    ],
  },
  {
    id: 'sp-2', name: 'Aria Stat-Arb Module', avatar: 'SA', verified: true, source: 'platform', rating: 4.6,
    subscribers: 2180, price: 0, signals30d: 28, winRate: 68.9, avgReturn: 6.2,
    totalReturn: 287.5, sharpe: 2.56, maxDrawdown: -6.4,
    strategy: 'Statistical arbitrage and mean reversion with correlation analysis',
    markets: ['US Equities', 'Options'], riskLevel: 'Conservative',
    description: 'Automated statistical models to identify mispriced securities using z-score mean reversion and pair trading. Uses the correlation matrix engine for position sizing.',
    since: '2022-08',
    recentSignals: [
      { symbol: 'MSFT', type: 'BUY', price: 408.50, target: 435, stopLoss: 395, timestamp: Date.now() - 86400000, result: 'open' },
      { symbol: 'GOOGL', type: 'BUY', price: 152.80, target: 168, stopLoss: 146, timestamp: Date.now() - 259200000, result: 'win', pnlPercent: 6.8 },
      { symbol: 'JPM', type: 'BUY', price: 195.40, target: 210, stopLoss: 188, timestamp: Date.now() - 432000000, result: 'win', pnlPercent: 3.9 },
    ],
  },
  {
    id: 'sp-3', name: 'Aria Swing Detector', avatar: 'SD', verified: true, source: 'platform', rating: 4.5,
    subscribers: 1540, price: 0, signals30d: 56, winRate: 65.2, avgReturn: 3.4,
    totalReturn: 198.4, sharpe: 2.12, maxDrawdown: -12.1,
    strategy: 'Multi-day swing trades with pattern recognition and volume analysis',
    markets: ['US Equities', 'Crypto'], riskLevel: 'Moderate',
    description: 'Autonomous swing trade detection with 2-5 day holding periods. Combines chart pattern recognition, volume spike analysis, and Bollinger Band breakout timing.',
    since: '2023-01',
    recentSignals: [
      { symbol: 'AMD', type: 'BUY', price: 162.30, target: 178, stopLoss: 155, timestamp: Date.now() - 43200000, result: 'open' },
      { symbol: 'NFLX', type: 'SELL', price: 628.40, target: 590, stopLoss: 645, timestamp: Date.now() - 172800000, result: 'win', pnlPercent: 4.2 },
      { symbol: 'PLTR', type: 'BUY', price: 22.80, target: 26, stopLoss: 21, timestamp: Date.now() - 345600000, result: 'win', pnlPercent: 9.6 },
    ],
  },
  {
    id: 'sp-4', name: 'Aria Crypto Scanner', avatar: 'CS', verified: true, source: 'platform', rating: 4.3,
    subscribers: 4120, price: 0, signals30d: 65, winRate: 58.7, avgReturn: 7.8,
    totalReturn: 512.3, sharpe: 1.87, maxDrawdown: -22.4,
    strategy: 'Crypto momentum with on-chain analysis and sentiment scoring',
    markets: ['Crypto'], riskLevel: 'Aggressive',
    description: 'Autonomous crypto signal engine combining technical analysis with social sentiment scoring and volume surge detection. Higher risk, higher reward — optimized for volatile assets.',
    since: '2022-11',
    recentSignals: [
      { symbol: 'BTC-USD', type: 'BUY', price: 62450, target: 68000, stopLoss: 59000, timestamp: Date.now() - 86400000, result: 'open' },
      { symbol: 'ETH-USD', type: 'BUY', price: 3280, target: 3600, stopLoss: 3100, timestamp: Date.now() - 172800000, result: 'win', pnlPercent: 6.1 },
      { symbol: 'SOL-USD', type: 'SELL', price: 148.50, target: 125, stopLoss: 158, timestamp: Date.now() - 259200000, result: 'loss', pnlPercent: -4.8 },
    ],
  },
  {
    id: 'sp-5', name: 'Aria Options Flow', avatar: 'AO', verified: true, source: 'platform', rating: 4.7,
    subscribers: 1890, price: 0, signals30d: 18, winRate: 74.1, avgReturn: 12.4,
    totalReturn: 156.2, sharpe: 3.21, maxDrawdown: -3.8,
    strategy: 'Unusual options activity and dark pool flow detection',
    markets: ['Options', 'US Equities'], riskLevel: 'Conservative',
    description: 'Platform AI module tracking unusual options flow, dark pool prints, and institutional positioning. Low frequency, high conviction setups generated autonomously.',
    since: '2023-06',
    recentSignals: [
      { symbol: 'SPY', type: 'BUY', price: 502.80, target: 520, stopLoss: 495, timestamp: Date.now() - 172800000, result: 'win', pnlPercent: 2.8 },
      { symbol: 'QQQ', type: 'BUY', price: 435.60, target: 455, stopLoss: 425, timestamp: Date.now() - 432000000, result: 'win', pnlPercent: 3.4 },
    ],
  },
  {
    id: 'sp-6', name: '@DividendKing42', avatar: 'DK', verified: false, source: 'community', rating: 4.4,
    subscribers: 1890, price: 0, signals30d: 8, winRate: 81.2, avgReturn: 2.1,
    totalReturn: 89.3, sharpe: 2.67, maxDrawdown: -4.2,
    strategy: 'Dividend growth stock picks with value overlay',
    markets: ['US Equities', 'ETFs'], riskLevel: 'Conservative',
    description: 'Community trader sharing dividend-focused picks. Focuses on undervalued dividend growers using fundamental analysis and technical entry timing. Free to follow.',
    since: '2022-05',
    recentSignals: [
      { symbol: 'O', type: 'BUY', price: 52.40, target: 58, stopLoss: 50, timestamp: Date.now() - 604800000, result: 'open' },
      { symbol: 'SCHD', type: 'BUY', price: 78.20, target: 84, stopLoss: 76, timestamp: Date.now() - 864000000, result: 'win', pnlPercent: 3.2 },
    ],
  },
  {
    id: 'sp-7', name: '@MacroTraderMike', avatar: 'MT', verified: true, source: 'community', rating: 4.2,
    subscribers: 2560, price: 59, signals30d: 12, winRate: 59.3, avgReturn: 8.6,
    totalReturn: 245.1, sharpe: 1.78, maxDrawdown: -15.6,
    strategy: 'Global macro trades across equities, bonds, commodities, and forex',
    markets: ['US Equities', 'ETFs', 'Commodities', 'Forex'], riskLevel: 'Aggressive',
    description: 'Veteran macro trader with 15+ years experience. Shares high-conviction cross-asset trades based on macro themes and geopolitical catalysts. Premium subscription.',
    since: '2022-01',
    recentSignals: [
      { symbol: 'GLD', type: 'BUY', price: 198.40, target: 215, stopLoss: 192, timestamp: Date.now() - 259200000, result: 'open' },
      { symbol: 'TLT', type: 'SELL', price: 92.80, target: 86, stopLoss: 96, timestamp: Date.now() - 518400000, result: 'win', pnlPercent: 5.4 },
    ],
  },
  {
    id: 'sp-8', name: '@SwingQueenSara', avatar: 'SQ', verified: false, source: 'community', rating: 4.1,
    subscribers: 780, price: 19, signals30d: 34, winRate: 67.8, avgReturn: 5.1,
    totalReturn: 178.9, sharpe: 2.34, maxDrawdown: -8.7,
    strategy: 'Tech sector momentum with earnings catalyst timing',
    markets: ['US Equities'], riskLevel: 'Moderate',
    description: 'Community trader specializing in tech sector swing trades. Combines momentum analysis with earnings surprise predictions and analyst revision tracking.',
    since: '2023-09',
    recentSignals: [
      { symbol: 'PLTR', type: 'BUY', price: 23.40, target: 28, stopLoss: 21.50, timestamp: Date.now() - 86400000, result: 'open' },
      { symbol: 'SNOW', type: 'SELL', price: 168.90, target: 148, stopLoss: 178, timestamp: Date.now() - 345600000, result: 'win', pnlPercent: 8.2 },
    ],
  },
]

// --- localStorage helpers ---

const SUBS_KEY = 'aria-signal-subscriptions'

function loadSubs(): Set<string> {
  try {
    const raw = localStorage.getItem(SUBS_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* ignore */ }
  return new Set()
}

function saveSubs(set: Set<string>) {
  localStorage.setItem(SUBS_KEY, JSON.stringify([...set]))
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// --- Components ---

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.round(rating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

function ProviderCard({
  provider,
  subscribed,
  onToggle,
  onSelect,
}: {
  provider: SignalProvider
  subscribed: boolean
  onToggle: () => void
  onSelect: () => void
}) {
  const riskColor = provider.riskLevel === 'Conservative' ? 'text-emerald-500' : provider.riskLevel === 'Moderate' ? 'text-amber-500' : 'text-red-500'

  return (
    <Card className="cursor-pointer transition-colors hover:bg-accent/20" onClick={onSelect}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold">
              {provider.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">{provider.name}</span>
                {provider.verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                {provider.source === 'platform' ? (
                  <Badge variant="outline" className="text-[10px] gap-0.5 px-1 py-0"><Bot className="h-2.5 w-2.5" /> AI</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-0.5 px-1 py-0"><Users className="h-2.5 w-2.5" /> Community</Badge>
                )}
              </div>
              <RatingStars rating={provider.rating} />
            </div>
          </div>
          <div className="text-right">
            {provider.price === 0 ? (
              <Badge className="bg-emerald-600 text-xs">FREE</Badge>
            ) : (
              <span className="text-sm font-bold">${provider.price}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{provider.strategy}</p>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-sm font-medium text-emerald-500">{provider.winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Return</p>
            <p className="text-sm font-medium text-emerald-500">+{provider.avgReturn}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Signals/mo</p>
            <p className="text-sm font-medium">{provider.signals30d}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Risk</p>
            <p className={`text-sm font-medium ${riskColor}`}>{provider.riskLevel}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {provider.subscribers.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {provider.signals30d} signals</span>
          </div>
          <Button
            size="sm"
            variant={subscribed ? 'outline' : 'default'}
            className="h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); onToggle() }}
          >
            {subscribed ? 'Unsubscribe' : 'Subscribe'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderDetail({ provider, subscribed, onToggle }: { provider: SignalProvider; subscribed: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  const riskColor = provider.riskLevel === 'Conservative' ? 'text-emerald-500' : provider.riskLevel === 'Moderate' ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold">
            {provider.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{provider.name}</span>
              {provider.verified && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
              {provider.source === 'platform' ? (
                <Badge variant="outline" className="text-[10px] gap-0.5"><Bot className="h-3 w-3" /> Platform AI</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] gap-0.5"><Users className="h-3 w-3" /> Community Trader</Badge>
              )}
              {provider.price === 0 ? (
                <Badge className="bg-emerald-600 text-xs">FREE</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">${provider.price}/mo</Badge>
              )}
            </div>
            <RatingStars rating={provider.rating} />
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span><Users className="inline h-3 w-3" /> {provider.subscribers.toLocaleString()} subscribers</span>
              <span><Clock className="inline h-3 w-3" /> Since {provider.since}</span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant={subscribed ? 'outline' : 'default'}
          className="gap-1 text-xs"
          onClick={onToggle}
        >
          {subscribed ? <Eye className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {subscribed ? 'Unsubscribe' : 'Subscribe'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{provider.description}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="py-2 px-3">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-lg font-bold text-emerald-500">{provider.winRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2 px-3">
            <p className="text-xs text-muted-foreground">Total Return</p>
            <p className="text-lg font-bold text-emerald-500">+{provider.totalReturn}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2 px-3">
            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
            <p className="text-lg font-bold">{provider.sharpe.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2 px-3">
            <p className="text-xs text-muted-foreground">Max Drawdown</p>
            <p className="text-lg font-bold text-red-500">{provider.maxDrawdown}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Badge variant="outline" className="text-xs">{provider.strategy}</Badge>
        <Badge variant="outline" className={`text-xs ${riskColor}`}>{provider.riskLevel} Risk</Badge>
        {provider.markets.map((m) => (
          <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
        ))}
      </div>

      {/* Recent Signals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Signals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {provider.recentSignals.map((sig, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/30 cursor-pointer"
                onClick={() => navigate(`/quote?symbol=${sig.symbol}`)}
              >
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs ${sig.type === 'BUY' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {sig.type}
                  </Badge>
                  <div>
                    <span className="text-sm font-medium">{sig.symbol}</span>
                    <p className="text-xs text-muted-foreground">
                      Entry ${sig.price.toLocaleString()} → Target ${sig.target.toLocaleString()} | SL ${sig.stopLoss.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  {sig.result === 'win' && (
                    <Badge className="bg-emerald-600 text-xs">+{sig.pnlPercent}%</Badge>
                  )}
                  {sig.result === 'loss' && (
                    <Badge className="bg-red-600 text-xs">{sig.pnlPercent}%</Badge>
                  )}
                  {sig.result === 'open' && (
                    <Badge variant="outline" className="text-xs">Open</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{timeAgo(sig.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Main Page ---

type SortField = 'rating' | 'subscribers' | 'winRate' | 'totalReturn' | 'price' | 'signals30d'
type FilterRisk = 'all' | 'Conservative' | 'Moderate' | 'Aggressive'
type FilterSource = 'all' | 'platform' | 'community'

export function SignalMarketplace() {
  const [subscriptions, setSubscriptions] = useState<Set<string>>(loadSubs)
  const [selectedProvider, setSelectedProvider] = useState<SignalProvider | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('rating')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterRisk, setFilterRisk] = useState<FilterRisk>('all')
  const [filterFreeOnly, setFilterFreeOnly] = useState(false)
  const [filterSource, setFilterSource] = useState<FilterSource>('all')

  const toggleSub = (id: string, name: string) => {
    const next = new Set(subscriptions)
    if (next.has(id)) {
      next.delete(id)
      toast(`Unsubscribed from ${name}`)
    } else {
      next.add(id)
      toast(`Subscribed to ${name}`, { description: 'You will receive their signals in your notifications' })
    }
    setSubscriptions(next)
    saveSubs(next)
  }

  const filtered = useMemo(() => {
    let result = PROVIDERS
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) || p.strategy.toLowerCase().includes(q) || p.markets.some((m) => m.toLowerCase().includes(q))
      )
    }
    if (filterRisk !== 'all') result = result.filter((p) => p.riskLevel === filterRisk)
    if (filterSource !== 'all') result = result.filter((p) => p.source === filterSource)
    if (filterFreeOnly) result = result.filter((p) => p.price === 0)

    return [...result].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      return ((a[sortField] ?? 0) as number - (b[sortField] ?? 0) as number) * dir
    })
  }, [search, sortField, sortAsc, filterRisk, filterSource, filterFreeOnly])

  const totalSubs = subscriptions.size
  const freeProviders = PROVIDERS.filter((p) => p.price === 0).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingCart className="h-5 w-5" />
          Signal Marketplace
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{PROVIDERS.length} providers</Badge>
          <Badge variant="outline" className="text-xs">{freeProviders} free</Badge>
          {totalSubs > 0 && <Badge className="bg-blue-600 text-xs">{totalSubs} subscribed</Badge>}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search providers..."
                className="h-8 w-48 pl-8 text-sm"
              />
            </div>
            <Select value={sortField} onValueChange={(v) => { if (v) { setSortField(v as SortField); setSortAsc(false) } }}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="subscribers">Subscribers</SelectItem>
                <SelectItem value="winRate">Win Rate</SelectItem>
                <SelectItem value="totalReturn">Total Return</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="signals30d">Activity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={(v) => { if (v) setFilterSource(v as FilterSource) }}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="platform">Platform AI</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRisk} onValueChange={(v) => { if (v) setFilterRisk(v as FilterRisk) }}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="Conservative">Conservative</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={filterFreeOnly ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFilterFreeOnly(!filterFreeOnly)}
            >
              Free Only
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setSortAsc(!sortAsc)}
            >
              <ArrowUpDown className="h-3 w-3" /> {sortAsc ? 'Asc' : 'Desc'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse" className="gap-1 text-xs"><ShoppingCart className="h-3 w-3" /> Browse</TabsTrigger>
          <TabsTrigger value="subscribed" className="gap-1 text-xs"><Bell className="h-3 w-3" /> My Subscriptions ({totalSubs})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {selectedProvider ? (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedProvider(null)}>
                ← Back to providers
              </Button>
              <ProviderDetail
                provider={selectedProvider}
                subscribed={subscriptions.has(selectedProvider.id)}
                onToggle={() => toggleSub(selectedProvider.id, selectedProvider.name)}
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  subscribed={subscriptions.has(p.id)}
                  onToggle={() => toggleSub(p.id, p.name)}
                  onSelect={() => setSelectedProvider(p)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
                  No providers match your filters
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribed">
          {totalSubs === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">You haven't subscribed to any signal providers yet</p>
                <p className="text-xs text-muted-foreground mt-1">Browse the marketplace to find providers that match your trading style</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {PROVIDERS.filter((p) => subscriptions.has(p.id)).map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  subscribed={true}
                  onToggle={() => toggleSub(p.id, p.name)}
                  onSelect={() => setSelectedProvider(p)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
