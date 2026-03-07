import { Card, CardContent } from '@/components/ui/card'
import { NewsFeed } from '@/components/trading/NewsFeed'

export function News() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Market News</h2>
      <Card>
        <CardContent className="p-0">
          <NewsFeed />
        </CardContent>
      </Card>
    </div>
  )
}
