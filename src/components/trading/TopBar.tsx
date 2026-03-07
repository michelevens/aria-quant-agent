import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Bell, Wifi } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search symbol, company..."
            className="h-8 w-72 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-muted-foreground">Market Open</span>
          <Badge variant="outline" className="h-5 px-1.5 text-xs text-emerald-500">
            LIVE
          </Badge>
        </div>

        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">ME</AvatarFallback>
            </Avatar>
            <span className="text-xs">michelevens</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Account Settings</DropdownMenuItem>
            <DropdownMenuItem>API Keys</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
