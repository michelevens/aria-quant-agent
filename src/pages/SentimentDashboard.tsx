import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import {
  Gauge, TrendingUp, TrendingDown, Activity, RefreshCw, Loader2,
  ThumbsUp, ThumbsDown, Minus, AlertTriangle, Flame, Snowflake,
} from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateFearGreedHistory() {
  const rand = seededRandom(777)
  const points: { date: string; value: number }[] = []
  const start = new Date(2024, 6, 1)
  let val = 50
  for (let d = 0; d < 240; d++) {
    const dt = new Date(start.getTime() + d * 86400000)
    val += (rand() - 0.48) * 8
    val = Math.max(5, Math.min(95, val))
    if (d % 3 === 0) {
      points.push({
        date: `${dt.getMonth() + 1}/${dt.getDate()}`,
        value: Math.round(val),
      })
    }
  }
  return points
}

function generatePutCallHistory() {
  const rand = seededRandom(321)
  const points: { date: string; ratio: number }[] = []
  const start = new Date(2024, 9, 1)
  let ratio = 0.85
  for (let d = 0; d < 120; d++) {
    const dt = new Date(start.getTime() + d * 86400000)
    ratio += (rand() - 0.5) * 0.08
    ratio = Math.max(0.4, Math.min(1.6, ratio))
    if (d % 2 === 0) {
      points.push({
        date: `${dt.getMonth() + 1}/${dt.getDate()}`,
        ratio: parseFloat(ratio.toFixed(2)),
      })
    }
  }
  return points
}

function generateSocialSentiment() {
  const today = new Date()
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  let s = daySeed
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
  const symbols = ['NVDA', 'TSLA', 'AAPL', 'AMZN', 'MSFT', 'META', 'AMD', 'GOOGL']
  return symbols.map((symbol) => {
    const bullish = Math.round(30 + rand() * 50)
    const bearish = Math.round(5 + rand() * 35)
    const neutral = 100 - bullish - bearish
    const mentions = Math.round(2000 + rand() * 12000)
    const trend = rand() > 0.4 ? 'up' as const : 'down' as const
    return { symbol, bullish, bearish, neutral: Math.max(neutral, 0), mentions, trend }
  })
}

const SOCIAL_SENTIMENT = generateSocialSentiment()

const VIX_LEVELS = [
  { range: '0–12', label: 'Complacency', color: '#10b981' },
  { range: '12–20', label: 'Normal', color: '#3b82f6' },
  { range: '20–30', label: 'Elevated', color: '#f59e0b' },
  { range: '30+', label: 'High Fear', color: '#ef4444' },
]

function getFearGreedLabel(val: number): { label: string; color: string; icon: typeof Flame } {
  if (val >= 75) return { label: 'Extreme Greed', color: '#10b981', icon: Flame }
  if (val >= 55) return { label: 'Greed', color: '#34d399', icon: TrendingUp }
  if (val >= 45) return { label: 'Neutral', color: '#f59e0b', icon: Minus }
  if (val >= 25) return { label: 'Fear', color: '#f87171', icon: TrendingDown }
  return { label: 'Extreme Fear', color: '#ef4444', icon: Snowflake }
}

export function SentimentDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [fearGreed, setFearGreed] = useState(62)
  const [vix, setVix] = useState(18.4)
  const [putCallRatio, setPutCallRatio] = useState(0.82)

  const fearGreedHistory = useMemo(() => generateFearGreedHistory(), [])
  const putCallHistory = useMemo(() => generatePutCallHistory(), [])

  useEffect(() => {
    const t = setTimeout(() => {
      const today = new Date()
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      let s = seed + 999
      const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
      setFearGreed(Math.round(20 + rand() * 60))
      setVix(+(12 + rand() * 18).toFixed(1))
      setPutCallRatio(+(0.5 + rand() * 0.8).toFixed(2))
      setLoading(false)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const fgInfo = getFearGreedLabel(fearGreed)
  const FGIcon = fgInfo.icon

  const vixColor = vix < 12 ? '#10b981' : vix < 20 ? '#3b82f6' : vix < 30 ? '#f59e0b' : '#ef4444'
  const vixLabel = vix < 12 ? 'Low' : vix < 20 ? 'Normal' : vix < 30 ? 'Elevated' : 'High'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Gauge className="h-5 w-5" />
          Market Sentiment
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600) }}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Top gauge cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Fear & Greed */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Fear & Greed Index</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full border-4"
              style={{ borderColor: fgInfo.color }}
            >
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: fgInfo.color }}>{fearGreed}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <FGIcon className="h-4 w-4" style={{ color: fgInfo.color }} />
              <span className="text-sm font-semibold" style={{ color: fgInfo.color }}>{fgInfo.label}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Updated today</p>
          </CardContent>
        </Card>

        {/* VIX */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">VIX (Volatility Index)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full border-4"
              style={{ borderColor: vixColor }}
            >
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: vixColor }}>{vix.toFixed(1)}</p>
                <Activity className="mx-auto mt-0.5 h-3.5 w-3.5" style={{ color: vixColor }} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" style={{ color: vixColor }} />
              <span className="text-sm font-semibold" style={{ color: vixColor }}>{vixLabel}</span>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {VIX_LEVELS.map((l) => (
                <Badge key={l.range} variant="outline" className="text-xs" style={{ color: l.color, borderColor: l.color }}>
                  {l.range} {l.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Put/Call Ratio */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Put/Call Ratio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full border-4"
              style={{ borderColor: putCallRatio > 1 ? '#ef4444' : putCallRatio < 0.7 ? '#10b981' : '#3b82f6' }}
            >
              <p className="text-2xl font-bold">{putCallRatio.toFixed(2)}</p>
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold">
                {putCallRatio > 1 ? 'Bearish' : putCallRatio < 0.7 ? 'Bullish' : 'Neutral'}
              </p>
              <p className="text-xs text-muted-foreground">
                {putCallRatio > 1 ? 'More puts than calls' : putCallRatio < 0.7 ? 'More calls than puts' : 'Balanced options flow'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Fear & Greed History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fear & Greed History (8 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={fearGreedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={10} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [Number(v), 'Fear & Greed']}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b20" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Put/Call History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Put/Call Ratio History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={putCallHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={8} />
                <YAxis tick={{ fontSize: 10 }} domain={[0.4, 1.6]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [Number(v).toFixed(2), 'P/C Ratio']}
                />
                <Area type="monotone" dataKey="ratio" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Social Sentiment Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Social Sentiment (Top Mentioned Stocks)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Symbol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Sentiment</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Bullish</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Bearish</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Mentions</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {SOCIAL_SENTIMENT.map((s) => {
                  return (
                    <tr key={s.symbol} className="border-b border-border last:border-0 cursor-pointer hover:bg-accent/30" onClick={() => navigate(`/quote?symbol=${s.symbol}`)}>
                      <td className="px-4 py-2 font-semibold">{s.symbol}</td>
                      <td className="px-4 py-2">
                        <div className="flex h-2 overflow-hidden rounded-full">
                          <div className="bg-emerald-500" style={{ width: `${s.bullish}%` }} />
                          <div className="bg-gray-400" style={{ width: `${s.neutral}%` }} />
                          <div className="bg-red-500" style={{ width: `${s.bearish}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="flex items-center justify-center gap-1 text-emerald-500">
                          <ThumbsUp className="h-3 w-3" /> {s.bullish}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="flex items-center justify-center gap-1 text-red-500">
                          <ThumbsDown className="h-3 w-3" /> {s.bearish}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {s.mentions.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {s.trend === 'up' ? (
                          <TrendingUp className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="mx-auto h-4 w-4 text-red-500" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sector Sentiment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sector Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { sector: 'Tech', score: 72 },
              { sector: 'Health', score: 55 },
              { sector: 'Finance', score: 48 },
              { sector: 'Energy', score: 35 },
              { sector: 'Consumer', score: 60 },
              { sector: 'Industrial', score: 52 },
              { sector: 'Real Est.', score: 28 },
              { sector: 'Utilities', score: 40 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [Number(v), 'Sentiment Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {[72, 55, 48, 35, 60, 52, 28, 40].map((v, i) => (
                  <Cell key={i} fill={v >= 60 ? '#10b981' : v >= 45 ? '#3b82f6' : v >= 30 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
