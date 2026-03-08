import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { Grid3X3, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateCorrelations(symbols: string[]) {
  const n = symbols.length
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const rand = seededRandom(
    symbols.reduce((s, sym) => s + sym.charCodeAt(0) * 31 + sym.charCodeAt(1), 0),
  )

  // Known sector relationships for realism
  const techSymbols = new Set(['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD', 'CRWD', 'SNOW', 'ARM', 'SMCI', 'PLTR'])
  const finSymbols = new Set(['JPM', 'GS', 'BAC', 'V', 'MA', 'SOFI', 'COIN', 'SQ'])

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1
    for (let j = i + 1; j < n; j++) {
      let base = rand() * 0.8 - 0.1 // -0.1 to 0.7

      // Boost correlation for same-sector stocks
      const bothTech = techSymbols.has(symbols[i]) && techSymbols.has(symbols[j])
      const bothFin = finSymbols.has(symbols[i]) && finSymbols.has(symbols[j])
      if (bothTech) base = 0.5 + rand() * 0.4 // 0.5 to 0.9
      if (bothFin) base = 0.45 + rand() * 0.4

      // TSLA is more volatile / less correlated
      if (symbols[i] === 'TSLA' || symbols[j] === 'TSLA') {
        base = base * 0.6
      }

      const corr = Math.round(base * 100) / 100
      matrix[i][j] = corr
      matrix[j][i] = corr
    }
  }
  return matrix
}

function corrColor(v: number): string {
  if (v >= 0.8) return '#059669'
  if (v >= 0.6) return '#10b981'
  if (v >= 0.4) return '#34d399'
  if (v >= 0.2) return '#6ee7b7'
  if (v >= 0) return '#d1fae5'
  if (v >= -0.2) return '#fecaca'
  if (v >= -0.4) return '#f87171'
  return '#dc2626'
}

function corrTextColor(v: number): string {
  if (Math.abs(v) >= 0.6 || v === 1) return '#ffffff'
  return '#1f2937'
}

export function CorrelationMatrix() {
  const { holdings } = usePortfolioContext()
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings])
  const matrix = useMemo(() => generateCorrelations(symbols), [symbols])

  const avgCorr = useMemo(() => {
    if (symbols.length < 2) return 0
    let sum = 0
    let count = 0
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        sum += matrix[i][j]
        count++
      }
    }
    return count > 0 ? sum / count : 0
  }, [matrix, symbols])

  const highCorrs = useMemo(() => {
    const pairs: { a: string; b: string; corr: number }[] = []
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        pairs.push({ a: symbols[i], b: symbols[j], corr: matrix[i][j] })
      }
    }
    return pairs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr)).slice(0, 5)
  }, [matrix, symbols])

  const lowCorrs = useMemo(() => {
    const pairs: { a: string; b: string; corr: number }[] = []
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        pairs.push({ a: symbols[i], b: symbols[j], corr: matrix[i][j] })
      }
    }
    return pairs.sort((a, b) => a.corr - b.corr).slice(0, 5)
  }, [matrix, symbols])

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Grid3X3 className="h-5 w-5" />
        Correlation Matrix
      </h2>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <Minus className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average Correlation</p>
              <p className="text-lg font-bold" style={{ color: avgCorr > 0.5 ? '#f59e0b' : '#10b981' }}>
                {avgCorr.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {avgCorr > 0.6 ? 'High — consider diversifying' : avgCorr > 0.3 ? 'Moderate diversification' : 'Well diversified'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Most Correlated</p>
              {highCorrs[0] && (
                <>
                  <p className="text-sm font-bold">{highCorrs[0].a} / {highCorrs[0].b}</p>
                  <p className="text-xs font-medium text-emerald-500">{highCorrs[0].corr.toFixed(2)}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Least Correlated</p>
              {lowCorrs[0] && (
                <>
                  <p className="text-sm font-bold">{lowCorrs[0].a} / {lowCorrs[0].b}</p>
                  <p className="text-xs font-medium text-red-500">{lowCorrs[0].corr.toFixed(2)}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Matrix */}
      {symbols.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pairwise Correlation Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1.5 text-left font-medium text-muted-foreground" />
                  {symbols.map((s) => (
                    <th key={s} className="p-1.5 text-center font-medium" style={{ minWidth: 48 }}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {symbols.map((rowSym, i) => (
                  <tr key={rowSym}>
                    <td className="p-1.5 font-medium">{rowSym}</td>
                    {symbols.map((_, j) => {
                      const v = matrix[i][j]
                      return (
                        <td
                          key={j}
                          className="p-1.5 text-center font-mono font-medium"
                          style={{
                            backgroundColor: corrColor(v),
                            color: corrTextColor(v),
                            minWidth: 48,
                            borderRadius: 4,
                          }}
                          title={`${rowSym} vs ${symbols[j]}: ${v.toFixed(2)}`}
                        >
                          {v === 1 ? '1.00' : v.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <span>-1.0</span>
              <div className="flex h-3 flex-1 rounded" style={{
                background: 'linear-gradient(to right, #dc2626, #f87171, #fecaca, #d1fae5, #6ee7b7, #34d399, #10b981, #059669)',
              }} />
              <span>+1.0</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Add holdings to see correlation analysis
          </CardContent>
        </Card>
      )}

      {/* Top Pairs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Highest Correlations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {highCorrs.map((p) => (
              <div key={`${p.a}-${p.b}`} className="flex items-center justify-between">
                <span className="text-sm">
                  <span className="font-medium">{p.a}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="font-medium">{p.b}</span>
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-xs"
                  style={{
                    color: p.corr > 0.7 ? '#f59e0b' : '#10b981',
                    borderColor: p.corr > 0.7 ? '#f59e0b' : '#10b981',
                  }}
                >
                  {p.corr.toFixed(2)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lowest Correlations (Best Diversifiers)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowCorrs.map((p) => (
              <div key={`${p.a}-${p.b}`} className="flex items-center justify-between">
                <span className="text-sm">
                  <span className="font-medium">{p.a}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="font-medium">{p.b}</span>
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-xs"
                  style={{
                    color: p.corr < 0 ? '#3b82f6' : '#10b981',
                    borderColor: p.corr < 0 ? '#3b82f6' : '#10b981',
                  }}
                >
                  {p.corr.toFixed(2)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Diversification Tips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Diversification Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {avgCorr > 0.6 && (
            <p>Your portfolio has high average correlation ({avgCorr.toFixed(2)}). Consider adding assets from different sectors, fixed income, or commodities to reduce systematic risk.</p>
          )}
          {avgCorr <= 0.6 && avgCorr > 0.3 && (
            <p>Moderate diversification ({avgCorr.toFixed(2)} average correlation). Adding uncorrelated assets like bonds, REITs, or international equities could further reduce portfolio volatility.</p>
          )}
          {avgCorr <= 0.3 && (
            <p>Well-diversified portfolio ({avgCorr.toFixed(2)} average correlation). Your holdings show low co-movement, which helps reduce drawdowns during market stress.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {highCorrs.filter((p) => p.corr > 0.7).map((p) => (
              <Badge key={`${p.a}-${p.b}`} variant="outline" className="text-xs" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>
                {p.a}/{p.b} highly correlated ({p.corr.toFixed(2)})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
