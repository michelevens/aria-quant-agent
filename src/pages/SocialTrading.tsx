import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Trophy, TrendingUp, Users, Copy, Star, Search,
  BarChart3, Shield, ArrowUpDown, Eye, UserPlus, Crown, Medal, Award,
} from 'lucide-react'
import { toast } from 'sonner'

const SOCIAL_FOLLOW_KEY = 'aria-social-following'
const SOCIAL_COPY_KEY = 'aria-social-copying'

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* ignore */ }
  return new Set()
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]))
}

interface Trader {
  id: string
  name: string
  avatar: string
  rank: number
  followers: number
  winRate: number
  totalReturn: number
  monthReturn: number
  sharpe: number
  maxDrawdown: number
  trades: number
  riskScore: 'Low' | 'Medium' | 'High'
  strategy: string
  copiers: number
  verified: boolean
  topHoldings: string[]
}

const MOCK_TRADERS: Trader[] = [
  { id: '1', name: 'AlphaHunter', avatar: 'AH', rank: 1, followers: 12450, winRate: 72.3, totalReturn: 342.8, monthReturn: 18.4, sharpe: 2.84, maxDrawdown: -8.2, trades: 1847, riskScore: 'Medium', strategy: 'Momentum + Mean Reversion', copiers: 3240, verified: true, topHoldings: ['NVDA', 'TSLA', 'AAPL'] },
  { id: '2', name: 'QuantMaster', avatar: 'QM', rank: 2, followers: 9870, winRate: 68.9, totalReturn: 287.5, monthReturn: 12.1, sharpe: 2.56, maxDrawdown: -6.4, trades: 3421, riskScore: 'Low', strategy: 'Statistical Arbitrage', copiers: 2180, verified: true, topHoldings: ['MSFT', 'GOOGL', 'META'] },
  { id: '3', name: 'SwingKing', avatar: 'SK', rank: 3, followers: 7650, winRate: 65.2, totalReturn: 198.4, monthReturn: 15.7, sharpe: 2.12, maxDrawdown: -12.1, trades: 892, riskScore: 'Medium', strategy: 'Swing Trading', copiers: 1540, verified: true, topHoldings: ['AMD', 'AMZN', 'NFLX'] },
  { id: '4', name: 'DeltaNeutral', avatar: 'DN', rank: 4, followers: 5430, winRate: 74.1, totalReturn: 156.2, monthReturn: 8.3, sharpe: 3.21, maxDrawdown: -3.8, trades: 5672, riskScore: 'Low', strategy: 'Options Spreads', copiers: 890, verified: true, topHoldings: ['SPY', 'QQQ', 'IWM'] },
  { id: '5', name: 'CryptoWhale', avatar: 'CW', rank: 5, followers: 15200, winRate: 58.7, totalReturn: 512.3, monthReturn: 24.6, sharpe: 1.87, maxDrawdown: -22.4, trades: 2341, riskScore: 'High', strategy: 'Crypto Momentum', copiers: 4120, verified: true, topHoldings: ['BTC-USD', 'ETH-USD', 'SOL-USD'] },
  { id: '6', name: 'ValueSeeker', avatar: 'VS', rank: 6, followers: 4210, winRate: 62.8, totalReturn: 134.7, monthReturn: 5.2, sharpe: 2.45, maxDrawdown: -7.6, trades: 342, riskScore: 'Low', strategy: 'Value Investing', copiers: 670, verified: false, topHoldings: ['BRK.B', 'JNJ', 'PG'] },
  { id: '7', name: 'ScalpPro', avatar: 'SP', rank: 7, followers: 3890, winRate: 71.4, totalReturn: 98.6, monthReturn: 11.8, sharpe: 1.95, maxDrawdown: -9.3, trades: 12540, riskScore: 'High', strategy: 'Scalping', copiers: 520, verified: false, topHoldings: ['SPY', 'AAPL', 'TSLA'] },
  { id: '8', name: 'DividendKing', avatar: 'DK', rank: 8, followers: 6780, winRate: 81.2, totalReturn: 89.3, monthReturn: 3.1, sharpe: 2.67, maxDrawdown: -4.2, trades: 156, riskScore: 'Low', strategy: 'Dividend Growth', copiers: 1890, verified: true, topHoldings: ['O', 'SCHD', 'VYM'] },
  { id: '9', name: 'ThetaGang', avatar: 'TG', rank: 9, followers: 2340, winRate: 76.5, totalReturn: 112.4, monthReturn: 6.7, sharpe: 2.89, maxDrawdown: -5.1, trades: 4230, riskScore: 'Medium', strategy: 'Options Selling', copiers: 430, verified: false, topHoldings: ['AAPL', 'MSFT', 'AMZN'] },
  { id: '10', name: 'MacroTrader', avatar: 'MT', rank: 10, followers: 8920, winRate: 59.3, totalReturn: 245.1, monthReturn: 14.2, sharpe: 1.78, maxDrawdown: -15.6, trades: 678, riskScore: 'High', strategy: 'Global Macro', copiers: 2560, verified: true, topHoldings: ['GLD', 'TLT', 'UUP'] },
  { id: '11', name: 'AITrader', avatar: 'AI', rank: 11, followers: 4560, winRate: 67.8, totalReturn: 178.9, monthReturn: 9.4, sharpe: 2.34, maxDrawdown: -8.7, trades: 2890, riskScore: 'Medium', strategy: 'ML-Based Signals', copiers: 780, verified: true, topHoldings: ['NVDA', 'PLTR', 'SNOW'] },
  { id: '12', name: 'BondBull', avatar: 'BB', rank: 12, followers: 1890, winRate: 83.4, totalReturn: 67.2, monthReturn: 2.8, sharpe: 3.45, maxDrawdown: -2.1, trades: 234, riskScore: 'Low', strategy: 'Fixed Income', copiers: 340, verified: false, topHoldings: ['TLT', 'BND', 'AGG'] },
]

type SortKey = 'rank' | 'totalReturn' | 'monthReturn' | 'winRate' | 'sharpe' | 'followers' | 'copiers'
type TimeFilter = '1M' | '3M' | '6M' | '1Y' | 'ALL'
type RiskFilter = 'All' | 'Low' | 'Medium' | 'High'

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-4 w-4" style={{ color: '#fbbf24' }} />
  if (rank === 2) return <Medal className="h-4 w-4" style={{ color: '#94a3b8' }} />
  if (rank === 3) return <Award className="h-4 w-4" style={{ color: '#cd7f32' }} />
  return <span className="text-sm text-muted-foreground">#{rank}</span>
}

const riskColor = (risk: string) => {
  if (risk === 'Low') return '#4ade80'
  if (risk === 'Medium') return '#fbbf24'
  return '#f87171'
}

export function SocialTrading() {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortAsc, setSortAsc] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All')
  const [following, setFollowing] = useState<Set<string>>(() => loadSet(SOCIAL_FOLLOW_KEY))
  const [copying, setCopying] = useState<Set<string>>(() => loadSet(SOCIAL_COPY_KEY))

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(key === 'rank') }
  }

  const toggleFollow = (id: string) => {
    const trader = MOCK_TRADERS.find(t => t.id === id)
    setFollowing((prev) => {
      const next = new Set(prev)
      const wasFollowing = next.has(id)
      if (wasFollowing) next.delete(id)
      else next.add(id)
      saveSet(SOCIAL_FOLLOW_KEY, next)
      toast.success(wasFollowing ? `Unfollowed ${trader?.name}` : `Now following ${trader?.name}`)
      return next
    })
  }

  const toggleCopy = (id: string) => {
    const trader = MOCK_TRADERS.find(t => t.id === id)
    setCopying((prev) => {
      const next = new Set(prev)
      const wasCopying = next.has(id)
      if (wasCopying) next.delete(id)
      else next.add(id)
      saveSet(SOCIAL_COPY_KEY, next)
      toast.success(wasCopying ? `Stopped copying ${trader?.name}` : `Now copying ${trader?.name}'s trades`)
      return next
    })
  }

  const filtered = MOCK_TRADERS
    .filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.strategy.toLowerCase().includes(search.toLowerCase())) return false
      if (riskFilter !== 'All' && t.riskScore !== riskFilter) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir
    })

  const totalCopiers = MOCK_TRADERS.reduce((s, t) => s + t.copiers, 0)
  const avgWinRate = MOCK_TRADERS.reduce((s, t) => s + t.winRate, 0) / MOCK_TRADERS.length
  const topReturn = Math.max(...MOCK_TRADERS.map((t) => t.totalReturn))

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button className="flex items-center gap-1 text-xs" onClick={() => handleSort(field)}>
      {label}
      {sortKey === field && <ArrowUpDown className="h-3 w-3" />}
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Social Trading</h2>
          <p className="text-sm text-muted-foreground">Follow top traders and copy their strategies</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search traders..."
              className="h-8 w-48 pl-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(212,160,23,0.12)' }}>
              <Trophy className="h-5 w-5" style={{ color: '#d4a017' }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top Traders</p>
              <p className="text-lg font-bold">{MOCK_TRADERS.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(74,222,128,0.12)' }}>
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Copiers</p>
              <p className="text-lg font-bold">{totalCopiers.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Win Rate</p>
              <p className="text-lg font-bold">{avgWinRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(168,85,247,0.12)' }}>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Best Return</p>
              <p className="text-lg font-bold text-emerald-500">+{topReturn.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Period:</span>
        {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeFilter[]).map((t) => (
          <Badge
            key={t}
            variant={timeFilter === t ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setTimeFilter(t)}
          >
            {t}
          </Badge>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">Risk:</span>
        {(['All', 'Low', 'Medium', 'High'] as RiskFilter[]).map((r) => (
          <Badge
            key={r}
            variant={riskFilter === r ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setRiskFilter(r)}
          >
            {r}
          </Badge>
        ))}
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><SortHeader label="Rank" field="rank" /></TableHead>
                <TableHead className="text-xs">Trader</TableHead>
                <TableHead className="hidden text-xs sm:table-cell">Strategy</TableHead>
                <TableHead className="text-right"><SortHeader label="Return" field="totalReturn" /></TableHead>
                <TableHead className="hidden text-right sm:table-cell"><SortHeader label="Month" field="monthReturn" /></TableHead>
                <TableHead className="hidden text-right md:table-cell"><SortHeader label="Win%" field="winRate" /></TableHead>
                <TableHead className="hidden text-right md:table-cell"><SortHeader label="Sharpe" field="sharpe" /></TableHead>
                <TableHead className="hidden text-right lg:table-cell"><SortHeader label="Followers" field="followers" /></TableHead>
                <TableHead className="hidden text-right lg:table-cell"><SortHeader label="Copiers" field="copiers" /></TableHead>
                <TableHead className="hidden text-xs md:table-cell">Risk</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-accent/50">
                  <TableCell className="text-center">{rankIcon(t.rank)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #d4a017, #b8860b)' }}
                      >
                        {t.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{t.name}</span>
                          {t.verified && <Shield className="h-3 w-3 text-blue-500" />}
                        </div>
                        <div className="flex gap-1">
                          {t.topHoldings.slice(0, 2).map((h) => (
                            <span key={h} className="text-xs text-muted-foreground">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-32 truncate text-xs text-muted-foreground sm:table-cell">
                    {t.strategy}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-bold ${t.totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      +{t.totalReturn.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <span className={`text-sm ${t.monthReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.monthReturn >= 0 ? '+' : ''}{t.monthReturn.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right text-sm md:table-cell">{t.winRate.toFixed(1)}%</TableCell>
                  <TableCell className="hidden text-right text-sm md:table-cell">{t.sharpe.toFixed(2)}</TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground lg:table-cell">
                    {t.followers >= 1000 ? `${(t.followers / 1000).toFixed(1)}K` : t.followers}
                  </TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground lg:table-cell">
                    {t.copiers >= 1000 ? `${(t.copiers / 1000).toFixed(1)}K` : t.copiers}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs" style={{ color: riskColor(t.riskScore), borderColor: riskColor(t.riskScore) }}>
                      {t.riskScore}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleFollow(t.id)}
                        title={following.has(t.id) ? 'Unfollow' : 'Follow'}
                      >
                        {following.has(t.id)
                          ? <Star className="h-3.5 w-3.5" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                          : <UserPlus className="h-3.5 w-3.5" />
                        }
                      </Button>
                      <Button
                        variant={copying.has(t.id) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => toggleCopy(t.id)}
                      >
                        <Copy className="h-3 w-3" />
                        {copying.has(t.id) ? 'Copying' : 'Copy'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View profile">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top 3 Spotlight */}
      <div className="grid gap-4 sm:grid-cols-3">
        {MOCK_TRADERS.slice(0, 3).map((t, i) => (
          <Card key={t.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                {rankIcon(i + 1)}
                <Badge variant="outline" className="text-xs" style={{ color: riskColor(t.riskScore), borderColor: riskColor(t.riskScore) }}>
                  {t.riskScore} Risk
                </Badge>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #d4a017, #b8860b)' }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{t.name}</span>
                    {t.verified && <Shield className="h-3.5 w-3.5 text-blue-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.strategy}</p>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Return</p>
                  <p className="text-lg font-bold text-emerald-500">+{t.totalReturn.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="font-semibold text-emerald-500">+{t.monthReturn.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="font-semibold">{t.winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sharpe</p>
                  <p className="font-semibold">{t.sharpe.toFixed(2)}</p>
                </div>
              </div>
              <div className="mb-4 flex gap-1">
                {t.topHoldings.map((h) => (
                  <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => toggleFollow(t.id)}
                >
                  {following.has(t.id) ? <Star className="h-3 w-3" style={{ color: '#fbbf24', fill: '#fbbf24' }} /> : <UserPlus className="h-3 w-3" />}
                  {following.has(t.id) ? 'Following' : 'Follow'}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => toggleCopy(t.id)}
                >
                  <Copy className="h-3 w-3" />
                  {copying.has(t.id) ? 'Copying' : 'Copy Trade'}
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t.followers.toLocaleString()} followers</span>
                <span>{t.copiers.toLocaleString()} copiers</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground" style={{ opacity: 0.6 }}>
        Past performance does not guarantee future results. Copy trading involves risk. Paper trading only — no real money is at risk.
      </p>
    </div>
  )
}
