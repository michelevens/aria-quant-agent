import { useRef, useState, useEffect } from 'react'

/**
 * Returns a CSS class name ('tick-up' | 'tick-down' | '') that briefly flashes
 * when the price changes between renders.
 */
export function usePriceTick(price: number): string {
  const prevRef = useRef(price)
  const [tickClass, setTickClass] = useState('')

  useEffect(() => {
    if (prevRef.current !== price) {
      setTickClass(price > prevRef.current ? 'tick-up' : 'tick-down')
      prevRef.current = price
      const timer = setTimeout(() => setTickClass(''), 800)
      return () => clearTimeout(timer)
    }
  }, [price])

  return tickClass
}
