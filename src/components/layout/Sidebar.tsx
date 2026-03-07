import { NavLink } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  LineChart,
  Briefcase,
  ListOrdered,
  Eye,
  Newspaper,
  Bot,
  Settings,
  TrendingUp,
  Search,
  FlaskConical,
  Bell,
  Shield,
  LayoutGrid,
  BookOpen,
  BarChart3,
  Calendar,
  Puzzle,
  Users,
  Coins,
  Zap,
  GraduationCap,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trade', icon: TrendingUp, label: 'Trade' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/charts', icon: LineChart, label: 'Charts' },
  { to: '/watchlist', icon: Eye, label: 'Watchlist' },
  { to: '/orders', icon: ListOrdered, label: 'Orders' },
  { to: '/screener', icon: Search, label: 'Screener' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/agent', icon: Bot, label: 'AI Agent' },
  { to: '/backtest', icon: FlaskConical, label: 'Backtest' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/risk', icon: Shield, label: 'Risk' },
  { to: '/heatmap', icon: LayoutGrid, label: 'Heat Map' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/strategy', icon: Puzzle, label: 'Strategy' },
  { to: '/social', icon: Users, label: 'Social Trading' },
  { to: '/crypto', icon: Coins, label: 'Crypto' },
  { to: '/options-flow', icon: Zap, label: 'Options Flow' },
  { to: '/learn', icon: GraduationCap, label: 'Learn' },
]

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">Aria Quant</h1>
          <p className="text-muted-foreground" style={{ fontSize: '10px' }}>Trading Agent</p>
        </div>
        <div className="mx-1 h-8 w-px bg-border" />
        <div>
          <p className="font-bold tracking-tight" style={{ color: '#d4a017', fontSize: '10px' }}>Acsyom</p>
          <p style={{ color: '#c49a15', fontSize: '9px' }}>Analytics</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-border px-2 py-2">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
