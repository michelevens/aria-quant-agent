import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BookOpen, Search, GraduationCap, TrendingUp, BarChart3,
  Shield, Brain, Zap, Clock, Star, Play,
  Target, Lightbulb, BookMarked, Award,
} from 'lucide-react'

type Category = 'All' | 'Beginner' | 'Intermediate' | 'Advanced'
type Topic = 'All' | 'Technical' | 'Fundamental' | 'Options' | 'Risk' | 'Quant' | 'Crypto'

interface Tutorial {
  id: string
  title: string
  description: string
  category: Category
  topic: Topic
  duration: string
  lessons: number
  icon: typeof BookOpen
  color: string
  popular?: boolean
}

interface GlossaryTerm {
  term: string
  definition: string
  category: string
}

const tutorials: Tutorial[] = [
  { id: '1', title: 'Introduction to Technical Analysis', description: 'Learn chart patterns, support/resistance, and trend identification fundamentals.', category: 'Beginner', topic: 'Technical', duration: '45 min', lessons: 8, icon: BarChart3, color: '#3b82f6', popular: true },
  { id: '2', title: 'RSI & MACD Mastery', description: 'Deep dive into momentum oscillators and how to combine them for better signals.', category: 'Intermediate', topic: 'Technical', duration: '1.5 hrs', lessons: 12, icon: TrendingUp, color: '#22c55e', popular: true },
  { id: '3', title: 'Bollinger Bands Strategies', description: 'Mean reversion and breakout strategies using Bollinger Bands with volume confirmation.', category: 'Intermediate', topic: 'Technical', duration: '1 hr', lessons: 9, icon: Target, color: '#8b5cf6' },
  { id: '4', title: 'Options Trading Fundamentals', description: 'Calls, puts, Greeks, and basic strategies for options beginners.', category: 'Beginner', topic: 'Options', duration: '2 hrs', lessons: 15, icon: Zap, color: '#f59e0b', popular: true },
  { id: '5', title: 'The Wheel Strategy', description: 'Cash-secured puts and covered calls for consistent income generation.', category: 'Intermediate', topic: 'Options', duration: '1.5 hrs', lessons: 10, icon: Shield, color: '#06b6d4' },
  { id: '6', title: 'Iron Condors & Spreads', description: 'Advanced multi-leg options strategies for defined risk trading.', category: 'Advanced', topic: 'Options', duration: '2 hrs', lessons: 14, icon: Brain, color: '#ec4899' },
  { id: '7', title: 'Portfolio Risk Management', description: 'Position sizing, diversification, correlation analysis, and hedging techniques.', category: 'Intermediate', topic: 'Risk', duration: '1.5 hrs', lessons: 11, icon: Shield, color: '#ef4444' },
  { id: '8', title: 'Understanding VaR & Drawdown', description: 'Value at Risk calculations, max drawdown analysis, and risk-adjusted returns.', category: 'Advanced', topic: 'Risk', duration: '1 hr', lessons: 8, icon: BarChart3, color: '#f97316' },
  { id: '9', title: 'Quantitative Factor Models', description: 'Multi-factor models, alpha generation, and systematic strategy development.', category: 'Advanced', topic: 'Quant', duration: '3 hrs', lessons: 20, icon: Brain, color: '#6366f1', popular: true },
  { id: '10', title: 'Backtesting Strategies', description: 'How to properly backtest, avoid overfitting, and validate trading strategies.', category: 'Intermediate', topic: 'Quant', duration: '2 hrs', lessons: 13, icon: Lightbulb, color: '#14b8a6' },
  { id: '11', title: 'Crypto Trading Essentials', description: 'DeFi, on-chain analysis, market cycles, and crypto-specific indicators.', category: 'Beginner', topic: 'Crypto', duration: '1.5 hrs', lessons: 12, icon: Zap, color: '#f7931a' },
  { id: '12', title: 'Reading Financial Statements', description: 'Income statements, balance sheets, cash flow analysis for stock valuation.', category: 'Beginner', topic: 'Fundamental', duration: '2 hrs', lessons: 14, icon: BookMarked, color: '#84cc16' },
  { id: '13', title: 'DCF Valuation Models', description: 'Discounted cash flow analysis, terminal value, and intrinsic value estimation.', category: 'Advanced', topic: 'Fundamental', duration: '2.5 hrs', lessons: 16, icon: Target, color: '#0ea5e9' },
  { id: '14', title: 'Sharpe, Sortino & Calmar Ratios', description: 'Understanding risk-adjusted performance metrics and how to use them.', category: 'Intermediate', topic: 'Quant', duration: '45 min', lessons: 6, icon: Award, color: '#d946ef' },
  { id: '15', title: 'Building Your First Trading Bot', description: 'From strategy concept to automated execution with proper risk controls.', category: 'Advanced', topic: 'Quant', duration: '4 hrs', lessons: 24, icon: Brain, color: '#d4a017', popular: true },
]

const glossary: GlossaryTerm[] = [
  { term: 'Alpha', definition: 'The excess return of an investment relative to a benchmark index.', category: 'Quant' },
  { term: 'ATR', definition: 'Average True Range — a volatility indicator measuring the average range of price movement.', category: 'Technical' },
  { term: 'Beta', definition: 'A measure of an asset\'s volatility relative to the overall market.', category: 'Risk' },
  { term: 'Bollinger Bands', definition: 'Volatility bands placed above and below a moving average, typically 2 standard deviations.', category: 'Technical' },
  { term: 'Calmar Ratio', definition: 'Risk-adjusted return metric: annualized return divided by maximum drawdown.', category: 'Quant' },
  { term: 'Delta', definition: 'The rate of change of option price relative to the underlying asset\'s price movement.', category: 'Options' },
  { term: 'Drawdown', definition: 'The peak-to-trough decline in portfolio value before a new high is reached.', category: 'Risk' },
  { term: 'EMA', definition: 'Exponential Moving Average — gives more weight to recent prices than SMA.', category: 'Technical' },
  { term: 'Gamma', definition: 'The rate of change of delta relative to the underlying price movement.', category: 'Options' },
  { term: 'Implied Volatility', definition: 'The market\'s forecast of likely price movement, derived from options pricing.', category: 'Options' },
  { term: 'MACD', definition: 'Moving Average Convergence Divergence — trend-following momentum indicator.', category: 'Technical' },
  { term: 'Max Drawdown', definition: 'The largest percentage drop from peak to trough in a portfolio\'s history.', category: 'Risk' },
  { term: 'OBV', definition: 'On-Balance Volume — cumulative volume indicator that adds volume on up days and subtracts on down days.', category: 'Technical' },
  { term: 'P/E Ratio', definition: 'Price-to-Earnings ratio — the stock price divided by earnings per share.', category: 'Fundamental' },
  { term: 'RSI', definition: 'Relative Strength Index — momentum oscillator measuring speed and change of price movements (0-100).', category: 'Technical' },
  { term: 'Sharpe Ratio', definition: 'Risk-adjusted return: (return - risk-free rate) / standard deviation of returns.', category: 'Quant' },
  { term: 'Sortino Ratio', definition: 'Like Sharpe, but only penalizes downside volatility, not overall volatility.', category: 'Quant' },
  { term: 'Stochastic', definition: 'Momentum indicator comparing closing price to price range over a period.', category: 'Technical' },
  { term: 'Theta', definition: 'The rate of time decay of an option\'s value as expiration approaches.', category: 'Options' },
  { term: 'VaR', definition: 'Value at Risk — statistical measure of the maximum expected loss over a given time period.', category: 'Risk' },
  { term: 'Vega', definition: 'The sensitivity of an option\'s price to changes in implied volatility.', category: 'Options' },
  { term: 'VWAP', definition: 'Volume-Weighted Average Price — average price weighted by volume throughout the trading day.', category: 'Technical' },
].sort((a, b) => a.term.localeCompare(b.term))

const categoryColors: Record<string, string> = {
  Beginner: '#4ade80',
  Intermediate: '#f59e0b',
  Advanced: '#ef4444',
}

const topicColors: Record<string, string> = {
  Technical: '#3b82f6',
  Fundamental: '#84cc16',
  Options: '#f59e0b',
  Risk: '#ef4444',
  Quant: '#8b5cf6',
  Crypto: '#f7931a',
}

export function LearnCenter() {
  const [tab, setTab] = useState<'tutorials' | 'glossary'>('tutorials')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('All')
  const [topic, setTopic] = useState<Topic>('All')
  const [glossarySearch, setGlossarySearch] = useState('')

  const filteredTutorials = tutorials.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== 'All' && t.category !== category) return false
    if (topic !== 'All' && t.topic !== topic) return false
    return true
  })

  const filteredGlossary = glossary.filter((g) => {
    if (!glossarySearch) return true
    const s = glossarySearch.toLowerCase()
    return g.term.toLowerCase().includes(s) || g.definition.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Learning Center</h2>
          <p className="text-sm text-muted-foreground">Master trading with guided tutorials and reference materials</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'tutorials' ? 'default' : 'outline'} size="sm" className="gap-1 text-xs" onClick={() => setTab('tutorials')}>
            <GraduationCap className="h-3.5 w-3.5" /> Tutorials
          </Button>
          <Button variant={tab === 'glossary' ? 'default' : 'outline'} size="sm" className="gap-1 text-xs" onClick={() => setTab('glossary')}>
            <BookOpen className="h-3.5 w-3.5" /> Glossary
          </Button>
        </div>
      </div>

      {tab === 'tutorials' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(212,160,23,0.12)' }}>
                  <GraduationCap className="h-5 w-5" style={{ color: '#d4a017' }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                  <p className="text-lg font-bold">{tutorials.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(74,222,128,0.12)' }}>
                  <BookOpen className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Lessons</p>
                  <p className="text-lg font-bold">{tutorials.reduce((s, t) => s + t.lessons, 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Topics</p>
                  <p className="text-lg font-bold">6</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(168,85,247,0.12)' }}>
                  <Star className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Popular</p>
                  <p className="text-lg font-bold">{tutorials.filter((t) => t.popular).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Level:</span>
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as Category[]).map((c) => (
                <Badge
                  key={c}
                  variant={category === c ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  style={c !== 'All' && category === c ? { backgroundColor: categoryColors[c] } : c !== 'All' ? { color: categoryColors[c], borderColor: categoryColors[c] } : undefined}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Badge>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">Topic:</span>
              {(['All', 'Technical', 'Fundamental', 'Options', 'Risk', 'Quant', 'Crypto'] as Topic[]).map((t) => (
                <Badge
                  key={t}
                  variant={topic === t ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  style={t !== 'All' && topic === t ? { backgroundColor: topicColors[t] } : t !== 'All' ? { color: topicColors[t], borderColor: topicColors[t] } : undefined}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tutorials..." className="h-8 w-52 pl-8 text-sm" />
            </div>
          </div>

          {/* Tutorial Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTutorials.map((t) => (
              <Card key={t.id} className="transition-colors hover:bg-accent/30">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${t.color}18`, border: `1px solid ${t.color}30` }}>
                      <t.icon className="h-5 w-5" style={{ color: t.color }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {t.popular && (
                        <Badge variant="outline" className="text-xs" style={{ color: '#fbbf24', borderColor: '#fbbf24' }}>
                          <Star className="mr-0.5 h-3 w-3" style={{ fill: '#fbbf24' }} /> Popular
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs" style={{ color: categoryColors[t.category], borderColor: categoryColors[t.category] }}>
                        {t.category}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="mb-1 font-semibold">{t.title}</h3>
                  <p className="mb-4 text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                  <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {t.lessons} lessons</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs" style={{ color: topicColors[t.topic], borderColor: topicColors[t.topic] }}>
                      {t.topic}
                    </Badge>
                    <Button size="sm" className="h-7 gap-1 text-xs">
                      <Play className="h-3 w-3" /> Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No tutorials match your filters. Try adjusting your search criteria.
            </div>
          )}
        </>
      ) : (
        /* ── Glossary Tab ── */
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              placeholder="Search glossary..."
              className="pl-8 text-sm"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Term</TableHead>
                    <TableHead className="text-xs">Definition</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGlossary.map((g) => (
                    <TableRow key={g.term}>
                      <TableCell className="text-sm font-semibold" style={{ whiteSpace: 'nowrap' }}>{g.term}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.definition}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs" style={{ color: topicColors[g.category] ?? '#6b7280', borderColor: topicColors[g.category] ?? '#6b7280' }}>
                          {g.category}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredGlossary.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No glossary terms match your search.
            </div>
          )}
        </>
      )}
    </div>
  )
}
