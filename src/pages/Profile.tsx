import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import {
  User, Mail, Shield, Calendar, CreditCard, TrendingUp,
  Briefcase, Clock, Award, Save,
} from 'lucide-react'
import { toast } from 'sonner'

export function Profile() {
  const { user } = useAuth()
  const { holdings, totals } = usePortfolioContext()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  const handleSave = () => {
    toast.success('Profile updated successfully')
  }

  const memberSince = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A'

  const stats = [
    { icon: Briefcase, label: 'Positions', value: holdings.length.toString() },
    { icon: TrendingUp, label: 'Portfolio Value', value: `$${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
    { icon: Award, label: 'Win Rate', value: holdings.length > 0 ? `${((totals.winners / holdings.length) * 100).toFixed(0)}%` : '—' },
    { icon: Clock, label: 'Member Since', value: memberSince },
  ]

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <User className="h-5 w-5" />
        Account Profile
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center py-8">
              <Avatar className="mb-4 h-20 w-20">
                <AvatarFallback className="text-2xl">{user?.avatar ?? 'U'}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    color: user?.plan === 'enterprise' ? '#f59e0b' : user?.plan === 'pro' ? '#3b82f6' : '#6b7280',
                    borderColor: user?.plan === 'enterprise' ? '#f59e0b' : user?.plan === 'pro' ? '#3b82f6' : '#6b7280',
                  }}
                >
                  {user?.plan?.toUpperCase()} Plan
                </Badge>
                <Badge variant="outline" className="text-xs text-emerald-500">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <s.icon className="h-4 w-4" />
                    {s.label}
                  </div>
                  <span className="text-sm font-medium">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Edit form */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Full Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    Email Address
                  </label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <Button size="sm" className="gap-1 text-xs" onClick={handleSave}>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Subscription Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['free', 'pro', 'enterprise'] as const).map((plan) => {
                  const isActive = user?.plan === plan
                  const config = {
                    free: { price: '$0/mo', features: ['5 Watchlist Symbols', 'Basic Charts', 'Delayed Data'] },
                    pro: { price: '$29/mo', features: ['Unlimited Symbols', 'Advanced Charts', 'Real-time Data', 'AI Agent'] },
                    enterprise: { price: '$99/mo', features: ['Everything in Pro', 'Strategy Builder', 'Priority Support', 'Custom Alerts'] },
                  }
                  const c = config[plan]
                  return (
                    <div
                      key={plan}
                      className="rounded-lg border p-4"
                      style={{
                        borderColor: isActive ? (plan === 'enterprise' ? '#f59e0b' : plan === 'pro' ? '#3b82f6' : 'var(--border)') : 'var(--border)',
                        backgroundColor: isActive ? 'var(--accent)' : undefined,
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold capitalize">{plan}</span>
                        {isActive && <Badge variant="secondary" className="h-5 text-xs">Current</Badge>}
                      </div>
                      <p className="mb-3 text-lg font-bold">{c.price}</p>
                      <ul className="space-y-1">
                        {c.features.map((f) => (
                          <li key={f} className="text-xs text-muted-foreground">• {f}</li>
                        ))}
                      </ul>
                      {!isActive && (
                        <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
                          Upgrade
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Change
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sessions</p>
                  <p className="text-xs text-muted-foreground">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    1 active session
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  <CreditCard className="mr-1 h-3.5 w-3.5" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
