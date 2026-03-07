import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchHistoricalData } from '@/services/marketData'
import { dailyReturns, correlation } from '@/lib/analytics/portfolio'
import type { OHLCV } from '@/types/market'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { Shield, AlertTriangle, TrendingDown, Loader2 } from 'lucide-react'

const SECTOR_MAP: Record<string, string> = {
  AAPL: 'Technology', MSFT: 'Technology', NVDA: 'Technology', GOOGL: 'Technology',
  META: 'Technology', AMZN: 'Consumer Cyclical', TSLA: 'Consumer Cyclical',
  AMD: 'Technology', INTC: 'Technology', CRM: 'Technology',
  JPM: 'Financial Services', BAC: 'Financial Services', GS: 'Financial Services',
  V: 'Financial Services', MA: 'Financial Services',
  JNJ: 'Healthcare', UNH: 'Healthcare', PFE: 'Healthcare', LLY: 'Healthcare',
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy',
  PG: 'Consumer Defensive', KO: 'Consumer Defensive', PEP: 'Consumer Defensive',
  DIS: 'Communication Services', NFLX: 'Communication Services',
  CAT: 'Industrials', BA: 'Industrials', HON: 'Industrials',
  RIVN: 'Consumer Cyclical', PLTR: 'Technology', SOFI: 'Financial Services',
  COIN: 'Financial Services', SQ: 'Financial Services',
  CRWD: 'Technology', SNOW: 'Technology', ARM: 'Technology', SMCI: 'Technology',
}

const SECTOR_COLORS: Record<string, string> = {
  'Technology': 'hsl(210, 70%, 55%)',
  'Financial Services': 'hsl(35, 80%, 55%)',
  'Healthcare': 'hsl(150, 60%, 45%)',
  'Consumer Cyclical': 'hsl(280, 60%, 55%)',
  'Energy': 'hsl(0, 65%, 55%)',
  'Consumer Defensive': 'hsl(190, 70%, 50%)',
  'Communication Services': 'hsl(60, 60%, 50%)',
  'Industrials': 'hsl(330, 60%, 55%)',
  'Other': 'hsl(0, 0%, 50%)',
}

export function RiskDashboard() {
  const { holdings, totals } = usePortfolioContext()
  const [loading, setLoading] = useState(false)
  const [drawdownData, setDrawdownData] = useState<{ date: string; drawdown: number }[]>([])
  const [varData, setVarData] = useState<{ var95: number; var99: number; cvar95: number }>({ var95: 0, var99: 0, cvar95: 0 })
  const [corrMatrix, setCorrMatrix] = useState<{ symbols: string[]; matrix: number[][] }>({ symbols: [], matrix: [] })

  // Sector exposure
  const sectorExposure = useMemo(() => {
    const map = new Map<string, number>()
    holdings.forEach((h) => {
      const sector = SECTOR_MAP[h.symbol] ?? 'Other'
      map.set(sector, (map.get(sector) ?? 0) + h.marketValue)
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [holdings])

  // VaR bars
  const varBars = useMemo(() => [
    { name: 'VaR 95%', value: Math.abs(varData.var95), fill: '#f59e0b' },
    { name: 'VaR 99%', value: Math.abs(varData.var99), fill: '#ef4444' },
    { name: 'CVaR 95%', value: Math.abs(varData.cvar95), fill: '#dc2626' },
  ], [varData])

  useEffect(() => {
    if (holdings.length === 0) return
    setLoading(true)

    const symbols = holdings.map((h) => h.symbol).slice(0, 10)
    const weights = holdings.slice(0, 10).map((h) => h.marketValue / totals.totalMarketValue)

    Promise.all(symbols.map((s) => fetchHistoricalData(s, '1Y').catch(() => [] as OHLCV[])))
      .then((allData) => {
        const minLen = Math.min(...allData.filter((d) => d.length > 0).map((d) => d.length))
        if (minLen < 30) return

        // Portfolio daily returns
        const portfolioReturns: number[] = []
        for (let i = 1; i < minLen; i++) {
          let dayRet = 0
          for (let j = 0; j < allData.length; j++) {
            const d = allData[j]
            if (d.length >= minLen && d[i - 1].close > 0) {
              const ret = (d[i].close - d[i - 1].close) / d[i - 1].close
              dayRet += ret * weights[j]
            }
          }
          portfolioReturns.push(dayRet)
        }

        // Drawdown
        let peak = 1
        let equity = 1
        const dd: { date: string; drawdown: number }[] = []
        for (let i = 0; i < portfolioReturns.length; i++) {
          equity *= (1 + portfolioReturns[i])
          if (equity > peak) peak = equity
          const drawdown = ((equity - peak) / peak) * 100
          const dateTs = allData[0]?.[i + 1]?.timestamp ?? Date.now()
          dd.push({
            date: new Date(dateTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            drawdown,
          })
        }
        setDrawdownData(dd)

        // VaR
        const sorted = [...portfolioReturns].sort((a, b) => a - b)
        const idx95 = Math.floor(sorted.length * 0.05)
        const idx99 = Math.floor(sorted.length * 0.01)
        const var95 = sorted[idx95] * totals.totalMarketValue
        const var99 = sorted[idx99] * totals.totalMarketValue
        const cvar95 = (sorted.slice(0, idx95).reduce((s, v) => s + v, 0) / Math.max(idx95, 1)) * totals.totalMarketValue
        setVarData({ var95, var99, cvar95 })

        // Correlation matrix
        const returnsBySymbol: number[][] = allData.map((d) => dailyReturns(d.slice(0, minLen)))
        const matrix: number[][] = []
        for (let i = 0; i < symbols.length; i++) {
          const row: number[] = []
          for (let j = 0; j < symbols.length; j++) {
            if (i === j) {
              row.push(1)
            } else if (returnsBySymbol[i].length > 5 && returnsBySymbol[j].length > 5) {
              const len = Math.min(returnsBySymbol[i].length, returnsBySymbol[j].length)
              row.push(correlation(returnsBySymbol[i].slice(0, len), returnsBySymbol[j].slice(0, len)))
            } else {
              row.push(0)
            }
          }
          matrix.push(row)
        }
        setCorrMatrix({ symbols, matrix })
      })
      .finally(() => setLoading(false))
  }, [holdings, totals.totalMarketValue])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Risk Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Portfolio: ${totals.totalValue.toLocaleString()}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Shield className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Daily VaR (95%)</p>
              <p className="text-sm font-bold text-yellow-500">${Math.abs(varData.var95).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Daily VaR (99%)</p>
              <p className="text-sm font-bold text-red-500">${Math.abs(varData.var99).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">CVaR (95%)</p>
              <p className="text-sm font-bold text-red-600">${Math.abs(varData.cvar95).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Drawdown Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Portfolio Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Drawdown']}
                  />
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sector Exposure Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sector Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorExposure} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                    {sectorExposure.map((entry) => (
                      <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] ?? SECTOR_COLORS['Other']} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(value) => [`$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 'Exposure']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* VaR Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Value at Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varBars} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(value) => [`$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 'Loss']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {varBars.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Correlation Matrix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {corrMatrix.symbols.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-1 py-1"></th>
                      {corrMatrix.symbols.map((s) => (
                        <th key={s} className="px-1 py-1 font-medium">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {corrMatrix.symbols.map((sym, i) => (
                      <tr key={sym}>
                        <td className="px-1 py-1 font-medium">{sym}</td>
                        {corrMatrix.matrix[i].map((val, j) => {
                          const absVal = Math.abs(val)
                          const color = i === j
                            ? 'rgba(59, 130, 246, 0.3)'
                            : val > 0.7
                            ? `rgba(239, 68, 68, ${absVal * 0.6})`
                            : val > 0.3
                            ? `rgba(245, 158, 11, ${absVal * 0.4})`
                            : val < -0.3
                            ? `rgba(34, 197, 94, ${absVal * 0.5})`
                            : 'transparent'
                          return (
                            <td
                              key={j}
                              className="px-1 py-1 text-center"
                              style={{ backgroundColor: color }}
                            >
                              {val.toFixed(2)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading correlation data...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
