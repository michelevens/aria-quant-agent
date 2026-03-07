import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { Bot, Loader2, TrendingUp, Shield, Brain, Zap, LineChart, BarChart3, Briefcase, Bell } from 'lucide-react'

export function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = mode === 'login'
      ? await login(email, password)
      : await register(name, email, password)

    setLoading(false)
    if (success) {
      navigate('/')
    } else {
      setError('Invalid credentials')
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    await login('demo@ariaquant.com', 'demo123')
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        {/* Left: Branding */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Aria Quant</h1>
                <div className="mx-1 h-6 w-px bg-border" />
                <div>
                  <p className="font-bold tracking-tight" style={{ color: '#d4a017', fontSize: '11px' }}>Acsyom</p>
                  <p style={{ color: '#c49a15', fontSize: '9px' }}>Analytics</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">AI-Powered Trading Agent</p>
            </div>
          </div>

          <p className="text-muted-foreground">
            Institutional-grade quantitative analysis, real-time market intelligence,
            and AI-driven trading signals — all in one platform.
          </p>

          <div className="space-y-3">
            <Feature icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} text="Real-time portfolio tracking with live Yahoo Finance data" />
            <Feature icon={<Brain className="h-4 w-4 text-blue-500" />} text="7-factor quant engine: RSI, MACD, Bollinger, MA, Stochastic, Volume, Trend" />
            <Feature icon={<Shield className="h-4 w-4 text-yellow-500" />} text="Risk analytics: Sharpe, Sortino, VaR, Beta, Alpha, Correlation" />
            <Feature icon={<Zap className="h-4 w-4 text-purple-500" />} text="Paper trading, backtesting, and AI-generated signals" />
            <Feature icon={<LineChart className="h-4 w-4 text-cyan-500" />} text="Candlestick charts with drawing tools, Fibonacci, and overlays" />
            <Feature icon={<BarChart3 className="h-4 w-4 text-orange-500" />} text="Performance analytics, sector heat maps, and trade journal" />
            <Feature icon={<Briefcase className="h-4 w-4 text-rose-500" />} text="Options chain with Greeks, advanced orders (bracket, OCO, trailing)" />
            <Feature icon={<Bell className="h-4 w-4 text-green-500" />} text="Price alerts, stock screener, and command palette (Ctrl+K)" />
          </div>

          <div className="flex flex-wrap gap-2">
            {['Yahoo Finance', 'Alpha Vantage', 'Finnhub', 'Real-time', '16+ Pages', 'Dark/Light Mode'].map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>

        {/* Right: Auth Form */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <Badge variant="outline" className="text-xs">Beta</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'login' ? 'Sign in to your trading dashboard' : 'Start your quant trading journey'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Full Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="h-9" required />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader@example.com" className="h-9" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="h-9" required />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
            </div>

            <Button variant="outline" className="w-full gap-2 text-sm" onClick={handleDemo} disabled={loading}>
              <Bot className="h-4 w-4" /> Try Demo Account
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {mode === 'login' ? (
                <>No account?{' '}<button className="text-primary underline" onClick={() => setMode('register')}>Sign up</button></>
              ) : (
                <>Already have an account?{' '}<button className="text-primary underline" onClick={() => setMode('login')}>Sign in</button></>
              )}
            </p>

            <p className="text-center text-xs text-muted-foreground">Demo: demo@ariaquant.com / demo123</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent">{icon}</div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}
