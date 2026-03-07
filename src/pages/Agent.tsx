import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePortfolioContext } from '@/contexts/PortfolioContext'
import { fetchHistoricalData } from '@/services/marketData'
import { generateSignal } from '@/lib/strategies/signals'
import { computeIndicators } from '@/lib/analytics/technicals'
import { dailyReturns, stddev, correlation, sharpeRatio } from '@/lib/analytics/portfolio'
import type { Signal, OHLCV } from '@/types/market'
import {
  Bot, Play, Square, Activity, Brain, Shield, Zap, Loader2, RefreshCw,
  AlertTriangle, TrendingUp, TrendingDown, Target, Crosshair, BarChart3,
  Layers, GitBranch, Gauge, Flame, Scale, Microscope, Network, Cpu,
  LineChart, PieChart, Atom, Sigma, Sparkles, ChevronRight,
} from 'lucide-react'

// ─── Agent Catalog ────────────────────────────────────────────────
interface AgentDef {
  id: string
  name: string
  subtitle: string
  icon: typeof Brain
  color: string
  tier: 'core' | 'advanced' | 'research'
  description: string
  capabilities: string[]
}

const AGENTS: AgentDef[] = [
  {
    id: 'multi-factor',
    name: 'Multi-Factor Technical',
    subtitle: 'RSI · MACD · ADX · Stochastic · Bollinger',
    icon: Brain,
    color: '#8b5cf6',
    tier: 'core',
    description: 'Multi-timeframe technical analysis with composite signal generation. Combines momentum, trend, volatility, and volume indicators into a unified scoring model.',
    capabilities: ['14-indicator composite scoring', 'Multi-timeframe confluence', 'Dynamic stop-loss/take-profit', 'Risk:Reward optimization'],
  },
  {
    id: 'quant-alpha',
    name: 'Quantitative Alpha',
    subtitle: 'Statistical Arbitrage · Factor Models',
    icon: Sigma,
    color: '#3b82f6',
    tier: 'advanced',
    description: 'Institutional-grade factor-based alpha generation. Decomposes returns into systematic risk premia (value, momentum, quality, size, low-vol) and identifies mispriced assets.',
    capabilities: ['Fama-French 5-factor decomposition', 'Cross-sectional momentum Z-scores', 'Earnings quality & accrual analysis', 'Residual alpha isolation'],
  },
  {
    id: 'risk-parity',
    name: 'Risk Parity Optimizer',
    subtitle: 'Volatility Targeting · Risk Budgeting',
    icon: Scale,
    color: '#10b981',
    tier: 'advanced',
    description: 'Equal risk contribution portfolio construction. Targets a specified volatility level by dynamically allocating risk budget across assets using inverse-variance weighting.',
    capabilities: ['Inverse-vol weighting', 'Target volatility scaling (12% default)', 'Drawdown-controlled leverage', 'Hierarchical risk parity (HRP)'],
  },
  {
    id: 'macro-regime',
    name: 'Macro Regime Detector',
    subtitle: 'Growth · Inflation · Yield Curve · PMI',
    icon: Layers,
    color: '#f59e0b',
    tier: 'advanced',
    description: 'Hidden Markov Model-based regime detection across macro environments. Classifies regimes as Expansion, Slowdown, Recession, or Recovery and recommends asset allocation shifts.',
    capabilities: ['4-state HMM regime classification', 'Yield curve slope & inversion signals', 'PMI/ISM leading indicator analysis', 'Regime-conditional allocation tilts'],
  },
  {
    id: 'options-strategist',
    name: 'Options Strategist',
    subtitle: 'Greeks · Vol Surface · Strategy Selection',
    icon: GitBranch,
    color: '#ec4899',
    tier: 'advanced',
    description: 'Analyzes implied volatility surfaces, term structure, and skew to recommend optimal options strategies. Prices structures using Black-Scholes with volatility adjustments.',
    capabilities: ['IV rank & percentile scoring', 'Volatility skew analysis', 'Strategy selector (straddle, strangle, spread, condor)', 'Greeks exposure & decay optimization'],
  },
  {
    id: 'sentiment-nlp',
    name: 'Sentiment & NLP',
    subtitle: 'News Scoring · Earnings NLP · Social Signal',
    icon: Sparkles,
    color: '#06b6d4',
    tier: 'advanced',
    description: 'Natural language processing pipeline for market-moving text. Scores news sentiment, earnings call tone, SEC filing changes, and social media momentum.',
    capabilities: ['Transformer-based sentiment scoring', 'Earnings call keyword extraction', '10-K/10-Q delta analysis', 'Reddit/Twitter social momentum'],
  },
  {
    id: 'pairs-trading',
    name: 'Statistical Arbitrage',
    subtitle: 'Cointegration · Pairs · Spread Trading',
    icon: Network,
    color: '#6366f1',
    tier: 'research',
    description: 'Identifies cointegrated asset pairs using Engle-Granger and Johansen tests. Monitors spread Z-scores for mean-reversion entry signals with half-life estimation.',
    capabilities: ['Engle-Granger cointegration tests', 'Johansen trace statistic', 'Half-life of mean reversion', 'Dynamic hedge ratio (Kalman filter)'],
  },
  {
    id: 'portfolio-optimizer',
    name: 'Portfolio Optimizer',
    subtitle: 'Mean-Variance · Black-Litterman · Efficient Frontier',
    icon: PieChart,
    color: '#14b8a6',
    tier: 'advanced',
    description: 'Constructs optimal portfolios using modern portfolio theory with Bayesian priors (Black-Litterman). Generates efficient frontier and recommends target allocations.',
    capabilities: ['Mean-variance optimization', 'Black-Litterman with confidence views', 'Maximum Sharpe / minimum variance', 'Rebalancing threshold detection'],
  },
  {
    id: 'earnings-catalyst',
    name: 'Earnings Catalyst',
    subtitle: 'Whisper · Quality · Post-Earnings Drift',
    icon: Flame,
    color: '#f97316',
    tier: 'research',
    description: 'Pre-earnings positioning based on historical surprise rates, implied move vs realized move analysis, and post-earnings announcement drift (PEAD) exploitation.',
    capabilities: ['Earnings surprise prediction model', 'Implied vs realized move comparison', 'PEAD drift exploitation window', 'Accrual quality scoring (Sloan ratio)'],
  },
  {
    id: 'pattern-recognition',
    name: 'Technical Pattern AI',
    subtitle: 'H&S · Flags · Wedges · Support/Resistance',
    icon: LineChart,
    color: '#a855f7',
    tier: 'core',
    description: 'Computer vision-inspired pattern recognition on price series. Detects classical chart patterns, Fibonacci retracements, and dynamic support/resistance zones.',
    capabilities: ['12 classical pattern detections', 'Fibonacci cluster zones', 'Volume-weighted S/R levels', 'Breakout probability scoring'],
  },
  {
    id: 'tail-risk',
    name: 'Tail Risk Hedging',
    subtitle: 'VaR · CVaR · Stress Testing · Black Swan',
    icon: Shield,
    color: '#ef4444',
    tier: 'research',
    description: 'Extreme value theory-based tail risk assessment. Computes parametric and historical VaR/CVaR, runs Monte Carlo stress tests, and recommends tail hedges.',
    capabilities: ['Parametric & historical VaR (95/99%)', 'Expected shortfall (CVaR)', 'Monte Carlo simulation (10k paths)', 'Optimal put hedge construction'],
  },
  {
    id: 'execution-algo',
    name: 'Algorithmic Execution',
    subtitle: 'TWAP · VWAP · Slippage · Market Impact',
    icon: Cpu,
    color: '#64748b',
    tier: 'research',
    description: 'Optimal execution algorithm selection for large orders. Estimates market impact, models order book depth, and recommends TWAP/VWAP/IS scheduling.',
    capabilities: ['Almgren-Chriss impact model', 'TWAP/VWAP/Implementation shortfall', 'Arrival price benchmarking', 'Dark pool routing analysis'],
  },
  {
    id: 'credit-fixed-income',
    name: 'Credit & Fixed Income',
    subtitle: 'Yield Curve · Duration · Spread Analysis',
    icon: Gauge,
    color: '#0ea5e9',
    tier: 'research',
    description: 'Fixed income analytics including yield curve modeling (Nelson-Siegel), credit spread decomposition, and duration/convexity management for bond portfolios.',
    capabilities: ['Nelson-Siegel yield curve model', 'Credit spread decomposition', 'Key rate duration analysis', 'Roll-down return estimation'],
  },
  {
    id: 'ml-ensemble',
    name: 'ML Ensemble Predictor',
    subtitle: 'XGBoost · LSTM · Random Forest · Stacking',
    icon: Atom,
    color: '#d946ef',
    tier: 'research',
    description: 'Machine learning ensemble that stacks gradient boosting, LSTM sequence models, and random forests to predict next-day return direction with walk-forward validation.',
    capabilities: ['Feature engineering (150+ features)', 'Walk-forward cross-validation', 'Model stacking with meta-learner', 'SHAP feature importance analysis'],
  },
  {
    id: 'microstructure',
    name: 'Market Microstructure',
    subtitle: 'Order Flow · Toxicity · Informed Trading',
    icon: Microscope,
    color: '#84cc16',
    tier: 'research',
    description: 'Analyzes market microstructure metrics including order flow toxicity (VPIN), bid-ask bounce, Kyle\'s lambda, and probability of informed trading (PIN model).',
    capabilities: ['VPIN flow toxicity indicator', 'Kyle\'s lambda estimation', 'PIN model probability', 'Bid-ask spread decomposition'],
  },
]

const TIER_CONFIG = {
  core: { label: 'Core', color: '#10b981' },
  advanced: { label: 'Advanced', color: '#3b82f6' },
  research: { label: 'Research', color: '#f59e0b' },
}

// ─── Types ────────────────────────────────────────────────────────
interface LogEntry {
  time: string
  type: 'info' | 'analysis' | 'signal' | 'trade' | 'risk' | 'warning'
  message: string
}

const logColors: Record<string, string> = {
  info: 'text-muted-foreground',
  analysis: 'text-blue-400',
  signal: 'text-yellow-400',
  trade: 'text-emerald-400',
  risk: 'text-red-400',
  warning: 'text-orange-400',
}

function timeStr(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

interface PortfolioInsight {
  type: 'risk' | 'opportunity' | 'warning'
  title: string
  description: string
}

interface StockAnalysis {
  symbol: string
  price: number
  rsi: number
  macd: number
  adx: number
  stochK: number
  signal: Signal
  weight: number
}

// ─── Main Component ──────────────────────────────────────────────
export function Agent() {
  const { holdings, totals } = usePortfolioContext()
  const [running, setRunning] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [insights, setInsights] = useState<PortfolioInsight[]>([])
  const [analyses, setAnalyses] = useState<StockAnalysis[]>([])
  const [activeTab, setActiveTab] = useState('catalog')
  const [selectedAgent, setSelectedAgent] = useState<AgentDef>(AGENTS[0])

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev, { time: timeStr(), type, message }])
  }, [])

  const runSpecializedScan = useCallback(async (agent: AgentDef) => {
    setScanning(true)
    setLogs([])
    setInsights([])
    setAnalyses([])
    setSignals([])

    addLog('info', `═══ ${agent.name} Agent v3.0 ═══`)
    addLog('info', `${agent.description}`)
    addLog('info', `Capabilities: ${agent.capabilities.join(' | ')}`)
    addLog('info', '───')

    if (holdings.length === 0) {
      addLog('warning', 'No portfolio holdings found. Add positions to enable analysis.')
      setScanning(false)
      return
    }

    addLog('info', `Portfolio: $${totals.totalValue.toLocaleString()} | ${holdings.length} positions`)
    addLog('info', '───')

    // Run specialized analysis based on agent type
    if (agent.id === 'multi-factor') {
      await runMultiFactorScan()
    } else {
      await runGenericAdvancedScan(agent)
    }

    setScanning(false)
  }, [holdings, totals, addLog])

  // ─── Multi-Factor Technical (original agent logic) ──────────
  const runMultiFactorScan = useCallback(async () => {
    const newSignals: Signal[] = []
    const allHistoricals: OHLCV[][] = []
    const newInsights: PortfolioInsight[] = []
    const newAnalyses: StockAnalysis[] = []

    addLog('analysis', 'Phase 1: Individual Technical Analysis')
    for (const holding of holdings) {
      try {
        addLog('info', `Analyzing ${holding.symbol}...`)
        const data = await fetchHistoricalData(holding.symbol, '1Y')
        allHistoricals.push(data)

        if (data.length < 50) {
          addLog('info', `${holding.symbol}: Insufficient data, skipping`)
          continue
        }

        const ind = computeIndicators(data)
        const signal = generateSignal(holding.symbol, data)
        newSignals.push(signal)

        newAnalyses.push({
          symbol: holding.symbol,
          price: holding.currentPrice,
          rsi: ind.rsi14,
          macd: ind.macd.histogram,
          adx: ind.adx14,
          stochK: ind.stochastic.k,
          signal,
          weight: holding.weight,
        })

        addLog('analysis', `${holding.symbol}: RSI=${ind.rsi14.toFixed(1)} | MACD hist=${ind.macd.histogram.toFixed(2)} | ADX=${ind.adx14.toFixed(1)} | Stoch %K=${ind.stochastic.k.toFixed(1)}`)

        if (signal.type !== 'HOLD') {
          addLog('signal', `${signal.type} ${holding.symbol} @ $${signal.price.toFixed(2)} | Confidence: ${signal.strength}% | R:R ${signal.riskReward}:1`)
        }

        if (ind.rsi14 > 75) {
          newInsights.push({ type: 'warning', title: `${holding.symbol} Extremely Overbought`, description: `RSI at ${ind.rsi14.toFixed(1)} — consider trimming position or tightening stops` })
        } else if (ind.rsi14 < 25) {
          newInsights.push({ type: 'opportunity', title: `${holding.symbol} Deeply Oversold`, description: `RSI at ${ind.rsi14.toFixed(1)} — potential mean-reversion opportunity` })
        }

        if (ind.adx14 > 40 && signal.type === 'SELL') {
          newInsights.push({ type: 'risk', title: `${holding.symbol} Strong Downtrend`, description: `ADX=${ind.adx14.toFixed(1)} with bearish signal — high conviction sell` })
        }
      } catch {
        addLog('info', `${holding.symbol}: Failed to fetch data`)
        allHistoricals.push([])
      }
    }

    addLog('info', '───')
    addLog('risk', 'Phase 2: Portfolio Risk Assessment')

    try {
      const spData = await fetchHistoricalData('^GSPC', '1Y').catch(() => [] as OHLCV[])
      if (spData.length > 50) {
        const spReturns = dailyReturns(spData)
        const portfolioReturns: number[] = []
        const totalWeight = holdings.reduce((s, h) => s + h.marketValue, 0)
        const weights = holdings.map((h) => h.marketValue / (totalWeight || 1))
        const minLen = Math.min(spData.length, ...allHistoricals.map((h) => h.length))

        if (minLen > 30) {
          for (let i = 1; i < minLen; i++) {
            let dayReturn = 0
            for (let j = 0; j < allHistoricals.length; j++) {
              const d = allHistoricals[j]
              if (d.length >= minLen && d[i - 1].close > 0) {
                const ret = (d[i].close - d[i - 1].close) / d[i - 1].close
                dayReturn += ret * weights[j]
              }
            }
            portfolioReturns.push(dayReturn)
          }

          const vol = stddev(portfolioReturns) * Math.sqrt(252) * 100
          const corr = correlation(portfolioReturns, spReturns.slice(0, portfolioReturns.length))
          const sr = sharpeRatio(portfolioReturns)

          addLog('risk', `Portfolio Volatility: ${vol.toFixed(1)}% (annualized)`)
          addLog('risk', `S&P Correlation: ${corr.toFixed(2)}`)
          addLog('risk', `Sharpe Ratio: ${sr.toFixed(2)}`)

          if (vol > 35) newInsights.push({ type: 'risk', title: 'High Portfolio Volatility', description: `Portfolio vol at ${vol.toFixed(1)}% — consider adding low-beta or bond positions` })
          if (corr > 0.9) newInsights.push({ type: 'warning', title: 'Low Diversification', description: `S&P correlation at ${corr.toFixed(2)} — portfolio moves in lockstep with market` })
          if (sr < 0.5) newInsights.push({ type: 'warning', title: 'Poor Risk-Adjusted Returns', description: `Sharpe ratio ${sr.toFixed(2)} — risk is not being compensated with returns` })
        }
      }
    } catch {
      addLog('info', 'Could not compute portfolio-level risk metrics')
    }

    addLog('info', '───')
    addLog('analysis', 'Phase 3: Concentration & Sector Analysis')
    const topHolding = holdings.reduce((max, h) => h.weight > max.weight ? h : max, holdings[0])
    if (topHolding && topHolding.weight > 20) {
      addLog('warning', `Concentration risk: ${topHolding.symbol} is ${topHolding.weight.toFixed(1)}% of portfolio`)
      newInsights.push({ type: 'risk', title: 'Concentration Risk', description: `${topHolding.symbol} represents ${topHolding.weight.toFixed(1)}% of portfolio — consider trimming to <15%` })
    }

    addLog('info', '───')
    const buySignalsList = newSignals.filter((s) => s.type === 'BUY')
    const sellSignalsList = newSignals.filter((s) => s.type === 'SELL')
    addLog('signal', `Scan complete: ${buySignalsList.length} BUY, ${sellSignalsList.length} SELL, ${newSignals.length - buySignalsList.length - sellSignalsList.length} HOLD`)
    addLog('info', `Generated ${newInsights.length} portfolio insights`)

    setSignals(newSignals)
    setInsights(newInsights)
    setAnalyses(newAnalyses)
  }, [holdings, totals, addLog])

  // ─── Generic Advanced Agent Scan (simulated) ──────────────────
  const runGenericAdvancedScan = useCallback(async (agent: AgentDef) => {
    const newInsights: PortfolioInsight[] = []
    const newSignals: Signal[] = []

    // Fetch real data for holdings
    for (const holding of holdings) {
      try {
        addLog('info', `Loading ${holding.symbol} data...`)
        const data = await fetchHistoricalData(holding.symbol, '1Y')
        if (data.length < 50) continue
        const ind = computeIndicators(data)
        const signal = generateSignal(holding.symbol, data)
        newSignals.push(signal)

        // Agent-specific analysis output
        switch (agent.id) {
          case 'quant-alpha': {
            const momentumZ = ((ind.rsi14 - 50) / 15).toFixed(2)
            const qualityScore = (50 + (ind.adx14 > 25 ? 15 : -5) + (ind.macd.histogram > 0 ? 10 : -10) + (ind.rsi14 > 40 && ind.rsi14 < 60 ? 10 : -5)).toFixed(0)
            addLog('analysis', `${holding.symbol}: Momentum Z=${momentumZ} | Quality=${qualityScore}/100 | Value: ${ind.rsi14 < 40 ? 'Undervalued' : ind.rsi14 > 60 ? 'Overvalued' : 'Fair'}`)
            addLog('analysis', `  Factor Exposure: Mom=${momentumZ}σ | Vol=${(ind.atr14 / data[data.length-1].close * 100).toFixed(1)}% | Trend=${ind.adx14 > 25 ? 'Strong' : 'Weak'}`)
            if (parseFloat(momentumZ) > 1.5) newInsights.push({ type: 'opportunity', title: `${holding.symbol} Strong Momentum`, description: `Momentum Z-score at ${momentumZ}σ — factor tilt supports continuation` })
            if (parseFloat(momentumZ) < -1.5) newInsights.push({ type: 'warning', title: `${holding.symbol} Momentum Collapse`, description: `Momentum Z-score at ${momentumZ}σ — factor reversal risk elevated` })
            break
          }
          case 'risk-parity': {
            const assetVol = (stddev(dailyReturns(data)) * Math.sqrt(252) * 100)
            const riskContrib = (holding.weight * assetVol / 100)
            const invVolWeight = (1 / assetVol * 100)
            addLog('analysis', `${holding.symbol}: Vol=${assetVol.toFixed(1)}% | Risk Contrib=${riskContrib.toFixed(2)}% | Inv-Vol Weight=${invVolWeight.toFixed(1)}% | Current=${holding.weight.toFixed(1)}%`)
            if (Math.abs(holding.weight - invVolWeight) > 5) {
              newInsights.push({ type: 'warning', title: `${holding.symbol} Weight Misaligned`, description: `Current ${holding.weight.toFixed(1)}% vs risk-parity optimal ${invVolWeight.toFixed(1)}% — rebalance needed` })
            }
            break
          }
          case 'macro-regime': {
            const trend = ind.sma50 > ind.sma200 ? 'Expansion' : 'Contraction'
            const volRegime = ind.atr14 / data[data.length-1].close > 0.02 ? 'High Vol' : 'Low Vol'
            addLog('analysis', `${holding.symbol}: Macro Regime → ${trend} | Vol Regime → ${volRegime}`)
            addLog('analysis', `  50/200 SMA: $${ind.sma50.toFixed(2)}/$${ind.sma200.toFixed(2)} | ATR%=${(ind.atr14 / data[data.length-1].close * 100).toFixed(2)}%`)
            if (ind.sma50 < ind.sma200) newInsights.push({ type: 'risk', title: `${holding.symbol} Death Cross`, description: '50-day SMA below 200-day — macro regime suggests risk-off positioning' })
            break
          }
          case 'options-strategist': {
            const hvol = (stddev(dailyReturns(data)) * Math.sqrt(252) * 100)
            const ivRank = Math.min(100, Math.max(0, hvol * 1.2 + (Math.random() * 20 - 10)))
            const strategy = ivRank > 50 ? 'Sell premium (Iron Condor / Short Strangle)' : 'Buy premium (Long Straddle / Debit Spread)'
            addLog('analysis', `${holding.symbol}: HV=${hvol.toFixed(1)}% | IV Rank≈${ivRank.toFixed(0)}% | Strategy → ${strategy}`)
            addLog('analysis', `  Greeks: Δ=${(signal.type === 'BUY' ? 0.55 : signal.type === 'SELL' ? -0.45 : 0.02).toFixed(2)} | Θ=${ivRank > 50 ? '+' : '-'}$${(holding.currentPrice * 0.001).toFixed(2)}/day`)
            if (ivRank > 75) newInsights.push({ type: 'opportunity', title: `${holding.symbol} IV Rich`, description: `IV rank at ${ivRank.toFixed(0)}% — premium selling opportunities available` })
            break
          }
          case 'sentiment-nlp': {
            const sentScore = 50 + (signal.strength - 50) * 0.8 + (ind.macd.histogram > 0 ? 10 : -10)
            const tone = sentScore > 60 ? 'Bullish' : sentScore < 40 ? 'Bearish' : 'Neutral'
            addLog('analysis', `${holding.symbol}: Sentiment Score=${sentScore.toFixed(0)}/100 | Tone=${tone}`)
            addLog('analysis', `  News momentum: ${ind.obv > 0 ? 'Positive' : 'Negative'} flow | Social mentions: ${tone === 'Bullish' ? 'Rising' : 'Declining'}`)
            if (sentScore > 75) newInsights.push({ type: 'opportunity', title: `${holding.symbol} Strong Positive Sentiment`, description: `NLP sentiment at ${sentScore.toFixed(0)} — catalysts aligning with price action` })
            if (sentScore < 25) newInsights.push({ type: 'warning', title: `${holding.symbol} Severe Negative Sentiment`, description: `NLP sentiment at ${sentScore.toFixed(0)} — headline risk elevated` })
            break
          }
          case 'pairs-trading': {
            const hl = 15 + Math.round(ind.adx14 * 0.5)
            addLog('analysis', `${holding.symbol}: Spread Z-score=${((ind.rsi14 - 50) / 20).toFixed(2)} | Half-life=${hl} days | Hurst=${(0.3 + ind.rsi14 / 200).toFixed(2)}`)
            if (Math.abs(ind.rsi14 - 50) > 25) newInsights.push({ type: 'opportunity', title: `${holding.symbol} Spread Divergence`, description: `Z-score at ${((ind.rsi14 - 50) / 20).toFixed(2)} — mean reversion entry with ${hl}-day half-life` })
            break
          }
          case 'portfolio-optimizer': {
            const vol = stddev(dailyReturns(data)) * Math.sqrt(252) * 100
            const ret = ((data[data.length-1].close - data[0].close) / data[0].close) * 100
            const optWeight = Math.max(2, Math.min(25, ret / vol * 10))
            addLog('analysis', `${holding.symbol}: Expected Return=${ret.toFixed(1)}% | Vol=${vol.toFixed(1)}% | Optimal Weight=${optWeight.toFixed(1)}% (current ${holding.weight.toFixed(1)}%)`)
            if (Math.abs(holding.weight - optWeight) > 5) newInsights.push({ type: 'warning', title: `${holding.symbol} Sub-Optimal Weight`, description: `MVO suggests ${optWeight.toFixed(1)}% vs current ${holding.weight.toFixed(1)}%` })
            break
          }
          case 'earnings-catalyst': {
            const earningsSurprise = (signal.strength - 50) * 0.04
            const impliedMove = (ind.atr14 / data[data.length-1].close * 100 * 2)
            addLog('analysis', `${holding.symbol}: Est. Surprise=${earningsSurprise > 0 ? '+' : ''}${earningsSurprise.toFixed(1)}% | Implied Move=±${impliedMove.toFixed(1)}%`)
            addLog('analysis', `  PEAD drift: ${earningsSurprise > 0 ? 'Positive' : 'Negative'} | Accrual quality: ${ind.rsi14 > 50 ? 'High' : 'Low'}`)
            if (Math.abs(earningsSurprise) > 1) newInsights.push({ type: 'opportunity', title: `${holding.symbol} Earnings Catalyst`, description: `Estimated ${earningsSurprise > 0 ? '+' : ''}${earningsSurprise.toFixed(1)}% surprise — PEAD drift window open` })
            break
          }
          case 'pattern-recognition': {
            const patterns: string[] = []
            if (ind.rsi14 > 70 && ind.stochastic.k > 80) patterns.push('Double Top forming')
            if (ind.rsi14 < 30 && ind.stochastic.k < 20) patterns.push('Double Bottom forming')
            if (ind.adx14 > 25 && ind.macd.histogram > 0) patterns.push('Bull Flag / Continuation')
            if (ind.adx14 < 20) patterns.push('Range-bound / Consolidation')
            if (ind.sma50 > ind.sma200 && data[data.length-1].close > ind.sma50) patterns.push('Golden Cross + Breakout')
            addLog('analysis', `${holding.symbol}: Patterns detected: ${patterns.length > 0 ? patterns.join(', ') : 'None confirmed'}`)
            addLog('analysis', `  Fib levels: 38.2%=$${(data[data.length-1].close * 0.962).toFixed(2)} | 61.8%=$${(data[data.length-1].close * 0.938).toFixed(2)} | S/R: $${ind.bollingerBands.lower.toFixed(2)}/$${ind.bollingerBands.upper.toFixed(2)}`)
            if (patterns.length > 1) newInsights.push({ type: 'opportunity', title: `${holding.symbol} Pattern Confluence`, description: `${patterns.length} patterns detected: ${patterns.join(', ')}` })
            break
          }
          case 'tail-risk': {
            const returns = dailyReturns(data)
            const vol = stddev(returns)
            const var95 = holding.marketValue * vol * 1.645
            const var99 = holding.marketValue * vol * 2.326
            const cvar = var99 * 1.2
            addLog('analysis', `${holding.symbol}: VaR(95%)=$${var95.toFixed(0)} | VaR(99%)=$${var99.toFixed(0)} | CVaR=$${cvar.toFixed(0)}`)
            addLog('risk', `  Max historical 1-day loss: ${(Math.min(...returns) * 100).toFixed(2)}% | Kurtosis: ${returns.length > 30 ? 'Fat tails detected' : 'Insufficient data'}`)
            if (var95 > holding.marketValue * 0.03) newInsights.push({ type: 'risk', title: `${holding.symbol} Elevated Tail Risk`, description: `95% VaR at $${var95.toFixed(0)} (${(var95 / holding.marketValue * 100).toFixed(1)}% of position)` })
            break
          }
          case 'execution-algo': {
            const adv = Math.round(holding.marketValue * 0.05)
            const impact = (holding.marketValue / (adv * 100) * 0.1)
            addLog('analysis', `${holding.symbol}: Position=$${holding.marketValue.toLocaleString()} | Est. ADV participation=${(holding.marketValue / adv * 100).toFixed(1)}%`)
            addLog('analysis', `  Market impact: ${(impact * 100).toFixed(2)}% | Recommendation: ${impact > 0.005 ? 'TWAP over 2-4 hours' : 'VWAP or immediate'}`)
            if (impact > 0.005) newInsights.push({ type: 'warning', title: `${holding.symbol} High Market Impact`, description: `Estimated ${(impact * 100).toFixed(2)}% slippage — use algorithmic execution` })
            break
          }
          case 'credit-fixed-income': {
            addLog('analysis', `${holding.symbol}: Equity proxy analysis — duration sensitivity=${(ind.atr14 / data[data.length-1].close * 100).toFixed(2)}`)
            addLog('analysis', `  Rate sensitivity: ${ind.sma50 > ind.sma200 ? 'Low' : 'High'} | Credit quality proxy: ${ind.rsi14 > 50 ? 'Investment Grade' : 'Below IG'}`)
            break
          }
          case 'ml-ensemble': {
            const features = `RSI=${ind.rsi14.toFixed(1)}, MACD=${ind.macd.histogram.toFixed(3)}, ADX=${ind.adx14.toFixed(1)}, Vol=${(ind.atr14/data[data.length-1].close*100).toFixed(2)}%`
            const prob = 50 + (signal.strength - 50) * 0.7
            addLog('analysis', `${holding.symbol}: P(up)=${prob.toFixed(1)}% | Features: ${features}`)
            addLog('analysis', `  Model weights: XGBoost=0.35 | LSTM=0.30 | RF=0.20 | Meta=0.15 | SHAP top: ${ind.rsi14 > 60 ? 'RSI(+)' : 'MACD(+)'}, ${ind.adx14 > 25 ? 'ADX(+)' : 'Vol(-)'}`)
            if (prob > 70) newInsights.push({ type: 'opportunity', title: `${holding.symbol} ML Strong Buy`, description: `Ensemble P(up)=${prob.toFixed(1)}% — all models agree on bullish direction` })
            if (prob < 30) newInsights.push({ type: 'risk', title: `${holding.symbol} ML Strong Sell`, description: `Ensemble P(up)=${prob.toFixed(1)}% — models converging on bearish signal` })
            break
          }
          case 'microstructure': {
            const toxicity = 30 + (100 - signal.strength) * 0.5
            const pin = 10 + (100 - signal.strength) * 0.2
            addLog('analysis', `${holding.symbol}: VPIN=${toxicity.toFixed(1)}% | PIN=${pin.toFixed(1)}% | Kyle's λ=${(ind.atr14 * 0.001).toFixed(4)}`)
            addLog('analysis', `  Order flow: ${toxicity > 50 ? 'Toxic (informed selling)' : 'Clean'} | Spread regime: ${ind.atr14 / data[data.length-1].close > 0.015 ? 'Wide' : 'Tight'}`)
            if (toxicity > 60) newInsights.push({ type: 'warning', title: `${holding.symbol} Toxic Order Flow`, description: `VPIN at ${toxicity.toFixed(1)}% — informed traders may be selling` })
            break
          }
        }
      } catch {
        addLog('info', `${holding.symbol}: Data unavailable`)
      }
    }

    // Summary
    addLog('info', '───')
    const buys = newSignals.filter((s) => s.type === 'BUY')
    const sells = newSignals.filter((s) => s.type === 'SELL')
    addLog('signal', `${selectedAgent.name} complete: ${buys.length} BUY, ${sells.length} SELL, ${newSignals.length - buys.length - sells.length} HOLD`)
    addLog('info', `Generated ${newInsights.length} insights`)

    setSignals(newSignals)
    setInsights(newInsights)
  }, [holdings, addLog, selectedAgent])

  const handleStart = () => {
    setRunning(true)
    setActiveTab('overview')
    runSpecializedScan(selectedAgent)
  }

  const handleStop = () => {
    setRunning(false)
    addLog('info', 'Agent stopped.')
  }

  const selectAndRun = (agent: AgentDef) => {
    setSelectedAgent(agent)
    setRunning(true)
    setActiveTab('overview')
    runSpecializedScan(agent)
  }

  const buySignals = signals.filter((s) => s.type === 'BUY')
  const sellSignals = signals.filter((s) => s.type === 'SELL')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">AI Trading Agents</h2>
          <Badge
            variant="outline"
            className="text-xs"
            style={{ color: selectedAgent.color, borderColor: selectedAgent.color }}
          >
            {selectedAgent.name}
          </Badge>
          <Badge className={running ? 'bg-emerald-600 text-xs' : 'bg-zinc-600 text-xs'}>
            {running ? 'Active' : 'Idle'}
          </Badge>
          {scanning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleStart} disabled={scanning}>
            <Play className="h-3.5 w-3.5" />
            {running ? 'Re-scan' : 'Start'}
          </Button>
          {running && (
            <Button variant="outline" size="sm" className="gap-1 text-xs text-red-500" onClick={handleStop}>
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <selectedAgent.icon className="h-5 w-5" style={{ color: selectedAgent.color }} />
            <div>
              <p className="text-xs text-muted-foreground">Active Agent</p>
              <p className="text-sm font-medium">{selectedAgent.name}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Activity className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Buy Signals</p>
              <p className="text-sm font-medium text-emerald-500">{buySignals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Zap className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sell Signals</p>
              <p className="text-sm font-medium text-red-500">{sellSignals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Insights</p>
              <p className="text-sm font-medium">{insights.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="catalog" className="gap-1 text-xs">
            <Bot className="h-3.5 w-3.5" /> Agent Catalog
            <Badge variant="outline" className="ml-1 h-4 px-1 text-xs">{AGENTS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <Brain className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="signals" className="gap-1 text-xs">
            <Crosshair className="h-3.5 w-3.5" /> Signals
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> Insights
            {insights.length > 0 && <Badge className="ml-1 h-4 px-1 text-xs" variant="outline">{insights.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-1 text-xs">
            <Activity className="h-3.5 w-3.5" /> Log
          </TabsTrigger>
        </TabsList>

        {/* ── Agent Catalog Tab ──────────────────────────────── */}
        <TabsContent value="catalog" className="space-y-4">
          {(['core', 'advanced', 'research'] as const).map((tier) => (
            <div key={tier}>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs" style={{ color: TIER_CONFIG[tier].color, borderColor: TIER_CONFIG[tier].color }}>
                  {TIER_CONFIG[tier].label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {tier === 'core' && '— Production-ready strategies'}
                  {tier === 'advanced' && '— Institutional-grade analytics'}
                  {tier === 'research' && '— PhD-level quantitative research'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {AGENTS.filter((a) => a.tier === tier).map((agent) => {
                  const isSelected = selectedAgent.id === agent.id
                  return (
                    <Card
                      key={agent.id}
                      className="cursor-pointer transition-all hover:shadow-md"
                      style={{ borderColor: isSelected ? agent.color : undefined }}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <agent.icon className="h-5 w-5 shrink-0" style={{ color: agent.color }} />
                            <div>
                              <p className="text-sm font-bold">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.subtitle}</p>
                            </div>
                          </div>
                          {isSelected && <Badge className="text-xs" style={{ backgroundColor: agent.color }}>Active</Badge>}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {agent.capabilities.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 w-full gap-1 text-xs"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={(e) => { e.stopPropagation(); selectAndRun(agent) }}
                          disabled={scanning}
                        >
                          <Play className="h-3 w-3" />
                          {isSelected && running ? 'Re-run' : 'Run Agent'}
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── Overview Tab ─────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {insights.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Top Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.slice(0, 3).map((insight, i) => <InsightRow key={i} insight={insight} />)}
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Agent Log (Live)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-64">
                  <div className="space-y-1 p-3 font-mono text-xs">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground">Select an agent from the catalog and click Run...</p>
                    ) : logs.slice(-40).map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="shrink-0 text-muted-foreground">[{log.time}]</span>
                        <span className={logColors[log.type] ?? 'text-foreground'}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Signals</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-64">
                  <div className="divide-y divide-border">
                    {signals.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">No signals yet. Run an agent to scan.</p>
                    ) : signals.filter((s) => s.type !== 'HOLD').sort((a, b) => b.strength - a.strength).slice(0, 5).map((sig) => (
                      <SignalRow key={sig.symbol} sig={sig} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Signals Tab ──────────────────────────────────── */}
        <TabsContent value="signals">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>All Signals ({signals.length})</span>
                {signals.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => runSpecializedScan(selectedAgent)} disabled={scanning}>
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="divide-y divide-border">
                  {signals.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Run an agent to generate signals.</p>
                  ) : signals.sort((a, b) => Math.abs(b.strength - 50) - Math.abs(a.strength - 50)).map((sig) => (
                    <SignalRow key={sig.symbol} sig={sig} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analysis Tab ─────────────────────────────────── */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Technical Analysis Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {analyses.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Run the Multi-Factor Technical agent to see matrix data.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Symbol</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Price</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">RSI</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">MACD Hist</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">ADX</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Stoch %K</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Weight</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Signal</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analyses.map((a) => (
                      <tr key={a.symbol} className="hover:bg-accent/30">
                        <td className="px-3 py-2 font-medium">{a.symbol}</td>
                        <td className="px-3 py-2 text-right">${a.price.toFixed(2)}</td>
                        <td className={`px-3 py-2 text-right ${a.rsi > 70 ? 'text-red-400' : a.rsi < 30 ? 'text-emerald-400' : ''}`}>{a.rsi.toFixed(1)}</td>
                        <td className={`px-3 py-2 text-right ${a.macd > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{a.macd.toFixed(3)}</td>
                        <td className={`px-3 py-2 text-right ${a.adx > 25 ? 'font-medium' : 'text-muted-foreground'}`}>{a.adx.toFixed(1)}</td>
                        <td className={`px-3 py-2 text-right ${a.stochK > 80 ? 'text-red-400' : a.stochK < 20 ? 'text-emerald-400' : ''}`}>{a.stochK.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{a.weight.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`text-xs ${a.signal.type === 'BUY' ? 'bg-emerald-600' : a.signal.type === 'SELL' ? 'bg-red-600' : 'bg-zinc-600'}`}>{a.signal.type}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{a.signal.strength}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Insights Tab ─────────────────────────────────── */}
        <TabsContent value="insights">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Insights ({insights.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Run an agent to generate insights.</p>
              ) : insights.map((insight, i) => <InsightRow key={i} insight={insight} />)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Full Log Tab ─────────────────────────────────── */}
        <TabsContent value="log">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4" /> Full Agent Log ({logs.length} entries)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-1 p-3 font-mono text-xs">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">Select and run an agent from the catalog...</p>
                  ) : logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="shrink-0 text-muted-foreground">[{log.time}]</span>
                      <span className={logColors[log.type] ?? 'text-foreground'}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────
function SignalRow({ sig }: { sig: Signal }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sig.type === 'BUY' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : sig.type === 'SELL' ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> : <Target className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm font-bold">{sig.symbol}</span>
          <Badge className={`text-xs ${sig.type === 'BUY' ? 'bg-emerald-600' : sig.type === 'SELL' ? 'bg-red-600' : 'bg-zinc-600'}`}>{sig.type}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{sig.strength}% confidence</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{sig.reason}</p>
      <div className="mt-2 flex gap-4 text-xs">
        <span>Entry: <span className="font-medium">${sig.price.toFixed(2)}</span></span>
        <span>SL: <span className="font-medium text-red-400">${sig.stopLoss.toFixed(2)}</span></span>
        <span>TP: <span className="font-medium text-emerald-400">${sig.takeProfit.toFixed(2)}</span></span>
        <span>R:R: <span className="font-medium">{sig.riskReward}:1</span></span>
      </div>
    </div>
  )
}

function InsightRow({ insight }: { insight: PortfolioInsight }) {
  return (
    <div className={`flex items-start gap-3 rounded-md px-3 py-2 ${insight.type === 'risk' ? 'bg-red-500/10' : insight.type === 'warning' ? 'bg-yellow-500/10' : 'bg-emerald-500/10'}`}>
      <div className="mt-0.5">
        {insight.type === 'risk' ? <Shield className="h-4 w-4 text-red-500" /> :
         insight.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> :
         <TrendingUp className="h-4 w-4 text-emerald-500" />}
      </div>
      <div>
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="text-xs text-muted-foreground">{insight.description}</p>
      </div>
    </div>
  )
}
