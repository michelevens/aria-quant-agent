import { useState, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Crown, Zap, Rocket, Check, X, ChevronDown, ChevronUp,
  LineChart, Bot, Shield, Search, TrendingUp, BarChart3, Gem,
} from 'lucide-react'
import { toast } from 'sonner'

type BillingCycle = 'monthly' | 'yearly'

interface PlanFeature {
  name: string
  starter: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

const FEATURE_CATEGORIES: { category: string; icon: React.ElementType; features: PlanFeature[] }[] = [
  {
    category: 'Market Data & Research',
    icon: LineChart,
    features: [
      { name: 'Real-time quotes & charts', starter: true, pro: true, enterprise: true },
      { name: 'Watchlists', starter: '5 lists', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'News feed', starter: true, pro: true, enterprise: true },
      { name: 'Forex & commodities', starter: true, pro: true, enterprise: true },
      { name: 'Crypto dashboard', starter: true, pro: true, enterprise: true },
      { name: 'Economic calendar', starter: true, pro: true, enterprise: true },
      { name: 'Earnings calendar', starter: true, pro: true, enterprise: true },
      { name: 'Market breadth', starter: false, pro: true, enterprise: true },
      { name: 'Sentiment dashboard', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Analysis & Screeners',
    icon: Search,
    features: [
      { name: 'Basic screener', starter: true, pro: true, enterprise: true },
      { name: 'ETF screener', starter: true, pro: true, enterprise: true },
      { name: 'Pro screener (advanced filters)', starter: false, pro: true, enterprise: true },
      { name: 'Financial statements', starter: 'Annual only', pro: 'Annual + Quarterly', enterprise: 'Annual + Quarterly' },
      { name: 'Analyst ratings & price targets', starter: false, pro: true, enterprise: true },
      { name: 'Fair value (DCF) analysis', starter: false, pro: true, enterprise: true },
      { name: 'Valuation ratios vs sector', starter: false, pro: true, enterprise: true },
      { name: 'Correlation matrix', starter: false, pro: true, enterprise: true },
      { name: 'Insider trades', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Trading & Portfolio',
    icon: TrendingUp,
    features: [
      { name: 'Paper trading', starter: true, pro: true, enterprise: true },
      { name: 'Portfolio tracking', starter: '1 portfolio', pro: '5 portfolios', enterprise: 'Unlimited' },
      { name: 'Order management', starter: true, pro: true, enterprise: true },
      { name: 'Performance attribution', starter: false, pro: true, enterprise: true },
      { name: 'Trade journal', starter: false, pro: true, enterprise: true },
      { name: 'Options chain viewer', starter: false, pro: true, enterprise: true },
      { name: 'Options flow tracker', starter: false, pro: true, enterprise: true },
      { name: 'Dark pool monitor', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'AI & Automation',
    icon: Bot,
    features: [
      { name: 'AI trading agent', starter: 'Basic', pro: 'Advanced', enterprise: 'Full autonomous' },
      { name: 'Signal dashboard', starter: '3 signals', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Signal marketplace access', starter: 'View only', pro: 'Subscribe (5)', enterprise: 'Unlimited + create' },
      { name: 'Strategy builder', starter: '1 strategy', pro: '10 strategies', enterprise: 'Unlimited' },
      { name: 'Backtesting engine', starter: '1 yr history', pro: '5 yr history', enterprise: '10 yr history' },
      { name: 'Monte Carlo simulation', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Risk & Alerts',
    icon: Shield,
    features: [
      { name: 'Risk dashboard', starter: 'Basic', pro: 'Full', enterprise: 'Full + custom' },
      { name: 'Price alerts', starter: '10 alerts', pro: '100 alerts', enterprise: 'Unlimited' },
      { name: 'Heat map', starter: true, pro: true, enterprise: true },
      { name: 'Social trading / leaderboard', starter: 'View only', pro: true, enterprise: true },
    ],
  },
  {
    category: 'Support & Extras',
    icon: Gem,
    features: [
      { name: 'Community access', starter: true, pro: true, enterprise: true },
      { name: 'Priority support', starter: false, pro: true, enterprise: true },
      { name: 'API access', starter: false, pro: false, enterprise: true },
      { name: 'Custom integrations', starter: false, pro: false, enterprise: true },
      { name: 'Dedicated account manager', starter: false, pro: false, enterprise: true },
    ],
  },
]

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Essential tools for new traders',
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    monthlyPrice: 25,
    yearlyPrice: 20,
    description: 'Advanced analytics & AI for serious traders',
    cta: 'Start 14-Day Free Trial',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Rocket,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    monthlyPrice: 75,
    yearlyPrice: 60,
    description: 'Full autonomy & unlimited everything',
    cta: 'Contact Sales',
    popular: false,
  },
]

const FAQ = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at your next billing cycle.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes, Pro comes with a 14-day free trial. No credit card required to start. You\'ll get full access to all Pro features during the trial period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for Enterprise plans.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. There are no long-term contracts. Cancel anytime from your Settings page and you\'ll retain access until the end of your billing period.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact support for a full refund.',
  },
  {
    q: 'Is my trading data secure?',
    a: 'Yes. All data is encrypted in transit and at rest. We never share your trading data or strategies with third parties. Your strategies and portfolio information remain private.',
  },
]

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-500 mx-auto" />
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
  return <span className="text-xs text-center block">{value}</span>
}

export function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>('yearly')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handleSubscribe = (planName: string) => {
    if (planName === 'Enterprise') {
      toast.info('Enterprise inquiries — contact sales@ariaquant.com')
    } else if (planName === 'Starter') {
      toast.success('You\'re already on the Starter plan!')
    } else {
      toast.success(`Starting 14-day free trial of ${planName}!`)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Choose Your Plan</h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          From free essentials to full autonomous trading — pick the plan that fits your strategy.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBilling('monthly')}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${billing === 'monthly' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling('yearly')}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${billing === 'yearly' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Yearly
          <Badge variant="outline" className="ml-1.5 text-[10px] text-emerald-500 border-emerald-500/30">Save 20%</Badge>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
          const Icon = plan.icon
          return (
            <Card
              key={plan.id}
              className={`relative transition-all ${plan.popular ? `border-2 ${plan.borderColor} shadow-lg` : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white text-[10px] px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg ${plan.bgColor}`}>
                  <Icon className={`h-5 w-5 ${plan.color}`} />
                </div>
                <CardTitle className="text-lg mt-2">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <span className="text-3xl font-bold">
                    {price === 0 ? 'Free' : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground">/mo</span>
                  )}
                  {billing === 'yearly' && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Billed ${price * 12}/year
                    </p>
                  )}
                </div>
                <Button
                  className={`w-full ${plan.popular ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.name)}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Feature Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[40%]">Feature</th>
                  <th className="text-center py-3 px-4 font-medium w-[20%]">
                    <span className="text-blue-500">Starter</span>
                  </th>
                  <th className="text-center py-3 px-4 font-medium w-[20%]">
                    <span className="text-amber-500">Pro</span>
                  </th>
                  <th className="text-center py-3 px-4 font-medium w-[20%]">
                    <span className="text-purple-500">Enterprise</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon
                  return (
                    <Fragment key={cat.category}>
                      <tr className="bg-accent/30">
                        <td colSpan={4} className="py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                          <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          {cat.category}
                        </td>
                      </tr>
                      {cat.features.map((f) => (
                        <tr key={f.name} className="border-b border-border/50 hover:bg-accent/20">
                          <td className="py-2.5 px-4 text-muted-foreground">{f.name}</td>
                          <td className="py-2.5 px-4"><FeatureCell value={f.starter} /></td>
                          <td className="py-2.5 px-4"><FeatureCell value={f.pro} /></td>
                          <td className="py-2.5 px-4"><FeatureCell value={f.enterprise} /></td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-center">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto space-y-2">
          {FAQ.map((item, i) => (
            <Card key={i}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <span className="text-sm font-medium">{item.q}</span>
                {expandedFaq === i ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {expandedFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground">
          All plans include a 30-day money-back guarantee. No questions asked.
        </p>
      </div>
    </div>
  )
}
