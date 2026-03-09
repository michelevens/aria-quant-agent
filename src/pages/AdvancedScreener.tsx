import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Filter,
  Sparkles,
  Crown,
  BarChart3,
  Zap,
  DollarSign,
  Target,
  Rocket,
  Flame,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star,
  Building2,
  X,
} from 'lucide-react'

/* ---------- seeded PRNG (deterministic) ---------- */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(42)
const rand = (min: number, max: number) => min + rng() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

/* ---------- sectors & tickers ---------- */
const SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
  'Communication Services', 'Industrials', 'Consumer Staples', 'Energy',
  'Materials', 'Real Estate', 'Utilities',
] as const

type Sector = (typeof SECTORS)[number]

const ANALYST_RATINGS = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'] as const
type AnalystRating = (typeof ANALYST_RATINGS)[number]

interface MockStock {
  symbol: string
  name: string
  sector: Sector
  price: number
  change1D: number
  change1W: number
  change1M: number
  change3M: number
  changeYTD: number
  change1Y: number
  volume: number
  avgVolume: number
  marketCap: number
  pe: number
  dividendYield: number
  revenueGrowth: number
  fiftyTwoWeekLow: number
  fiftyTwoWeekHigh: number
  rsi: number
  analystRating: AnalystRating
  insiderBuying: number   // 0-100 score
  institutionalAcc: number // 0-100 score
  hedgeFundHoldings: number
  analystUpgrades: number  // recent upgrades count
  fcfYield: number
  priceToBook: number
  earningsAcceleration: number // %
  payoutRatio: number
}

const STOCK_DEFS: { symbol: string; name: string; sector: Sector; mcapRange: [number, number]; peRange: [number, number] }[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', mcapRange: [2.8e12, 3.2e12], peRange: [28, 34] },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', mcapRange: [2.9e12, 3.1e12], peRange: [32, 38] },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', mcapRange: [2.5e12, 3.0e12], peRange: [55, 75] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services', mcapRange: [1.8e12, 2.2e12], peRange: [22, 28] },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', mcapRange: [1.8e12, 2.1e12], peRange: [55, 80] },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services', mcapRange: [1.2e12, 1.5e12], peRange: [22, 30] },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', mcapRange: [7e11, 9e11], peRange: [50, 80] },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', sector: 'Financials', mcapRange: [7.5e11, 8.5e11], peRange: [8, 12] },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', mcapRange: [6e11, 8e11], peRange: [28, 40] },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', mcapRange: [5e11, 6e11], peRange: [10, 14] },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare', mcapRange: [6e11, 7.5e11], peRange: [80, 120] },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', mcapRange: [5e11, 5.8e11], peRange: [28, 35] },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', mcapRange: [4.5e11, 5.5e11], peRange: [18, 24] },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials', mcapRange: [3.8e11, 4.5e11], peRange: [32, 40] },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', mcapRange: [4e11, 5e11], peRange: [10, 16] },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer Discretionary', mcapRange: [3.5e11, 4e11], peRange: [22, 28] },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Staples', mcapRange: [3.5e11, 3.8e11], peRange: [24, 30] },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', sector: 'Consumer Staples', mcapRange: [3e11, 3.5e11], peRange: [45, 55] },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', mcapRange: [3.5e11, 4e11], peRange: [14, 20] },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', mcapRange: [2.5e11, 3e11], peRange: [35, 50] },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', mcapRange: [2.5e11, 3e11], peRange: [40, 55] },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', mcapRange: [2e11, 2.8e11], peRange: [40, 65] },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', mcapRange: [1.5e11, 1.8e11], peRange: [10, 18] },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', mcapRange: [2.8e11, 3.2e11], peRange: [14, 20] },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples', mcapRange: [2.5e11, 2.8e11], peRange: [22, 28] },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare', mcapRange: [2.5e11, 3e11], peRange: [14, 20] },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples', mcapRange: [2.2e11, 2.5e11], peRange: [22, 28] },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financials', mcapRange: [2.8e11, 3.3e11], peRange: [10, 14] },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services', mcapRange: [1.2e11, 1.5e11], peRange: [8, 12] },
  { symbol: 'VZ', name: 'Verizon Communications', sector: 'Communication Services', mcapRange: [1.6e11, 1.9e11], peRange: [8, 12] },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', mcapRange: [1e11, 1.5e11], peRange: [15, 30] },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services', mcapRange: [1.8e11, 2.2e11], peRange: [28, 45] },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services', mcapRange: [1.5e11, 1.8e11], peRange: [10, 14] },
  { symbol: 'NKE', name: 'NIKE Inc.', sector: 'Consumer Discretionary', mcapRange: [1.2e11, 1.6e11], peRange: [25, 35] },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', sector: 'Technology', mcapRange: [1.2e11, 1.6e11], peRange: [60, 90] },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology', mcapRange: [1.5e11, 1.8e11], peRange: [65, 90] },
  { symbol: 'PANW', name: 'Palo Alto Networks', sector: 'Technology', mcapRange: [1e11, 1.3e11], peRange: [45, 65] },
  { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Financials', mcapRange: [1.3e11, 1.6e11], peRange: [12, 18] },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', mcapRange: [1.5e11, 1.8e11], peRange: [14, 20] },
  { symbol: 'RTX', name: 'RTX Corporation', sector: 'Industrials', mcapRange: [1.3e11, 1.5e11], peRange: [16, 22] },
  // Mid caps
  { symbol: 'CRWD', name: 'CrowdStrike Holdings', sector: 'Technology', mcapRange: [5e10, 8e10], peRange: [70, 120] },
  { symbol: 'DDOG', name: 'Datadog Inc.', sector: 'Technology', mcapRange: [3e10, 5e10], peRange: [80, 140] },
  { symbol: 'ZS', name: 'Zscaler Inc.', sector: 'Technology', mcapRange: [2.5e10, 4e10], peRange: [90, 160] },
  { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology', mcapRange: [4e10, 6e10], peRange: [0, 0] },
  { symbol: 'MELI', name: 'MercadoLibre Inc.', sector: 'Consumer Discretionary', mcapRange: [7e10, 9e10], peRange: [50, 80] },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', sector: 'Financials', mcapRange: [3e10, 6e10], peRange: [20, 40] },
  { symbol: 'SOFI', name: 'SoFi Technologies', sector: 'Financials', mcapRange: [8e9, 1.5e10], peRange: [60, 120] },
  { symbol: 'NET', name: 'Cloudflare Inc.', sector: 'Technology', mcapRange: [2.5e10, 3.5e10], peRange: [150, 300] },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Technology', mcapRange: [5e10, 8e10], peRange: [100, 200] },
  { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'Technology', mcapRange: [7e10, 1e11], peRange: [55, 85] },
  { symbol: 'SQ', name: 'Block Inc.', sector: 'Financials', mcapRange: [3e10, 5e10], peRange: [30, 60] },
  { symbol: 'ENPH', name: 'Enphase Energy Inc.', sector: 'Technology', mcapRange: [1e10, 2e10], peRange: [25, 50] },
  { symbol: 'RIVN', name: 'Rivian Automotive', sector: 'Consumer Discretionary', mcapRange: [1e10, 2e10], peRange: [0, 0] },
  { symbol: 'SMCI', name: 'Super Micro Computer', sector: 'Technology', mcapRange: [1.5e10, 3e10], peRange: [15, 30] },
  { symbol: 'ARM', name: 'Arm Holdings plc', sector: 'Technology', mcapRange: [1e11, 1.5e11], peRange: [80, 150] },
  // Small / micro caps
  { symbol: 'UPST', name: 'Upstart Holdings Inc.', sector: 'Financials', mcapRange: [3e9, 6e9], peRange: [0, 0] },
  { symbol: 'AFRM', name: 'Affirm Holdings Inc.', sector: 'Financials', mcapRange: [8e9, 1.5e10], peRange: [0, 0] },
  { symbol: 'IONQ', name: 'IonQ Inc.', sector: 'Technology', mcapRange: [2e9, 5e9], peRange: [0, 0] },
  { symbol: 'RKLB', name: 'Rocket Lab USA Inc.', sector: 'Industrials', mcapRange: [4e9, 8e9], peRange: [0, 0] },
  { symbol: 'HOOD', name: 'Robinhood Markets', sector: 'Financials', mcapRange: [1.5e10, 2.5e10], peRange: [25, 50] },
  { symbol: 'AI', name: 'C3.ai Inc.', sector: 'Technology', mcapRange: [2e9, 4e9], peRange: [0, 0] },
  { symbol: 'PATH', name: 'UiPath Inc.', sector: 'Technology', mcapRange: [6e9, 1e10], peRange: [0, 0] },
  { symbol: 'MDB', name: 'MongoDB Inc.', sector: 'Technology', mcapRange: [1.5e10, 2.5e10], peRange: [0, 0] },
  { symbol: 'CELH', name: 'Celsius Holdings Inc.', sector: 'Consumer Staples', mcapRange: [5e9, 1e10], peRange: [40, 80] },
  { symbol: 'ASTS', name: 'AST SpaceMobile', sector: 'Communication Services', mcapRange: [5e8, 2e9], peRange: [0, 0] },
  { symbol: 'LUNR', name: 'Intuitive Machines', sector: 'Industrials', mcapRange: [3e8, 1e9], peRange: [0, 0] },
  { symbol: 'JOBY', name: 'Joby Aviation Inc.', sector: 'Industrials', mcapRange: [4e9, 7e9], peRange: [0, 0] },
  { symbol: 'MARA', name: 'Marathon Digital Holdings', sector: 'Financials', mcapRange: [3e9, 7e9], peRange: [10, 30] },
  { symbol: 'RIOT', name: 'Riot Platforms Inc.', sector: 'Financials', mcapRange: [2e9, 5e9], peRange: [15, 40] },
  { symbol: 'FSLR', name: 'First Solar Inc.', sector: 'Technology', mcapRange: [1.5e10, 2.5e10], peRange: [12, 22] },
  { symbol: 'PLUG', name: 'Plug Power Inc.', sector: 'Industrials', mcapRange: [1e9, 3e9], peRange: [0, 0] },
  { symbol: 'CHPT', name: 'ChargePoint Holdings', sector: 'Industrials', mcapRange: [5e8, 1.5e9], peRange: [0, 0] },
  { symbol: 'GSAT', name: 'Globalstar Inc.', sector: 'Communication Services', mcapRange: [3e9, 5e9], peRange: [0, 0] },
]

/* ---------- generate mock data ---------- */
function generateMockStocks(): MockStock[] {
  return STOCK_DEFS.map((def) => {
    const marketCap = rand(def.mcapRange[0], def.mcapRange[1])
    const pe = def.peRange[1] === 0 ? (rng() > 0.3 ? 0 : rand(5, 200)) : rand(def.peRange[0], def.peRange[1])
    const price = rand(5, 900)
    const change1D = rand(-6, 6)
    const change1W = rand(-12, 12)
    const change1M = rand(-20, 25)
    const change3M = rand(-30, 40)
    const changeYTD = rand(-25, 55)
    const change1Y = rand(-40, 80)
    const avgVolume = rand(1e6, 5e7)
    const volumeMultiplier = rand(0.3, 6)
    const volume = avgVolume * volumeMultiplier
    const rsi = rand(15, 90)
    const dividendYield = rng() > 0.5 ? rand(0, 5.5) : 0
    const revenueGrowth = rand(-15, 60)
    const fiftyTwoWeekLow = price * rand(0.55, 0.88)
    const fiftyTwoWeekHigh = price * rand(1.05, 1.45)
    const analystRating = pick([...ANALYST_RATINGS])
    const insiderBuying = randInt(0, 100)
    const institutionalAcc = randInt(0, 100)
    const hedgeFundHoldings = randInt(0, 500)
    const analystUpgrades = randInt(0, 8)
    const fcfYield = rand(-5, 15)
    const priceToBook = rand(0.5, 25)
    const earningsAcceleration = rand(-30, 80)
    const payoutRatio = dividendYield > 0 ? rand(15, 90) : 0

    return {
      symbol: def.symbol,
      name: def.name,
      sector: def.sector,
      price,
      change1D,
      change1W,
      change1M,
      change3M,
      changeYTD,
      change1Y,
      volume,
      avgVolume,
      marketCap,
      pe,
      dividendYield,
      revenueGrowth,
      fiftyTwoWeekLow,
      fiftyTwoWeekHigh,
      rsi,
      analystRating,
      insiderBuying,
      institutionalAcc,
      hedgeFundHoldings,
      analystUpgrades,
      fcfYield,
      priceToBook,
      earningsAcceleration,
      payoutRatio,
    }
  })
}

const ALL_STOCKS = generateMockStocks()

/* ---------- filter types ---------- */
interface Filters {
  search: string
  marketCap: string
  peMin: string
  peMax: string
  divYieldMin: string
  divYieldMax: string
  revenueGrowthMin: string
  revenueGrowthMax: string
  priceChangePeriod: string
  priceChangeMin: string
  priceChangeMax: string
  volumeVsAvg: string
  fiftyTwoWeekPos: string
  sector: string
  rsiFilter: string
}

const defaultFilters: Filters = {
  search: '',
  marketCap: 'all',
  peMin: '',
  peMax: '',
  divYieldMin: '',
  divYieldMax: '',
  revenueGrowthMin: '',
  revenueGrowthMax: '',
  priceChangePeriod: '1D',
  priceChangeMin: '',
  priceChangeMax: '',
  volumeVsAvg: 'all',
  fiftyTwoWeekPos: 'all',
  sector: 'all',
  rsiFilter: 'all',
}

type SortKey = 'symbol' | 'price' | 'change1D' | 'volume' | 'marketCap' | 'pe' | 'dividendYield' | 'rsi'

type PresetKey = 'smart-money' | 'top-holdings' | 'analyst-upgrades' | 'technical-breakouts' | 'dividend-champions' | 'value-plays' | 'growth-monsters' | 'momentum-leaders'

interface PresetInfo {
  key: PresetKey
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const PRESETS: PresetInfo[] = [
  { key: 'smart-money', label: 'Smart Money', description: 'High insider buying + institutional accumulation', icon: <Building2 className="h-4 w-4" />, color: 'text-blue-400' },
  { key: 'top-holdings', label: 'Top Holdings', description: 'Most held by hedge funds & mutual funds', icon: <Crown className="h-4 w-4" />, color: 'text-yellow-400' },
  { key: 'analyst-upgrades', label: 'Analyst Upgrades', description: 'Recent analyst rating upgrades', icon: <Star className="h-4 w-4" />, color: 'text-amber-400' },
  { key: 'technical-breakouts', label: 'Technical Breakouts', description: 'Breaking above resistance with volume', icon: <Zap className="h-4 w-4" />, color: 'text-cyan-400' },
  { key: 'dividend-champions', label: 'Dividend Champions', description: 'High yield + consistent growth + low payout', icon: <DollarSign className="h-4 w-4" />, color: 'text-emerald-400' },
  { key: 'value-plays', label: 'Value Plays', description: 'Low P/E + high FCF yield + below book value', icon: <Target className="h-4 w-4" />, color: 'text-violet-400' },
  { key: 'growth-monsters', label: 'Growth Monsters', description: 'High revenue growth + earnings acceleration', icon: <Rocket className="h-4 w-4" />, color: 'text-pink-400' },
  { key: 'momentum-leaders', label: 'Momentum Leaders', description: 'Strong 3M + 6M returns with rising volume', icon: <Flame className="h-4 w-4" />, color: 'text-orange-400' },
]

/* ---------- helpers ---------- */
function formatMktCap(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${v.toLocaleString()}`
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return v.toFixed(0)
}

function applyPreset(stocks: MockStock[], preset: PresetKey): MockStock[] {
  switch (preset) {
    case 'smart-money':
      return stocks
        .filter((s) => s.insiderBuying > 60 && s.institutionalAcc > 60)
        .sort((a, b) => (b.insiderBuying + b.institutionalAcc) - (a.insiderBuying + a.institutionalAcc))
    case 'top-holdings':
      return [...stocks].sort((a, b) => b.hedgeFundHoldings - a.hedgeFundHoldings).slice(0, 25)
    case 'analyst-upgrades':
      return stocks
        .filter((s) => s.analystUpgrades >= 2)
        .sort((a, b) => b.analystUpgrades - a.analystUpgrades)
    case 'technical-breakouts': {
      return stocks.filter((s) => {
        const range = s.fiftyTwoWeekHigh - s.fiftyTwoWeekLow
        if (range <= 0) return false
        const pctInRange = (s.price - s.fiftyTwoWeekLow) / range
        return pctInRange > 0.85 && s.volume > s.avgVolume * 1.5
      }).sort((a, b) => (b.volume / b.avgVolume) - (a.volume / a.avgVolume))
    }
    case 'dividend-champions':
      return stocks
        .filter((s) => s.dividendYield > 2 && s.payoutRatio > 0 && s.payoutRatio < 65)
        .sort((a, b) => b.dividendYield - a.dividendYield)
    case 'value-plays':
      return stocks
        .filter((s) => s.pe > 0 && s.pe < 18 && s.fcfYield > 5 && s.priceToBook < 3)
        .sort((a, b) => a.pe - b.pe)
    case 'growth-monsters':
      return stocks
        .filter((s) => s.revenueGrowth > 25 && s.earningsAcceleration > 20)
        .sort((a, b) => b.revenueGrowth - a.revenueGrowth)
    case 'momentum-leaders':
      return stocks
        .filter((s) => s.change3M > 10 && s.change1Y > 20 && s.volume > s.avgVolume)
        .sort((a, b) => b.change3M - a.change3M)
  }
}

function applyCustomFilters(stocks: MockStock[], filters: Filters): MockStock[] {
  let result = [...stocks]

  // search
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  }

  // market cap
  if (filters.marketCap !== 'all') {
    switch (filters.marketCap) {
      case 'mega': result = result.filter((s) => s.marketCap >= 200e9); break
      case 'large': result = result.filter((s) => s.marketCap >= 10e9 && s.marketCap < 200e9); break
      case 'mid': result = result.filter((s) => s.marketCap >= 2e9 && s.marketCap < 10e9); break
      case 'small': result = result.filter((s) => s.marketCap >= 300e6 && s.marketCap < 2e9); break
      case 'micro': result = result.filter((s) => s.marketCap < 300e6); break
    }
  }

  // P/E
  const peMin = filters.peMin ? parseFloat(filters.peMin) : null
  const peMax = filters.peMax ? parseFloat(filters.peMax) : null
  if (peMin !== null) result = result.filter((s) => s.pe >= peMin)
  if (peMax !== null) result = result.filter((s) => s.pe > 0 && s.pe <= peMax)

  // Dividend yield
  const divMin = filters.divYieldMin ? parseFloat(filters.divYieldMin) : null
  const divMax = filters.divYieldMax ? parseFloat(filters.divYieldMax) : null
  if (divMin !== null) result = result.filter((s) => s.dividendYield >= divMin)
  if (divMax !== null) result = result.filter((s) => s.dividendYield <= divMax)

  // Revenue growth
  const revMin = filters.revenueGrowthMin ? parseFloat(filters.revenueGrowthMin) : null
  const revMax = filters.revenueGrowthMax ? parseFloat(filters.revenueGrowthMax) : null
  if (revMin !== null) result = result.filter((s) => s.revenueGrowth >= revMin)
  if (revMax !== null) result = result.filter((s) => s.revenueGrowth <= revMax)

  // Price change
  const pcMin = filters.priceChangeMin ? parseFloat(filters.priceChangeMin) : null
  const pcMax = filters.priceChangeMax ? parseFloat(filters.priceChangeMax) : null
  if (pcMin !== null || pcMax !== null) {
    const key = `change${filters.priceChangePeriod}` as keyof MockStock
    if (pcMin !== null) result = result.filter((s) => (s[key] as number) >= pcMin)
    if (pcMax !== null) result = result.filter((s) => (s[key] as number) <= pcMax)
  }

  // Volume vs average
  if (filters.volumeVsAvg !== 'all') {
    const mult = parseFloat(filters.volumeVsAvg)
    result = result.filter((s) => s.volume >= s.avgVolume * mult)
  }

  // 52-week position
  if (filters.fiftyTwoWeekPos !== 'all') {
    result = result.filter((s) => {
      const range = s.fiftyTwoWeekHigh - s.fiftyTwoWeekLow
      if (range <= 0) return false
      const pct = (s.price - s.fiftyTwoWeekLow) / range
      return filters.fiftyTwoWeekPos === 'near-high' ? pct >= 0.85 : pct <= 0.15
    })
  }

  // Sector
  if (filters.sector !== 'all') {
    result = result.filter((s) => s.sector === filters.sector)
  }

  // RSI
  if (filters.rsiFilter !== 'all') {
    if (filters.rsiFilter === 'oversold') result = result.filter((s) => s.rsi < 30)
    else if (filters.rsiFilter === 'overbought') result = result.filter((s) => s.rsi > 70)
  }

  return result
}

/* ---------- component ---------- */
export function AdvancedScreener() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'presets' | 'custom'>('presets')
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null)
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortAsc, setSortAsc] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(true)

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const results = useMemo(() => {
    let data: MockStock[]
    if (mode === 'presets' && activePreset) {
      data = applyPreset(ALL_STOCKS, activePreset)
    } else if (mode === 'custom') {
      data = applyCustomFilters(ALL_STOCKS, filters)
    } else {
      data = [...ALL_STOCKS]
    }

    // apply sort
    return data.sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol) * dir
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir
    })
  }, [mode, activePreset, filters, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.marketCap !== 'all') count++
    if (filters.peMin || filters.peMax) count++
    if (filters.divYieldMin || filters.divYieldMax) count++
    if (filters.revenueGrowthMin || filters.revenueGrowthMax) count++
    if (filters.priceChangeMin || filters.priceChangeMax) count++
    if (filters.volumeVsAvg !== 'all') count++
    if (filters.fiftyTwoWeekPos !== 'all') count++
    if (filters.sector !== 'all') count++
    if (filters.rsiFilter !== 'all') count++
    return count
  }, [filters])

  const SortHeader = ({ label, field, align }: { label: string; field: SortKey; align?: string }) => (
    <button
      className={`flex items-center gap-1 text-xs font-medium ${align === 'right' ? 'ml-auto' : ''}`}
      onClick={() => handleSort(field)}
    >
      {label}
      {sortKey === field && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      {sortKey !== field && <ArrowUpDown className="h-3 w-3 opacity-30" />}
    </button>
  )

  const ratingColor = (r: AnalystRating) => {
    switch (r) {
      case 'Strong Buy': return 'bg-emerald-600'
      case 'Buy': return 'bg-emerald-500/80'
      case 'Hold': return 'bg-yellow-600'
      case 'Sell': return 'bg-red-500/80'
      case 'Strong Sell': return 'bg-red-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Advanced Screener</h2>
          <Badge variant="outline" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3 text-yellow-400" />
            Gold
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{results.length} results</Badge>
          <Badge className="bg-emerald-600 text-xs">{results.filter((s) => s.change1D > 0).length} up</Badge>
          <Badge className="bg-red-600 text-xs">{results.filter((s) => s.change1D < 0).length} down</Badge>
        </div>
      </div>

      {/* mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'presets' | 'custom')}>
        <TabsList>
          <TabsTrigger value="presets" className="gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Preset Screeners
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Custom Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px]">{activeFilterCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* presets tab */}
        <TabsContent value="presets">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRESETS.map((p) => (
              <Card
                key={p.key}
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 ${activePreset === p.key ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActivePreset(activePreset === p.key ? null : p.key)}
              >
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className={p.color}>{p.icon}</span>
                    {p.label}
                    {activePreset === p.key && (
                      <Badge className="ml-auto text-[10px]">Active</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* custom filters tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <button
                  className="flex items-center gap-2"
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                >
                  <Filter className="h-4 w-4" />
                  Filter Builder
                  {filtersExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Badge variant="outline" className="text-xs">{activeFilterCount} active</Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={resetFilters}>
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            {filtersExpanded && (
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* search */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Symbol or name..."
                        className="h-8 pl-8 text-sm"
                      />
                      {filters.search && (
                        <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => updateFilter('search', '')}>
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* market cap */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Market Cap</label>
                    <Select value={filters.marketCap} onValueChange={(v) => { if (v) updateFilter('marketCap', v) }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Caps</SelectItem>
                        <SelectItem value="mega">Mega (&gt;$200B)</SelectItem>
                        <SelectItem value="large">Large ($10B-$200B)</SelectItem>
                        <SelectItem value="mid">Mid ($2B-$10B)</SelectItem>
                        <SelectItem value="small">Small ($300M-$2B)</SelectItem>
                        <SelectItem value="micro">Micro (&lt;$300M)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* P/E ratio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">P/E Ratio</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={filters.peMin}
                        onChange={(e) => updateFilter('peMin', e.target.value)}
                        placeholder="Min"
                        type="number"
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        value={filters.peMax}
                        onChange={(e) => updateFilter('peMax', e.target.value)}
                        placeholder="Max"
                        type="number"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* dividend yield */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Dividend Yield %</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={filters.divYieldMin}
                        onChange={(e) => updateFilter('divYieldMin', e.target.value)}
                        placeholder="Min"
                        type="number"
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        value={filters.divYieldMax}
                        onChange={(e) => updateFilter('divYieldMax', e.target.value)}
                        placeholder="Max"
                        type="number"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* revenue growth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Revenue Growth %</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={filters.revenueGrowthMin}
                        onChange={(e) => updateFilter('revenueGrowthMin', e.target.value)}
                        placeholder="Min"
                        type="number"
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        value={filters.revenueGrowthMax}
                        onChange={(e) => updateFilter('revenueGrowthMax', e.target.value)}
                        placeholder="Max"
                        type="number"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* price change */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Price Change %</label>
                    <div className="flex items-center gap-1.5">
                      <Select value={filters.priceChangePeriod} onValueChange={(v) => { if (v) updateFilter('priceChangePeriod', v) }}>
                        <SelectTrigger className="h-8 w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1D">1D</SelectItem>
                          <SelectItem value="1W">1W</SelectItem>
                          <SelectItem value="1M">1M</SelectItem>
                          <SelectItem value="3M">3M</SelectItem>
                          <SelectItem value="YTD">YTD</SelectItem>
                          <SelectItem value="1Y">1Y</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={filters.priceChangeMin}
                        onChange={(e) => updateFilter('priceChangeMin', e.target.value)}
                        placeholder="Min"
                        type="number"
                        className="h-8 text-xs"
                      />
                      <Input
                        value={filters.priceChangeMax}
                        onChange={(e) => updateFilter('priceChangeMax', e.target.value)}
                        placeholder="Max"
                        type="number"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* volume vs average */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Volume vs Average</label>
                    <Select value={filters.volumeVsAvg} onValueChange={(v) => { if (v) updateFilter('volumeVsAvg', v) }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Volume</SelectItem>
                        <SelectItem value="2">Above 2x avg</SelectItem>
                        <SelectItem value="3">Above 3x avg</SelectItem>
                        <SelectItem value="5">Above 5x avg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 52-week position */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">52-Week Position</label>
                    <Select value={filters.fiftyTwoWeekPos} onValueChange={(v) => { if (v) updateFilter('fiftyTwoWeekPos', v) }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Position</SelectItem>
                        <SelectItem value="near-high">Near 52W High (top 15%)</SelectItem>
                        <SelectItem value="near-low">Near 52W Low (bottom 15%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* sector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Sector</label>
                    <Select value={filters.sector} onValueChange={(v) => { if (v) updateFilter('sector', v) }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sectors</SelectItem>
                        {SECTORS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* RSI */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">RSI</label>
                    <Select value={filters.rsiFilter} onValueChange={(v) => { if (v) updateFilter('rsiFilter', v) }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any RSI</SelectItem>
                        <SelectItem value="oversold">Oversold (&lt;30)</SelectItem>
                        <SelectItem value="overbought">Overbought (&gt;70)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* results table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24"><SortHeader label="Symbol" field="symbol" /></TableHead>
                  <TableHead className="min-w-[140px] text-xs">Name</TableHead>
                  <TableHead className="text-right"><SortHeader label="Price" field="price" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="Chg %" field="change1D" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="Volume" field="volume" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="Mkt Cap" field="marketCap" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="P/E" field="pe" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="Div %" field="dividendYield" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="RSI" field="rsi" align="right" /></TableHead>
                  <TableHead className="text-xs">Rating</TableHead>
                  <TableHead className="min-w-[130px] text-xs">52W Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((s) => {
                  const range52 = s.fiftyTwoWeekHigh - s.fiftyTwoWeekLow
                  const pctInRange = range52 > 0 ? ((s.price - s.fiftyTwoWeekLow) / range52) * 100 : 50

                  return (
                    <TableRow
                      key={s.symbol}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => navigate(`/quote?symbol=${s.symbol}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{s.symbol}</span>
                          {s.change1D >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        ${s.price.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${s.change1D >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        {s.change1D >= 0 ? '+' : ''}{s.change1D.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatVolume(s.volume)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatMktCap(s.marketCap)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {s.pe > 0 ? s.pe.toFixed(1) : '\u2014'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {s.dividendYield > 0 ? `${s.dividendYield.toFixed(2)}%` : '\u2014'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-medium ${
                            s.rsi < 30
                              ? 'text-emerald-500'
                              : s.rsi > 70
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {s.rsi.toFixed(0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${ratingColor(s.analystRating)}`}>
                          {s.analystRating}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">${s.fiftyTwoWeekLow.toFixed(0)}</span>
                          <div className="relative h-1.5 w-16 rounded-full bg-accent">
                            <div
                              className="absolute top-0 h-1.5 rounded-full bg-primary"
                              style={{ width: `${Math.min(100, Math.max(0, pctInRange))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">${s.fiftyTwoWeekHigh.toFixed(0)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-sm text-muted-foreground">
                      No stocks match the current filters. Try adjusting your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
