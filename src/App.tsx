import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PortfolioProvider } from '@/contexts/PortfolioContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/aria-quant-agent">
      <ErrorBoundary>
      <TooltipProvider>
        <PortfolioProvider>
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
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        </Suspense>
        </PortfolioProvider>
      </TooltipProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
