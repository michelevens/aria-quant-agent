import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import {
  Bot, Loader2, UserPlus, Eye, EyeOff, CheckCircle2, Shield,
  TrendingUp, Brain, Zap, LineChart, Briefcase, RefreshCw,
  Smartphone, Copy, ArrowLeft,
} from 'lucide-react'

const features = [
  { icon: TrendingUp, title: 'Real-time Portfolio', desc: 'Live Yahoo Finance data with 30s auto-refresh' },
  { icon: Brain, title: '7-Factor Quant Engine', desc: 'RSI, MACD, Bollinger, MA, Stochastic, Volume, Trend' },
  { icon: Shield, title: 'Risk Analytics', desc: 'Sharpe, Sortino, VaR, Beta, Alpha, Max Drawdown' },
  { icon: Zap, title: 'AI Trading Agent', desc: 'Multi-strategy analysis with portfolio insights' },
  { icon: LineChart, title: 'Advanced Charts', desc: 'Candlesticks, drawing tools, Fibonacci, overlays' },
  { icon: Briefcase, title: 'Paper Trading', desc: 'Bracket, OCO, trailing stop with full order book' },
]

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
]

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)]
  }
  return secret.replace(/(.{4})/g, '$1 ').trim()
}

export function Register() {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'mfa'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  // MFA state
  const [mfaSecret] = useState(generateSecret)
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', ''])
  const [mfaError, setMfaError] = useState('')
  const [copied, setCopied] = useState(false)
  const [enableMfa, setEnableMfa] = useState(true)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const passwordValid = requirements.every((r) => r.test(password))
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const generateStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghjkmnpqrstuvwxyz'
    const digits = '23456789'
    const symbols = '!@#$%&*?'
    const all = upper + lower + digits + symbols
    let pw = ''
    pw += upper[Math.floor(Math.random() * upper.length)]
    pw += lower[Math.floor(Math.random() * lower.length)]
    pw += digits[Math.floor(Math.random() * digits.length)]
    pw += symbols[Math.floor(Math.random() * symbols.length)]
    for (let i = 4; i < 16; i++) {
      pw += all[Math.floor(Math.random() * all.length)]
    }
    const arr = pw.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    const generated = arr.join('')
    setPassword(generated)
    setConfirmPassword(generated)
    setShowPassword(true)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordValid) { setError('Password does not meet requirements'); return }
    if (!passwordsMatch) { setError('Passwords do not match'); return }
    if (!agreed) { setError('You must agree to the Terms of Service'); return }

    setStep('mfa')
  }

  const handleMfaDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...mfaCode]
    next[index] = value
    setMfaCode(next)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleMfaPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setMfaCode(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mfaSecret.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMfaSubmit = async () => {
    setMfaError('')

    if (enableMfa) {
      const code = mfaCode.join('')
      if (code.length !== 6) {
        setMfaError('Please enter all 6 digits')
        return
      }
    }

    setLoading(true)
    const success = await authRegister(name, email, password)
    setLoading(false)

    if (success) {
      navigate('/')
    } else {
      setMfaError('Registration failed. Please try again.')
    }
  }

  const handleSkipMfa = async () => {
    setLoading(true)
    const success = await authRegister(name, email, password)
    setLoading(false)
    if (success) navigate('/')
    else setMfaError('Registration failed.')
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

          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">
            {step === 'form' ? (
              <>Start Trading{' '}
                <span style={{ background: 'linear-gradient(to right, #f0c040, #d4a017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Smarter
                </span>
              </>
            ) : (
              <>Secure Your{' '}
                <span style={{ background: 'linear-gradient(to right, #f0c040, #d4a017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Account
                </span>
              </>
            )}
          </h1>
          <p className="mb-10 text-lg" style={{ color: '#94a3b8' }}>
            {step === 'form'
              ? 'Create your free account and get instant access to institutional-grade quantitative analysis tools.'
              : 'Enable two-factor authentication to protect your trading account with an extra layer of security.'}
          </p>

          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.2)' }}
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
        </div>
      </div>

      {/* Right: Form / MFA */}
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

          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <StepDot active={step === 'form'} done={step === 'mfa'} label="1" />
            <div className="h-px w-8" style={{ backgroundColor: step === 'mfa' ? '#d4a017' : 'rgba(255,255,255,0.1)' }} />
            <StepDot active={step === 'mfa'} done={false} label="2" />
          </div>

          {step === 'form' ? (
            /* ── Registration Form ── */
            <div
              className="rounded-2xl p-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
                <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
                  Join thousands of quantitative traders
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {error && (
                  <div
                    className="rounded-lg p-3 text-sm"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Full Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="border-0 text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}
                    required
                  />
                </div>

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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Password</label>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium transition-colors"
                      style={{ color: '#f0c040' }}
                      onClick={generateStrongPassword}
                    >
                      <RefreshCw className="h-3 w-3" /> Suggest Strong Password
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
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
                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {requirements.map((r) => (
                        <div key={r.label} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: r.test(password) ? '#4ade80' : '#4b5563' }} />
                          <span className="text-xs" style={{ color: r.test(password) ? '#4ade80' : '#6b7280' }}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Confirm Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="border-0 text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}
                    required
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs" style={{ color: '#f87171' }}>Passwords do not match</p>
                  )}
                  {passwordsMatch && (
                    <p className="flex items-center gap-1 text-xs" style={{ color: '#4ade80' }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                    </p>
                  )}
                </div>

                <label className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded"
                    style={{ accentColor: '#d4a017' }}
                  />
                  <span className="text-xs" style={{ color: '#6b7280' }}>
                    I agree to the{' '}
                    <span className="cursor-pointer font-medium" style={{ color: '#f0c040' }}>Terms of Service</span>
                    {' '}and{' '}
                    <span className="cursor-pointer font-medium" style={{ color: '#f0c040' }}>Privacy Policy</span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!passwordValid || !passwordsMatch || !agreed}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d4a017, #b8860b)', boxShadow: '0 0 30px rgba(212,160,23,0.3)' }}
                >
                  <UserPlus className="h-4 w-4" /> Continue
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium" style={{ color: '#f0c040' }}>Sign in</Link>
                </p>
              </div>
            </div>
          ) : (
            /* ── MFA Setup ── */
            <div
              className="rounded-2xl p-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                className="mb-4 flex items-center gap-1 text-sm transition-colors"
                style={{ color: '#6b7280' }}
                onClick={() => setStep('form')}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div className="mb-6 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.2)' }}
                >
                  <Shield className="h-7 w-7" style={{ color: '#f0c040' }} />
                </div>
                <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
                <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
                  Add an extra layer of security to your account
                </p>
              </div>

              {/* MFA toggle */}
              <label className="mb-6 flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5" style={{ color: '#f0c040' }} />
                  <div>
                    <p className="text-sm font-medium text-white">Enable MFA</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Authenticator app (TOTP)</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableMfa}
                  onChange={(e) => setEnableMfa(e.target.checked)}
                  className="h-5 w-5 rounded"
                  style={{ accentColor: '#d4a017' }}
                />
              </label>

              {enableMfa && (
                <div className="space-y-5">
                  {/* Step 1: QR placeholder */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-white">1. Scan QR Code</p>
                    <p className="mb-3 text-xs" style={{ color: '#6b7280' }}>
                      Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code below.
                    </p>
                    <div
                      className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl"
                      style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                    >
                      <div className="text-center">
                        <Shield className="mx-auto mb-1 h-8 w-8" style={{ color: '#1f2937' }} />
                        <p className="text-xs font-medium" style={{ color: '#374151' }}>QR Code</p>
                        <p style={{ color: '#6b7280', fontSize: '9px' }}>Demo Mode</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Manual key */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-white">2. Or enter key manually</p>
                    <div
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <code className="text-xs font-mono tracking-wider text-white">{mfaSecret}</code>
                      <button
                        type="button"
                        className="ml-2 shrink-0 transition-colors"
                        style={{ color: copied ? '#4ade80' : '#6b7280' }}
                        onClick={handleCopySecret}
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Enter code */}
                  <div>
                    <p className="mb-3 text-xs font-semibold text-white">3. Enter verification code</p>
                    <div className="flex justify-center gap-2" onPaste={handleMfaPaste}>
                      {mfaCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { inputRefs.current[i] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleMfaDigit(i, e.target.value)}
                          onKeyDown={(e) => handleMfaKeyDown(i, e)}
                          className="h-12 w-10 rounded-lg border-0 text-center text-lg font-bold text-white outline-none transition-all focus:ring-2"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.06)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mfaError && (
                <div
                  className="mt-4 rounded-lg p-3 text-sm"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  {mfaError}
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleMfaSubmit}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d4a017, #b8860b)', boxShadow: '0 0 30px rgba(212,160,23,0.3)' }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  {enableMfa ? 'Verify & Create Account' : 'Create Account'}
                </button>

                {enableMfa && (
                  <button
                    onClick={handleSkipMfa}
                    disabled={loading}
                    className="w-full py-2 text-sm transition-colors disabled:opacity-50"
                    style={{ color: '#6b7280' }}
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          )}
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

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  const bg = active
    ? 'linear-gradient(135deg, #d4a017, #b8860b)'
    : done
      ? 'rgba(212,160,23,0.3)'
      : 'rgba(255,255,255,0.08)'
  const border = active || done ? '2px solid #d4a017' : '2px solid rgba(255,255,255,0.1)'
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: bg, border, color: active || done ? '#fff' : '#6b7280' }}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : label}
    </div>
  )
}
