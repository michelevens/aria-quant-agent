import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/contexts/ThemeContext'

export function Toaster() {
  const { resolved } = useTheme()

  return (
    <Sonner
      theme={resolved as 'light' | 'dark'}
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--card-foreground))',
          fontSize: '13px',
        },
      }}
      closeButton
      richColors
    />
  )
}
