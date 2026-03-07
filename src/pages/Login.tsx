import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import {
  Bot, Loader2, TrendingUp, Shield, Brain, Zap, LineChart, BarChart3,
  Briefcase, Bell, LogIn, Eye, EyeOff, CheckCircle2, Smartphone, Globe,
} from 'lucide-react'

const features = [
  { icon: TrendingUp, title: 'Real-time Portfolio', desc: 'Live Yahoo Finance data with 30s auto-refresh' },
  { icon: Brain, title: '7-Factor Quant Engine', desc: 'RSI, MACD, Bollinger, MA, Stochastic, Volume, Trend' },
  { icon: Shield, title: 'Risk Analytics', desc: 'Sharpe, Sortino, VaR, Beta, Alpha, Max Drawdown' },
  { icon: Zap, title: 'AI Trading Agent', desc: 'Multi-strategy analysis with portfolio insights' },
  { icon: LineChart, title: 'Advanced Charts', desc: 'Candlesticks, drawing tools, Fibonacci, overlays' },
  { icon: Briefcase, title: 'Paper Trading', desc: 'Bracket, OCO, trailing stop with full order book' },
]

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(email, password)

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
    <div
      className="flex min-h-screen"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,160,23,0.12), transparent), #030712',
      }}
    >
      {/* Left: Branded Hero Panel */}
      <div className="hidden items-center justify-center overflow-hidden p-12 lg:flex lg:w-1/2" style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 60% at 30% 50%, rgba(212,160,23,0.15), transparent)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '32rem' }}>
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #d4a017, #b8860b)' }}
            >
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">Aria Quant</span>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: '#d4a017', fontSize: '11px' }}>Acsyom</span>
                <span style={{ color: '#c49a15', fontSize: '9px' }}>Analytics</span>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">
            Quantitative Trading,{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #f0c040, #d4a017)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Democratized
            </span>
          </h1>
          <p className="mb-10 text-lg" style={{ color: '#94a3b8' }}>
            Institutional-grade analysis, real-time market intelligence, and AI-driven trading signals — all in one platform built for modern traders.
          </p>

          {/* Feature highlights */}
          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: 'rgba(212,160,23,0.12)',
                    border: '1px solid rgba(212,160,23,0.2)',
                  }}
                >
                  <f.icon className="h-5 w-5" style={{ color: '#f0c040' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex items-center gap-6 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <TrustBadge icon={<Globe className="h-4 w-4" />} text="Yahoo Finance" />
            <TrustBadge icon={<BarChart3 className="h-4 w-4" />} text="Alpha Vantage" />
            <TrustBadge icon={<Smartphone className="h-4 w-4" />} text="Responsive" />
            <TrustBadge icon={<CheckCircle2 className="h-4 w-4" style={{ color: '#4ade80' }} />} text="16+ Pages" />
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #d4a017, #b8860b)' }}
            >
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-white">Aria Quant</span>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
                Sign in to your trading dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="border-0 text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="border-0 pr-10 text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 flex h-full items-center px-3"
                    style={{ color: '#6b7280' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #d4a017, #b8860b)',
                  boxShadow: '0 0 30px rgba(212,160,23,0.3)',
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Sign In
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium" style={{ color: '#f0c040' }}>
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Demo Account Card */}
          <div
            className="mt-6 rounded-2xl p-6"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">Demo Account</h3>
              <p className="mt-0.5 text-xs" style={{ color: '#6b7280' }}>
                Click to explore the full platform instantly
              </p>
            </div>
            <button
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all"
              style={{
                backgroundColor: 'rgba(212,160,23,0.06)',
                border: '1px solid rgba(212,160,23,0.15)',
              }}
              onClick={handleDemo}
              disabled={loading}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(212,160,23,0.15)', color: '#f0c040' }}
              >
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">Demo Trader</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  demo@ariaquant.com — Full access to all 16 pages
                </p>
              </div>
              <Bell className="ml-auto h-4 w-4" style={{ color: '#d4a017' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom-right tagline */}
      <div className="fixed bottom-4 right-4 text-right">
        <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
          Algorithmic Risk &amp; Investment Agent
        </p>
        <p className="text-xs font-bold" style={{ color: '#d4a017' }}>
          By Acsyom Analytics
        </p>
      </div>
    </div>
  )
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
      {icon}
      <span className="text-xs font-medium">{text}</span>
    </div>
  )
}
