import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const DISMISSED_KEY = 'aria-disclaimer-dismissed'

export function DisclaimerBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="flex items-start gap-2 border-b border-border px-4 py-2 text-xs" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)' }}>
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: '#eab308' }} />
      <p className="flex-1 text-muted-foreground">
        <span className="font-semibold text-foreground">Risk Disclaimer:</span>{' '}
        Aria Quant is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or a solicitation to buy or sell securities. Trading involves substantial risk of loss. Past performance, simulated results, and AI-generated signals do not guarantee future returns. Always do your own research and consult a licensed financial advisor before making investment decisions. Market data may be delayed or inaccurate.
      </p>
      <button onClick={dismiss} className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-accent" title="Dismiss">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}
