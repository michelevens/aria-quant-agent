import { useEffect, useState } from 'react'
import { fetchHistoricalData } from '@/services/marketData'

interface SparklineProps {
  symbol: string
  width?: number
  height?: number
}

export function Sparkline({ symbol, width = 80, height = 28 }: SparklineProps) {
  const [points, setPoints] = useState<string>('')
  const [isPositive, setIsPositive] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchHistoricalData(symbol, '5D')
      .then((bars) => {
        if (cancelled || bars.length < 2) return
        const closes = bars.map((b) => b.close)
        const min = Math.min(...closes)
        const max = Math.max(...closes)
        const range = max - min || 1
        const pad = 2

        const pts = closes.map((c, i) => {
          const x = pad + (i / (closes.length - 1)) * (width - pad * 2)
          const y = pad + (1 - (c - min) / range) * (height - pad * 2)
          return `${x},${y}`
        }).join(' ')

        setPoints(pts)
        setIsPositive(closes[closes.length - 1] >= closes[0])
      })
      .catch(() => { /* silent */ })

    return () => { cancelled = true }
  }, [symbol, width, height])

  if (!points) return <div style={{ width, height }} />

  const color = isPositive ? '#10b981' : '#ef4444'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
