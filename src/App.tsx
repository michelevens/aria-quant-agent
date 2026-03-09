import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PortfolioProvider } from '@/contexts/PortfolioContext'
import { TradingProvider } from '@/contexts/TradingContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { CommandPalette } from '@/components/CommandPalette'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Loader2 } from 'lucide-react'

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Trade = lazy(() => import('@/pages/Trade').then((m) => ({ default: m.Trade })))
const Portfolio = lazy(() => import('@/pages/Portfolio').then((m) => ({ default: m.Portfolio })))
const Charts = lazy(() => import('@/pages/Charts').then((m) => ({ default: m.Charts })))
const Watchlist = lazy(() => import('@/pages/Watchlist').then((m) => ({ default: m.Watchlist })))
const Orders = lazy(() => import('@/pages/Orders').then((m) => ({ default: m.Orders })))
const Screener = lazy(() => import('@/pages/Screener').then((m) => ({ default: m.Screener })))
const News = lazy(() => import('@/pages/News').then((m) => ({ default: m.News })))
const Agent = lazy(() => import('@/pages/Agent').then((m) => ({ default: m.Agent })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Backtest = lazy(() => import('@/pages/Backtest').then((m) => ({ default: m.Backtest })))
const Alerts = lazy(() => import('@/pages/Alerts').then((m) => ({ default: m.Alerts })))
const RiskDashboard = lazy(() => import('@/pages/RiskDashboard').then((m) => ({ default: m.RiskDashboard })))
const HeatMap = lazy(() => import('@/pages/HeatMap').then((m) => ({ default: m.HeatMap })))
const Journal = lazy(() => import('@/pages/Journal').then((m) => ({ default: m.Journal })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.Analytics })))
const EconomicCalendar = lazy(() => import('@/pages/EconomicCalendar').then((m) => ({ default: m.EconomicCalendar })))
const StrategyBuilder = lazy(() => import('@/pages/StrategyBuilder').then((m) => ({ default: m.StrategyBuilder })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const SocialTrading = lazy(() => import('@/pages/SocialTrading').then((m) => ({ default: m.SocialTrading })))
const CryptoDashboard = lazy(() => import('@/pages/CryptoDashboard').then((m) => ({ default: m.CryptoDashboard })))
const OptionsFlow = lazy(() => import('@/pages/OptionsFlow').then((m) => ({ default: m.OptionsFlow })))
const LearnCenter = lazy(() => import('@/pages/LearnCenter').then((m) => ({ default: m.LearnCenter })))
const PerformanceAttribution = lazy(() => import('@/pages/PerformanceAttribution').then((m) => ({ default: m.PerformanceAttribution })))
const SentimentDashboard = lazy(() => import('@/pages/SentimentDashboard').then((m) => ({ default: m.SentimentDashboard })))
const MarketBreadth = lazy(() => import('@/pages/MarketBreadth').then((m) => ({ default: m.MarketBreadth })))
const ForexCommodities = lazy(() => import('@/pages/ForexCommodities').then((m) => ({ default: m.ForexCommodities })))
const DarkPoolMonitor = lazy(() => import('@/pages/DarkPoolMonitor').then((m) => ({ default: m.DarkPoolMonitor })))
const CorrelationMatrix = lazy(() => import('@/pages/CorrelationMatrix').then((m) => ({ default: m.CorrelationMatrix })))
const MonteCarloPage = lazy(() => import('@/pages/MonteCarlo').then((m) => ({ default: m.MonteCarlo })))
const InsiderTrades = lazy(() => import('@/pages/InsiderTrades').then((m) => ({ default: m.InsiderTrades })))
const EarningsCalendarPage = lazy(() => import('@/pages/EarningsCalendar').then((m) => ({ default: m.EarningsCalendar })))
const OptionsChain = lazy(() => import('@/pages/OptionsChain').then((m) => ({ default: m.OptionsChain })))
const ETFScreener = lazy(() => import('@/pages/ETFScreener').then((m) => ({ default: m.ETFScreener })))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <PortfolioProvider>
      <TradingProvider>
      <CommandPalette />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="trade" element={<Trade />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="charts" element={<Charts />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="orders" element={<Orders />} />
            <Route path="screener" element={<Screener />} />
            <Route path="news" element={<News />} />
            <Route path="agent" element={<Agent />} />
            <Route path="backtest" element={<Backtest />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="risk" element={<RiskDashboard />} />
            <Route path="heatmap" element={<HeatMap />} />
            <Route path="journal" element={<Journal />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="calendar" element={<EconomicCalendar />} />
            <Route path="strategy" element={<StrategyBuilder />} />
            <Route path="profile" element={<Profile />} />
            <Route path="social" element={<SocialTrading />} />
            <Route path="crypto" element={<CryptoDashboard />} />
            <Route path="options-flow" element={<OptionsFlow />} />
            <Route path="learn" element={<LearnCenter />} />
            <Route path="performance" element={<PerformanceAttribution />} />
            <Route path="sentiment" element={<SentimentDashboard />} />
            <Route path="breadth" element={<MarketBreadth />} />
            <Route path="forex" element={<ForexCommodities />} />
            <Route path="darkpool" element={<DarkPoolMonitor />} />
            <Route path="correlation" element={<CorrelationMatrix />} />
            <Route path="monte-carlo" element={<MonteCarloPage />} />
            <Route path="insiders" element={<InsiderTrades />} />
            <Route path="earnings" element={<EarningsCalendarPage />} />
            <Route path="options-chain" element={<OptionsChain />} />
            <Route path="etf-screener" element={<ETFScreener />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
      </TradingProvider>
    </PortfolioProvider>
  )
}

function AuthGate() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter basename="/aria-quant-agent">
      <ErrorBoundary>
      <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
      </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
