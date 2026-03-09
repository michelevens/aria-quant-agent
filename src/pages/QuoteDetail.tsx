import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { PriceChart } from '@/components/trading/PriceChart'
import { TechnicalPanel } from '@/components/trading/TechnicalPanel'
import { Sparkline } from '@/components/trading/Sparkline'
import { fetchQuote, fetchNews, fetchHistoricalData } from '@/services/marketData'
import type { Quote, NewsItem, OHLCV } from '@/types/market'
import {
  TrendingUp, TrendingDown, Loader2, ArrowLeft, ExternalLink, Newspaper,
  BarChart3, Activity, DollarSign, Minus, Star, StarOff,
  FileText, Target, Scale, Banknote, CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react'

/* ────────────────────────── Utility Helpers ────────────────────────── */

function formatLargeNumber(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  if (v > 0) return `$${v.toLocaleString()}`
  return '—'
}

function fmtB(v: number): string {
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return v.toLocaleString()
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Simple seeded PRNG (mulberry32) */
function seededRng(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function hashSymbol(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/* ────────────────────── Deterministic Data Generators ────────────────────── */

interface IncomeStatementRow {
  period: string
  revenue: number
  costOfRevenue: number
  grossProfit: number
  operatingExpenses: number
  operatingIncome: number
  netIncome: number
  eps: number
  sharesOutstanding: number
}

interface BalanceSheetRow {
  period: string
  totalAssets: number
  currentAssets: number
  cash: number
  totalLiabilities: number
  currentLiabilities: number
  longTermDebt: number
  shareholdersEquity: number
  bookValuePerShare: number
}

interface CashFlowRow {
  period: string
  operatingCashFlow: number
  capitalExpenditures: number
  freeCashFlow: number
  dividendsPaid: number
  shareBuybacks: number
}

interface AnalystRatings {
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
  consensus: string
  priceTargetLow: number
  priceTargetAvg: number
  priceTargetHigh: number
}

interface ValuationData {
  dcfFairValue: number
  peRatio: number
  sectorPeAvg: number
  pbRatio: number
  pegRatio: number
  evEbitda: number
  dividendYield: number
  payoutRatio: number
  verdict: 'Undervalued' | 'Fairly Valued' | 'Overvalued'
}

interface DividendData {
  annualDividend: number
  dividendYield: number
  payoutRatio: number
  exDividendDate: string
  fiveYearGrowthRate: number
  dividendScore: number
  paysDividend: boolean
}

function generateFinancialData(symbol: string, price: number, marketCap: number, eps: number) {
  const rng = seededRng(hashSymbol(symbol))
  const r = () => rng()

  // Scale factor based on market cap
  const scale = Math.max(marketCap, 1e9)
  const revenueBase = scale * (0.15 + r() * 0.35) // revenue as 15-50% of market cap
  const marginBase = 0.08 + r() * 0.25 // net margin 8-33%
  const sharesOut = marketCap > 0 && price > 0 ? marketCap / price : 1e9

  // Income Statement - 4 years annual
  const incomeAnnual: IncomeStatementRow[] = []
  for (let i = 3; i >= 0; i--) {
    const yearGrowth = 1 + (r() * 0.15 - 0.03) * (4 - i) // slight growth over time
    const revenue = revenueBase * yearGrowth * (0.85 + r() * 0.3)
    const costRatio = 0.4 + r() * 0.25
    const costOfRevenue = revenue * costRatio
    const grossProfit = revenue - costOfRevenue
    const opexRatio = 0.15 + r() * 0.2
    const operatingExpenses = revenue * opexRatio
    const operatingIncome = grossProfit - operatingExpenses
    const netMargin = marginBase * (0.7 + r() * 0.6)
    const netIncome = revenue * netMargin
    const yearEps = netIncome / sharesOut
    incomeAnnual.push({
      period: `FY ${2025 - i}`,
      revenue,
      costOfRevenue,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      netIncome,
      eps: yearEps,
      sharesOutstanding: sharesOut,
    })
  }

  // Income Statement - 4 quarters
  const incomeQuarterly: IncomeStatementRow[] = []
  const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025']
  for (let i = 0; i < 4; i++) {
    const qRevenue = (revenueBase / 4) * (0.85 + r() * 0.3)
    const costRatio = 0.4 + r() * 0.25
    const costOfRevenue = qRevenue * costRatio
    const grossProfit = qRevenue - costOfRevenue
    const opex = qRevenue * (0.15 + r() * 0.2)
    const opIncome = grossProfit - opex
    const netIncome = qRevenue * marginBase * (0.7 + r() * 0.6)
    incomeQuarterly.push({
      period: quarters[i],
      revenue: qRevenue,
      costOfRevenue: costOfRevenue,
      grossProfit,
      operatingExpenses: opex,
      operatingIncome: opIncome,
      netIncome,
      eps: netIncome / sharesOut,
      sharesOutstanding: sharesOut,
    })
  }

  // Balance Sheet - 4 years
  const balanceSheet: BalanceSheetRow[] = []
  for (let i = 3; i >= 0; i--) {
    const totalAssets = scale * (0.5 + r() * 0.8) * (1 + (3 - i) * 0.05)
    const currentAssets = totalAssets * (0.25 + r() * 0.2)
    const cash = currentAssets * (0.3 + r() * 0.4)
    const totalLiabilities = totalAssets * (0.35 + r() * 0.3)
    const currentLiabilities = totalLiabilities * (0.2 + r() * 0.25)
    const longTermDebt = totalLiabilities * (0.3 + r() * 0.4)
    const equity = totalAssets - totalLiabilities
    balanceSheet.push({
      period: `FY ${2025 - i}`,
      totalAssets,
      currentAssets,
      cash,
      totalLiabilities,
      currentLiabilities,
      longTermDebt,
      shareholdersEquity: equity,
      bookValuePerShare: equity / sharesOut,
    })
  }

  // Cash Flow - 4 years
  const cashFlow: CashFlowRow[] = []
  for (let i = 3; i >= 0; i--) {
    const opCf = revenueBase * (0.08 + r() * 0.15) * (1 + (3 - i) * 0.03)
    const capex = opCf * (0.15 + r() * 0.35)
    const divPaid = r() > 0.4 ? opCf * (0.1 + r() * 0.3) : 0
    const buybacks = r() > 0.5 ? opCf * (0.05 + r() * 0.2) : 0
    cashFlow.push({
      period: `FY ${2025 - i}`,
      operatingCashFlow: opCf,
      capitalExpenditures: -capex,
      freeCashFlow: opCf - capex,
      dividendsPaid: -divPaid,
      shareBuybacks: -buybacks,
    })
  }

  // Analyst Ratings
  const totalAnalysts = 15 + Math.floor(r() * 25)
  const strongBuy = Math.floor(totalAnalysts * (0.1 + r() * 0.3))
  const buy = Math.floor(totalAnalysts * (0.1 + r() * 0.25))
  const hold = Math.floor(totalAnalysts * (0.1 + r() * 0.2))
  const sell = Math.floor(totalAnalysts * (0.02 + r() * 0.1))
  const strongSell = totalAnalysts - strongBuy - buy - hold - sell
  const weightedScore =
    (strongBuy * 5 + buy * 4 + hold * 3 + sell * 2 + Math.max(0, strongSell) * 1) / totalAnalysts
  const consensus =
    weightedScore >= 4.2
      ? 'Strong Buy'
      : weightedScore >= 3.5
        ? 'Buy'
        : weightedScore >= 2.5
          ? 'Hold'
          : weightedScore >= 1.8
            ? 'Sell'
            : 'Strong Sell'
  const ptAvg = price * (0.9 + r() * 0.3)
  const ptLow = ptAvg * (0.7 + r() * 0.15)
  const ptHigh = ptAvg * (1.15 + r() * 0.25)

  const analystRatings: AnalystRatings = {
    strongBuy,
    buy,
    hold,
    sell: Math.max(0, sell),
    strongSell: Math.max(0, strongSell),
    consensus,
    priceTargetLow: ptLow,
    priceTargetAvg: ptAvg,
    priceTargetHigh: ptHigh,
  }

  // Valuation
  const sectorPeAvg = 18 + r() * 15
  const peRatio = eps > 0 ? price / eps : 0
  const pbRatio = 1.5 + r() * 8
  const pegRatio = 0.5 + r() * 2.5
  const evEbitda = 8 + r() * 18
  const divYield = r() > 0.4 ? 0.5 + r() * 4.5 : 0
  const payoutRatioVal = divYield > 0 ? 20 + r() * 60 : 0
  const dcfFairValue = price * (0.75 + r() * 0.5)
  const priceToDcf = price / dcfFairValue
  const verdict: ValuationData['verdict'] =
    priceToDcf < 0.9
      ? 'Undervalued'
      : priceToDcf > 1.15
        ? 'Overvalued'
        : 'Fairly Valued'

  const valuation: ValuationData = {
    dcfFairValue,
    peRatio,
    sectorPeAvg,
    pbRatio,
    pegRatio,
    evEbitda,
    dividendYield: divYield,
    payoutRatio: payoutRatioVal,
    verdict,
  }

  // Dividends
  const paysDividend = divYield > 0
  const annualDiv = paysDividend ? price * (divYield / 100) : 0
  const exMonth = 1 + Math.floor(r() * 12)
  const exDay = 1 + Math.floor(r() * 27)
  const exDate = `${2026}-${String(exMonth).padStart(2, '0')}-${String(exDay).padStart(2, '0')}`
  const fiveYrGrowth = paysDividend ? 2 + r() * 12 : 0
  const divScore = paysDividend ? Math.min(10, Math.max(1, Math.round(3 + r() * 7))) : 0

  const dividendData: DividendData = {
    annualDividend: annualDiv,
    dividendYield: divYield,
    payoutRatio: payoutRatioVal,
    exDividendDate: exDate,
    fiveYearGrowthRate: fiveYrGrowth,
    dividendScore: divScore,
    paysDividend,
  }

  return { incomeAnnual, incomeQuarterly, balanceSheet, cashFlow, analystRatings, valuation, dividendData }
}

/* ────────────────────── Sub-Components ────────────────────── */

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Bullish' },
  bearish: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Bearish' },
  neutral: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-accent', label: 'Neutral' },
}

function StatRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${className ?? ''}`}>{value}</span>
    </div>
  )
}

/* ── Financial Statements Section ── */

function IncomeStatementTable({ rows }: { rows: IncomeStatementRow[] }) {
  const metrics: { label: string; key: keyof IncomeStatementRow; fmt: (v: number) => string }[] = [
    { label: 'Revenue', key: 'revenue', fmt: fmtB },
    { label: 'Cost of Revenue', key: 'costOfRevenue', fmt: fmtB },
    { label: 'Gross Profit', key: 'grossProfit', fmt: fmtB },
    { label: 'Operating Expenses', key: 'operatingExpenses', fmt: fmtB },
    { label: 'Operating Income', key: 'operatingIncome', fmt: fmtB },
    { label: 'Net Income', key: 'netIncome', fmt: fmtB },
    { label: 'EPS', key: 'eps', fmt: (v) => `$${v.toFixed(2)}` },
    { label: 'Shares Outstanding', key: 'sharesOutstanding', fmt: (v) => formatVolume(v) },
  ]
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Metric</TableHead>
            {rows.map((r) => (
              <TableHead key={r.period} className="text-xs text-right">{r.period}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m) => (
            <TableRow key={m.label}>
              <TableCell className="text-xs font-medium">{m.label}</TableCell>
              {rows.map((r) => (
                <TableCell key={r.period} className="text-xs text-right">
                  {m.fmt(r[m.key] as number)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function BalanceSheetTable({ rows }: { rows: BalanceSheetRow[] }) {
  const metrics: { label: string; key: keyof BalanceSheetRow; fmt: (v: number) => string }[] = [
    { label: 'Total Assets', key: 'totalAssets', fmt: fmtB },
    { label: 'Current Assets', key: 'currentAssets', fmt: fmtB },
    { label: 'Cash & Equivalents', key: 'cash', fmt: fmtB },
    { label: 'Total Liabilities', key: 'totalLiabilities', fmt: fmtB },
    { label: 'Current Liabilities', key: 'currentLiabilities', fmt: fmtB },
    { label: 'Long-term Debt', key: 'longTermDebt', fmt: fmtB },
    { label: "Shareholders' Equity", key: 'shareholdersEquity', fmt: fmtB },
    { label: 'Book Value / Share', key: 'bookValuePerShare', fmt: (v) => `$${v.toFixed(2)}` },
  ]
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Metric</TableHead>
            {rows.map((r) => (
              <TableHead key={r.period} className="text-xs text-right">{r.period}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m) => (
            <TableRow key={m.label}>
              <TableCell className="text-xs font-medium">{m.label}</TableCell>
              {rows.map((r) => (
                <TableCell key={r.period} className="text-xs text-right">
                  {m.fmt(r[m.key] as number)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CashFlowTable({ rows }: { rows: CashFlowRow[] }) {
  const metrics: { label: string; key: keyof CashFlowRow; fmt: (v: number) => string }[] = [
    { label: 'Operating Cash Flow', key: 'operatingCashFlow', fmt: fmtB },
    { label: 'Capital Expenditures', key: 'capitalExpenditures', fmt: fmtB },
    { label: 'Free Cash Flow', key: 'freeCashFlow', fmt: fmtB },
    { label: 'Dividends Paid', key: 'dividendsPaid', fmt: fmtB },
    { label: 'Share Buybacks', key: 'shareBuybacks', fmt: fmtB },
  ]
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Metric</TableHead>
            {rows.map((r) => (
              <TableHead key={r.period} className="text-xs text-right">{r.period}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m) => (
            <TableRow key={m.label}>
              <TableCell className="text-xs font-medium">{m.label}</TableCell>
              {rows.map((r) => {
                const val = r[m.key] as number
                return (
                  <TableCell
                    key={r.period}
                    className={`text-xs text-right ${val < 0 ? 'text-red-500' : ''}`}
                  >
                    {fmtB(val)}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FinancialStatementsSection({
  incomeAnnual,
  incomeQuarterly,
  balanceSheet,
  cashFlow,
}: {
  incomeAnnual: IncomeStatementRow[]
  incomeQuarterly: IncomeStatementRow[]
  balanceSheet: BalanceSheetRow[]
  cashFlow: CashFlowRow[]
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" /> Financial Statements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income">
          <TabsList className="mb-3">
            <TabsTrigger value="income" className="text-xs">Income Statement</TabsTrigger>
            <TabsTrigger value="balance" className="text-xs">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs">Cash Flow</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <Tabs defaultValue="annual">
              <TabsList className="mb-2">
                <TabsTrigger value="annual" className="text-xs">Annual</TabsTrigger>
                <TabsTrigger value="quarterly" className="text-xs">Quarterly</TabsTrigger>
              </TabsList>
              <TabsContent value="annual">
                <IncomeStatementTable rows={incomeAnnual} />
              </TabsContent>
              <TabsContent value="quarterly">
                <IncomeStatementTable rows={incomeQuarterly} />
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="balance">
            <BalanceSheetTable rows={balanceSheet} />
          </TabsContent>
          <TabsContent value="cashflow">
            <CashFlowTable rows={cashFlow} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/* ── Analyst Ratings Section ── */

function AnalystRatingsSection({ ratings, currentPrice }: { ratings: AnalystRatings; currentPrice: number }) {
  const total = ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell
  const segments = [
    { label: 'Strong Buy', count: ratings.strongBuy, color: 'bg-emerald-600' },
    { label: 'Buy', count: ratings.buy, color: 'bg-emerald-400' },
    { label: 'Hold', count: ratings.hold, color: 'bg-amber-400' },
    { label: 'Sell', count: ratings.sell, color: 'bg-orange-500' },
    { label: 'Strong Sell', count: ratings.strongSell, color: 'bg-red-500' },
  ]

  const consensusColor =
    ratings.consensus === 'Strong Buy' || ratings.consensus === 'Buy'
      ? 'text-emerald-500'
      : ratings.consensus === 'Hold'
        ? 'text-amber-500'
        : 'text-red-500'

  // Price target bar
  const range = ratings.priceTargetHigh - ratings.priceTargetLow
  const avgPct = range > 0 ? ((ratings.priceTargetAvg - ratings.priceTargetLow) / range) * 100 : 50
  const curPct = range > 0 ? Math.max(0, Math.min(100, ((currentPrice - ratings.priceTargetLow) / range) * 100)) : 50

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4" /> Analyst Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Consensus */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Consensus</p>
            <p className={`text-lg font-bold ${consensusColor}`}>{ratings.consensus}</p>
          </div>
          <Badge variant="outline" className="text-xs">{total} Analysts</Badge>
        </div>

        {/* Rating gauge bar */}
        <div className="space-y-1.5">
          <div className="flex h-3 rounded-full overflow-hidden">
            {segments.map((seg) =>
              seg.count > 0 ? (
                <div
                  key={seg.label}
                  className={`${seg.color} transition-all`}
                  style={{ width: `${(seg.count / total) * 100}%` }}
                  title={`${seg.label}: ${seg.count}`}
                />
              ) : null,
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {segments.map((seg) => (
              <span key={seg.label} className="text-center">
                {seg.count}
              </span>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {segments.map((seg) => (
              <span key={seg.label} className="text-center truncate" style={{ maxWidth: '20%' }}>
                {seg.label}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Targets */}
        <div>
          <p className="text-xs font-medium mb-2">Price Targets</p>
          <div className="grid grid-cols-4 gap-2 text-center mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="text-sm font-medium text-red-500">${ratings.priceTargetLow.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-sm font-bold">${ratings.priceTargetAvg.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High</p>
              <p className="text-sm font-medium text-emerald-500">${ratings.priceTargetHigh.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-sm font-medium">${currentPrice.toFixed(2)}</p>
            </div>
          </div>
          {/* Visual bar */}
          <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500">
            {/* Avg marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-1 bg-foreground rounded"
              style={{ left: `${avgPct}%` }}
              title={`Avg: $${ratings.priceTargetAvg.toFixed(2)}`}
            />
            {/* Current price marker */}
            <div
              className="absolute -top-1 h-4 w-4 rounded-full border-2 border-foreground bg-background"
              style={{ left: `${curPct}%`, transform: 'translateX(-50%)' }}
              title={`Current: $${currentPrice.toFixed(2)}`}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">${ratings.priceTargetLow.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground">${ratings.priceTargetHigh.toFixed(0)}</span>
          </div>
        </div>

        {/* Upside/downside */}
        {(() => {
          const upside = ((ratings.priceTargetAvg - currentPrice) / currentPrice) * 100
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Avg Target Upside:</span>
              <span className={`text-sm font-bold ${upside >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
              </span>
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}

/* ── Valuation Section ── */

function ValuationSection({ valuation, currentPrice }: { valuation: ValuationData; currentPrice: number }) {
  const verdictConfig = {
    Undervalued: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    'Fairly Valued': { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    Overvalued: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  }
  const vc = verdictConfig[valuation.verdict]
  const VerdictIcon = vc.icon
  const discount = ((valuation.dcfFairValue - currentPrice) / currentPrice) * 100

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Scale className="h-4 w-4" /> Fair Value & Valuation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Verdict */}
        <div className={`flex items-center gap-3 rounded-lg p-3 ${vc.bg}`}>
          <VerdictIcon className={`h-6 w-6 ${vc.color}`} />
          <div>
            <p className={`text-sm font-bold ${vc.color}`}>{valuation.verdict}</p>
            <p className="text-xs text-muted-foreground">
              DCF Fair Value: ${valuation.dcfFairValue.toFixed(2)}{' '}
              ({discount >= 0 ? '+' : ''}{discount.toFixed(1)}% vs current)
            </p>
          </div>
        </div>

        {/* Fair value bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Price vs Fair Value</span>
          </div>
          <div className="relative h-2 rounded-full bg-accent">
            <div
              className={`absolute top-0 h-2 rounded-full ${
                valuation.verdict === 'Undervalued'
                  ? 'bg-emerald-500'
                  : valuation.verdict === 'Overvalued'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(100, (currentPrice / valuation.dcfFairValue) * 50)}%`,
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-0">
          <StatRow
            label="P/E Ratio"
            value={valuation.peRatio > 0 ? valuation.peRatio.toFixed(1) : '—'}
            className={
              valuation.peRatio > 0 && valuation.peRatio > valuation.sectorPeAvg
                ? 'text-red-500'
                : 'text-emerald-500'
            }
          />
          <StatRow
            label="Sector Avg P/E"
            value={valuation.sectorPeAvg.toFixed(1)}
          />
          <Separator className="col-span-2" />
          <StatRow label="P/B Ratio" value={valuation.pbRatio.toFixed(2)} />
          <StatRow
            label="PEG Ratio"
            value={valuation.pegRatio.toFixed(2)}
            className={valuation.pegRatio < 1 ? 'text-emerald-500' : valuation.pegRatio > 2 ? 'text-red-500' : ''}
          />
          <Separator className="col-span-2" />
          <StatRow label="EV/EBITDA" value={valuation.evEbitda.toFixed(1)} />
          <StatRow
            label="Dividend Yield"
            value={valuation.dividendYield > 0 ? `${valuation.dividendYield.toFixed(2)}%` : '—'}
          />
          <Separator className="col-span-2" />
          <StatRow
            label="Payout Ratio"
            value={valuation.payoutRatio > 0 ? `${valuation.payoutRatio.toFixed(0)}%` : '—'}
          />
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Dividend Section ── */

function DividendSection({ dividend }: { dividend: DividendData }) {
  if (!dividend.paysDividend) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Banknote className="h-4 w-4" /> Dividend Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-xs text-muted-foreground">
            This company does not currently pay a dividend.
          </p>
        </CardContent>
      </Card>
    )
  }

  const scoreColor =
    dividend.dividendScore >= 7
      ? 'text-emerald-500'
      : dividend.dividendScore >= 4
        ? 'text-amber-500'
        : 'text-red-500'
  const scoreBg =
    dividend.dividendScore >= 7
      ? 'bg-emerald-500'
      : dividend.dividendScore >= 4
        ? 'bg-amber-500'
        : 'bg-red-500'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Banknote className="h-4 w-4" /> Dividend Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Dividend Score</p>
            <p className={`text-2xl font-bold ${scoreColor}`}>{dividend.dividendScore}/10</p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 w-2 rounded-sm ${
                  i < dividend.dividendScore ? scoreBg : 'bg-accent'
                }`}
              />
            ))}
          </div>
        </div>

        <Separator />

        <StatRow label="Annual Dividend" value={`$${dividend.annualDividend.toFixed(2)}`} />
        <Separator />
        <StatRow
          label="Dividend Yield"
          value={`${dividend.dividendYield.toFixed(2)}%`}
          className={dividend.dividendYield >= 3 ? 'text-emerald-500' : ''}
        />
        <Separator />
        <StatRow
          label="Payout Ratio"
          value={`${dividend.payoutRatio.toFixed(0)}%`}
          className={dividend.payoutRatio > 80 ? 'text-red-500' : ''}
        />
        <Separator />
        <StatRow label="Ex-Dividend Date" value={dividend.exDividendDate} />
        <Separator />
        <StatRow
          label="5Y Dividend Growth"
          value={`${dividend.fiveYearGrowthRate.toFixed(1)}%`}
          className="text-emerald-500"
        />
      </CardContent>
    </Card>
  )
}

/* ────────────────────────── Main Component ────────────────────────── */

export function QuoteDetail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const symbol = (params.get('symbol') ?? 'SPY').toUpperCase()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [history, setHistory] = useState<OHLCV[]>([])
  const [loading, setLoading] = useState(true)
  const [watchlisted, setWatchlisted] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchQuote(symbol).catch(() => null),
      fetchNews([symbol]).catch(() => []),
      fetchHistoricalData(symbol, '1Y').catch(() => []),
    ]).then(([q, n, h]) => {
      setQuote(q)
      setNews(n)
      setHistory(h)
      setLoading(false)
    })

    // Check watchlist
    const wl: string[] = JSON.parse(localStorage.getItem('aria-watchlist-symbols') ?? '[]')
    setWatchlisted(wl.includes(symbol))
  }, [symbol])

  const toggleWatchlist = () => {
    const wl: string[] = JSON.parse(localStorage.getItem('aria-watchlist-symbols') ?? '[]')
    if (watchlisted) {
      const updated = wl.filter((s) => s !== symbol)
      localStorage.setItem('aria-watchlist-symbols', JSON.stringify(updated))
    } else {
      wl.push(symbol)
      localStorage.setItem('aria-watchlist-symbols', JSON.stringify(wl))
    }
    setWatchlisted(!watchlisted)
  }

  const performanceStats = useMemo(() => {
    if (history.length < 2 || !quote) return null
    const now = quote.price
    const findPrice = (daysAgo: number) => {
      const target = Date.now() - daysAgo * 86400000
      const closest = history.reduce((best, h) =>
        Math.abs(h.timestamp - target) < Math.abs(best.timestamp - target) ? h : best
      )
      return closest.close
    }
    const calc = (old: number) => ((now - old) / old * 100)
    return {
      '1W': history.length > 5 ? calc(findPrice(7)) : null,
      '1M': history.length > 20 ? calc(findPrice(30)) : null,
      '3M': history.length > 60 ? calc(findPrice(90)) : null,
      '6M': history.length > 120 ? calc(findPrice(180)) : null,
      '1Y': calc(history[0].close),
      'YTD': (() => {
        const jan1 = new Date(new Date().getFullYear(), 0, 1).getTime()
        const ytdCandle = history.reduce((best, h) =>
          Math.abs(h.timestamp - jan1) < Math.abs(best.timestamp - jan1) ? h : best
        )
        return calc(ytdCandle.close)
      })(),
    }
  }, [history, quote])

  // Generate deterministic financial data
  const financials = useMemo(() => {
    if (!quote) return null
    return generateFinancialData(symbol, quote.price, quote.marketCap, quote.eps)
  }, [symbol, quote])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading {symbol}...</span>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="py-12 text-center text-sm text-muted-foreground">
          Could not load data for {symbol}
        </div>
      </div>
    )
  }

  const range52 = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow
  const pctInRange = range52 > 0 ? ((quote.price - quote.fiftyTwoWeekLow) / range52) * 100 : 50
  const volRatio = quote.avgVolume > 0 ? (quote.volume / quote.avgVolume) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{symbol}</h1>
              <Badge variant="outline" className="text-xs">{quote.exchange}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{quote.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={toggleWatchlist}>
            {watchlisted ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
            {watchlisted ? 'Remove' : 'Watchlist'}
          </Button>
          <Button size="sm" className="gap-1 text-xs" onClick={() => navigate(`/trade?symbol=${symbol}`)}>
            <DollarSign className="h-3.5 w-3.5" /> Trade
          </Button>
        </div>
      </div>

      {/* Price banner */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 py-4">
          <div>
            <p className="text-3xl font-bold">${quote.price.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-1">
              {quote.changePercent >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-lg font-semibold ${quote.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
          </div>
          <Separator orientation="vertical" className="h-12 hidden sm:block" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-sm font-medium">${quote.open.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High</p>
              <p className="text-sm font-medium">${quote.high.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="text-sm font-medium">${quote.low.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prev Close</p>
              <p className="text-sm font-medium">${quote.previousClose.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">Financials</TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {/* Chart + Technical */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PriceChart symbol={symbol} />
              </div>
              <TechnicalPanel symbol={symbol} />
            </div>

            {/* Key Stats + Performance + News */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Key Statistics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4" /> Key Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <StatRow label="Market Cap" value={formatLargeNumber(quote.marketCap)} />
                  <Separator />
                  <StatRow label="P/E Ratio" value={quote.pe > 0 ? quote.pe.toFixed(2) : '—'} />
                  <Separator />
                  <StatRow label="EPS" value={quote.eps !== 0 ? `$${quote.eps.toFixed(2)}` : '—'} />
                  <Separator />
                  <StatRow label="Volume" value={formatVolume(quote.volume)} />
                  <Separator />
                  <StatRow label="Avg Volume" value={formatVolume(quote.avgVolume)} />
                  <Separator />
                  <StatRow
                    label="Vol Ratio"
                    value={volRatio > 0 ? `${volRatio.toFixed(2)}x` : '—'}
                    className={volRatio > 1.5 ? 'text-amber-500' : ''}
                  />
                  <Separator />
                  <StatRow label="52W High" value={`$${quote.fiftyTwoWeekHigh.toFixed(2)}`} />
                  <Separator />
                  <StatRow label="52W Low" value={`$${quote.fiftyTwoWeekLow.toFixed(2)}`} />
                  <Separator />
                  <div className="py-2">
                    <p className="text-xs text-muted-foreground mb-1.5">52-Week Range</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">${quote.fiftyTwoWeekLow.toFixed(0)}</span>
                      <div className="relative flex-1 h-2 rounded-full bg-accent">
                        <div
                          className="absolute top-0 h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(0, pctInRange))}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-foreground rounded"
                          style={{ left: `${Math.min(100, Math.max(0, pctInRange))}%` }}
                        />
                      </div>
                      <span className="text-xs">${quote.fiftyTwoWeekHigh.toFixed(0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4" /> Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceStats ? (
                    <div className="space-y-0">
                      {Object.entries(performanceStats).map(([period, pct]) => (
                        pct !== null && (
                          <div key={period}>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-xs text-muted-foreground">{period}</span>
                              <div className="flex items-center gap-2">
                                <div className="relative h-1.5 w-20 rounded-full bg-accent">
                                  <div
                                    className={`absolute top-0 h-1.5 rounded-full ${pct >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    style={{
                                      width: `${Math.min(100, Math.abs(pct) * 2)}%`,
                                      ...(pct < 0 ? { right: '50%' } : { left: '50%' }),
                                    }}
                                  />
                                </div>
                                <span className={`text-sm font-medium w-16 text-right ${pct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <Separator />
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-xs text-muted-foreground">No performance data</p>
                  )}

                  {/* Day range */}
                  {quote.high > 0 && quote.low > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1.5">Today's Range</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">${quote.low.toFixed(2)}</span>
                        <div className="relative flex-1 h-1.5 rounded-full bg-accent">
                          {(() => {
                            const dayRange = quote.high - quote.low
                            const dayPct = dayRange > 0 ? ((quote.price - quote.low) / dayRange) * 100 : 50
                            return (
                              <div
                                className="absolute top-0 h-1.5 rounded-full bg-blue-500"
                                style={{ width: `${Math.min(100, Math.max(0, dayPct))}%` }}
                              />
                            )
                          })()}
                        </div>
                        <span className="text-xs">${quote.high.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Sparkline */}
                  <div className="mt-4 flex justify-center">
                    <Sparkline symbol={symbol} width={200} height={50} />
                  </div>
                </CardContent>
              </Card>

              {/* Related News */}
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Newspaper className="h-4 w-4" /> Related News
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0" style={{ maxHeight: '400px' }}>
                  {news.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">No news available</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {news.slice(0, 10).map((item) => {
                        const sentiment = sentimentConfig[item.sentiment]
                        const Icon = sentiment.icon
                        return (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/30"
                          >
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${sentiment.bg}`}>
                              <Icon className={`h-3.5 w-3.5 ${sentiment.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium leading-tight line-clamp-2">{item.title}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{item.source}</span>
                                {item.publishedAt > 0 && (
                                  <span className="text-xs text-muted-foreground">{timeAgo(item.publishedAt)}</span>
                                )}
                                <Badge variant="outline" className={`h-4 px-1 text-xs ${sentiment.color}`}>
                                  {sentiment.label}
                                </Badge>
                              </div>
                            </div>
                            <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
                          </a>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Financials Tab ── */}
        <TabsContent value="financials">
          {financials && (
            <div className="space-y-4">
              <FinancialStatementsSection
                incomeAnnual={financials.incomeAnnual}
                incomeQuarterly={financials.incomeQuarterly}
                balanceSheet={financials.balanceSheet}
                cashFlow={financials.cashFlow}
              />
            </div>
          )}
        </TabsContent>

        {/* ── Analysis Tab ── */}
        <TabsContent value="analysis">
          {financials && (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <AnalystRatingsSection
                  ratings={financials.analystRatings}
                  currentPrice={quote.price}
                />
                <ValuationSection
                  valuation={financials.valuation}
                  currentPrice={quote.price}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <DividendSection dividend={financials.dividendData} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
