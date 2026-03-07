import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Trade } from '@/pages/Trade'
import { Portfolio } from '@/pages/Portfolio'
import { Charts } from '@/pages/Charts'
import { Watchlist } from '@/pages/Watchlist'
import { Orders } from '@/pages/Orders'
import { Screener } from '@/pages/Screener'
import { News } from '@/pages/News'
import { Agent } from '@/pages/Agent'
import { Settings } from '@/pages/Settings'

function App() {
  return (
    <BrowserRouter basename="/aria-quant-agent">
      <TooltipProvider>
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
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
