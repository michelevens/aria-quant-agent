import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from '@/components/trading/TopBar'
import { TickerBar } from '@/components/trading/TickerBar'
import { DisclaimerBanner } from '@/components/DisclaimerBanner'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on lg+ */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-8 w-8 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <TopBar />
          </div>
        </div>
        <DisclaimerBanner />
        <TickerBar />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <main className="p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
