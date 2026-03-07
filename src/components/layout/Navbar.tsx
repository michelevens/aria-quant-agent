import { Badge } from '@/components/ui/badge'

export function Navbar() {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Aria Quant Agent
          </h1>
          <Badge variant="secondary" className="text-xs">
            v0.1.0
          </Badge>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground transition-colors">
            Dashboard
          </span>
          <span className="cursor-pointer hover:text-foreground transition-colors">
            Strategies
          </span>
          <span className="cursor-pointer hover:text-foreground transition-colors">
            Settings
          </span>
        </nav>
      </div>
    </header>
  )
}
