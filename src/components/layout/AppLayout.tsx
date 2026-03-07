import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from '@/components/trading/TopBar'
import { TickerBar } from '@/components/trading/TickerBar'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <TickerBar />
        <ScrollArea className="flex-1">
          <main className="p-4">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}
