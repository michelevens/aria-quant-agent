import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-lg font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">API Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Yahoo Finance</p>
              <p className="text-xs text-muted-foreground">Free market data provider</p>
            </div>
            <Badge className="bg-emerald-600 text-xs">Connected</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Alpha Vantage</p>
              <p className="text-xs text-muted-foreground">Technical indicators & fundamentals</p>
            </div>
            <Badge variant="outline" className="text-xs">Not Connected</Badge>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">API Key</label>
            <div className="flex gap-2">
              <Input placeholder="Enter your Alpha Vantage API key" className="h-8 text-sm" />
              <Button size="sm" className="h-8 text-xs">Connect</Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Finnhub</p>
              <p className="text-xs text-muted-foreground">Real-time quotes & news</p>
            </div>
            <Badge variant="outline" className="text-xs">Not Connected</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Risk Tolerance</label>
              <Select defaultValue="moderate">
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Max Position Size</label>
              <Input defaultValue="10000" className="h-8 text-sm" type="number" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Daily Loss Limit</label>
              <Input defaultValue="2500" className="h-8 text-sm" type="number" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Max Open Positions</label>
              <Input defaultValue="10" className="h-8 text-sm" type="number" />
            </div>
          </div>
          <Button size="sm" className="text-xs">Save Configuration</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Theme</label>
            <Select defaultValue="dark">
              <SelectTrigger className="h-8 w-48 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
