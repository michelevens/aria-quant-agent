<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\AlertHistory;
use App\Models\Holding;
use App\Models\JournalEntry;
use App\Models\NotificationLog;
use App\Models\Order;
use App\Models\Strategy;
use App\Models\Trade;
use App\Models\User;
use App\Models\Watchlist;
use App\Models\WatchlistItem;
use App\Models\Workflow;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Seed data for all existing users
        $users = User::all();

        foreach ($users as $user) {
            $this->seedUserData($user);
        }
    }

    private function seedUserData(User $user): void
    {
        $userId = $user->id;

        // Skip if user already has holdings (already seeded)
        if (Holding::where('user_id', $userId)->exists()) {
            return;
        }

        // Vary data per user for realism
        $portfolioProfiles = [
            ['bias' => 'tech', 'cash' => 47832.15],
            ['bias' => 'diversified', 'cash' => 62104.50],
            ['bias' => 'aggressive', 'cash' => 23450.80],
            ['bias' => 'conservative', 'cash' => 78215.33],
            ['bias' => 'growth', 'cash' => 55600.00],
        ];
        $profile = $portfolioProfiles[$userId % count($portfolioProfiles)];

        // Update cash balance
        DB::table('portfolio_balances')->where('user_id', $userId)->update(['cash' => $profile['cash']]);

        // ── Holdings ──
        $allHoldings = [
            'tech' => [
                ['symbol' => 'AAPL', 'quantity' => 45, 'avg_cost' => 178.52],
                ['symbol' => 'NVDA', 'quantity' => 30, 'avg_cost' => 124.80],
                ['symbol' => 'MSFT', 'quantity' => 20, 'avg_cost' => 412.35],
                ['symbol' => 'GOOGL', 'quantity' => 25, 'avg_cost' => 165.90],
                ['symbol' => 'META', 'quantity' => 15, 'avg_cost' => 505.20],
                ['symbol' => 'AMD', 'quantity' => 50, 'avg_cost' => 155.40],
            ],
            'diversified' => [
                ['symbol' => 'AAPL', 'quantity' => 30, 'avg_cost' => 182.10],
                ['symbol' => 'JPM', 'quantity' => 40, 'avg_cost' => 198.75],
                ['symbol' => 'JNJ', 'quantity' => 35, 'avg_cost' => 155.80],
                ['symbol' => 'XOM', 'quantity' => 50, 'avg_cost' => 108.45],
                ['symbol' => 'PG', 'quantity' => 25, 'avg_cost' => 162.30],
                ['symbol' => 'AMZN', 'quantity' => 20, 'avg_cost' => 185.60],
                ['symbol' => 'V', 'quantity' => 18, 'avg_cost' => 278.90],
            ],
            'aggressive' => [
                ['symbol' => 'NVDA', 'quantity' => 60, 'avg_cost' => 118.50],
                ['symbol' => 'TSLA', 'quantity' => 40, 'avg_cost' => 245.30],
                ['symbol' => 'COIN', 'quantity' => 35, 'avg_cost' => 225.10],
                ['symbol' => 'PLTR', 'quantity' => 100, 'avg_cost' => 42.80],
                ['symbol' => 'SOFI', 'quantity' => 200, 'avg_cost' => 12.45],
                ['symbol' => 'MARA', 'quantity' => 150, 'avg_cost' => 22.30],
            ],
            'conservative' => [
                ['symbol' => 'AAPL', 'quantity' => 25, 'avg_cost' => 175.00],
                ['symbol' => 'MSFT', 'quantity' => 15, 'avg_cost' => 405.00],
                ['symbol' => 'BRK.B', 'quantity' => 20, 'avg_cost' => 415.60],
                ['symbol' => 'KO', 'quantity' => 50, 'avg_cost' => 60.25],
                ['symbol' => 'PEP', 'quantity' => 30, 'avg_cost' => 172.80],
                ['symbol' => 'WMT', 'quantity' => 25, 'avg_cost' => 165.40],
            ],
            'growth' => [
                ['symbol' => 'NVDA', 'quantity' => 40, 'avg_cost' => 130.20],
                ['symbol' => 'AMZN', 'quantity' => 25, 'avg_cost' => 178.90],
                ['symbol' => 'GOOGL', 'quantity' => 30, 'avg_cost' => 158.40],
                ['symbol' => 'CRM', 'quantity' => 20, 'avg_cost' => 295.60],
                ['symbol' => 'SHOP', 'quantity' => 15, 'avg_cost' => 85.30],
                ['symbol' => 'NET', 'quantity' => 45, 'avg_cost' => 92.10],
                ['symbol' => 'DDOG', 'quantity' => 30, 'avg_cost' => 125.40],
            ],
        ];

        $holdings = $allHoldings[$profile['bias']];
        foreach ($holdings as $h) {
            Holding::create(array_merge($h, ['user_id' => $userId]));
        }

        // ── Orders (mix of filled, pending, cancelled) ──
        $orderData = [];
        foreach ($holdings as $i => $h) {
            // Filled buy order (the one that created the holding)
            $buyDate = now()->subDays(rand(5, 60));
            $orderData[] = [
                'user_id' => $userId,
                'symbol' => $h['symbol'],
                'side' => 'BUY',
                'type' => 'MARKET',
                'quantity' => $h['quantity'],
                'tif' => 'DAY',
                'status' => 'FILLED',
                'filled_qty' => $h['quantity'],
                'filled_price' => $h['avg_cost'],
                'filled_at' => $buyDate,
                'created_at' => $buyDate,
                'updated_at' => $buyDate,
            ];
        }

        // Some limit orders (pending)
        $pendingOrders = [
            ['symbol' => 'AAPL', 'side' => 'BUY', 'type' => 'LIMIT', 'quantity' => 10, 'limit_price' => 170.00, 'tif' => 'GTC', 'status' => 'OPEN'],
            ['symbol' => 'TSLA', 'side' => 'BUY', 'type' => 'LIMIT', 'quantity' => 5, 'limit_price' => 230.00, 'tif' => 'GTC', 'status' => 'OPEN'],
            ['symbol' => 'NVDA', 'side' => 'SELL', 'type' => 'LIMIT', 'quantity' => 10, 'limit_price' => 160.00, 'tif' => 'GTC', 'status' => 'OPEN'],
        ];
        foreach ($pendingOrders as $po) {
            $orderData[] = array_merge($po, [
                'user_id' => $userId,
                'created_at' => now()->subDays(rand(1, 3)),
                'updated_at' => now()->subDays(rand(1, 3)),
            ]);
        }

        // A cancelled order
        $orderData[] = [
            'user_id' => $userId,
            'symbol' => 'AMC',
            'side' => 'BUY',
            'type' => 'LIMIT',
            'quantity' => 50,
            'limit_price' => 4.50,
            'tif' => 'DAY',
            'status' => 'CANCELLED',
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(7),
        ];

        // Some recent sell orders (filled)
        $recentSells = [
            ['symbol' => 'SPY', 'quantity' => 20, 'price' => 525.40, 'days_ago' => 2],
            ['symbol' => 'QQQ', 'quantity' => 15, 'price' => 485.20, 'days_ago' => 4],
        ];
        foreach ($recentSells as $rs) {
            $sellDate = now()->subDays($rs['days_ago']);
            $orderData[] = [
                'user_id' => $userId,
                'symbol' => $rs['symbol'],
                'side' => 'SELL',
                'type' => 'MARKET',
                'quantity' => $rs['quantity'],
                'tif' => 'DAY',
                'status' => 'FILLED',
                'filled_qty' => $rs['quantity'],
                'filled_price' => $rs['price'],
                'pnl' => round(rand(50, 500) * (rand(0, 1) ? 1 : -1) + rand(0, 99) / 100, 2),
                'filled_at' => $sellDate,
                'created_at' => $sellDate,
                'updated_at' => $sellDate,
            ];
        }

        foreach ($orderData as $od) {
            $order = Order::create($od);

            // Create trades for filled orders
            if ($od['status'] === 'FILLED') {
                Trade::create([
                    'user_id' => $userId,
                    'order_id' => $order->id,
                    'symbol' => $od['symbol'],
                    'side' => $od['side'],
                    'quantity' => $od['filled_qty'],
                    'price' => $od['filled_price'],
                    'total' => round($od['filled_qty'] * $od['filled_price'], 2),
                    'created_at' => $od['filled_at'] ?? now(),
                    'updated_at' => $od['filled_at'] ?? now(),
                ]);
            }
        }

        // ── Watchlists ──
        $watchlistData = [
            ['name' => 'Tech Leaders', 'category' => 'sector', 'symbols' => ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA']],
            ['name' => 'Earnings This Week', 'category' => 'event', 'symbols' => ['NKE', 'MU', 'FDX', 'LEN', 'KMX']],
            ['name' => 'High Momentum', 'category' => 'strategy', 'symbols' => ['PLTR', 'APP', 'RDDT', 'HOOD', 'COIN', 'MSTR']],
            ['name' => 'Dividend Kings', 'category' => 'income', 'symbols' => ['KO', 'PG', 'JNJ', 'PEP', 'MMM', 'EMR']],
        ];
        foreach ($watchlistData as $wl) {
            $watchlist = Watchlist::create([
                'user_id' => $userId,
                'name' => $wl['name'],
                'category' => $wl['category'],
            ]);
            foreach ($wl['symbols'] as $sort => $sym) {
                WatchlistItem::create([
                    'watchlist_id' => $watchlist->id,
                    'symbol' => $sym,
                    'sort_order' => $sort,
                ]);
            }
        }

        // ── Alerts ──
        $alertsData = [
            [
                'name' => 'AAPL breaks $200',
                'category' => 'price',
                'status' => 'active',
                'config' => json_encode(['symbol' => 'AAPL', 'condition' => 'above', 'value' => 200, 'field' => 'price']),
                'recurring' => false,
            ],
            [
                'name' => 'NVDA drops below $120',
                'category' => 'price',
                'status' => 'active',
                'config' => json_encode(['symbol' => 'NVDA', 'condition' => 'below', 'value' => 120, 'field' => 'price']),
                'recurring' => true,
                'cooldown_ms' => 3600000,
            ],
            [
                'name' => 'SPY RSI oversold',
                'category' => 'technical',
                'status' => 'active',
                'config' => json_encode(['symbol' => 'SPY', 'indicator' => 'RSI', 'condition' => 'below', 'value' => 30, 'timeframe' => '1D']),
                'recurring' => true,
                'cooldown_ms' => 86400000,
            ],
            [
                'name' => 'Portfolio down 5%',
                'category' => 'portfolio',
                'status' => 'active',
                'config' => json_encode(['metric' => 'daily_pnl_pct', 'condition' => 'below', 'value' => -5]),
                'recurring' => false,
            ],
            [
                'name' => 'TSLA earnings alert',
                'category' => 'sentiment',
                'status' => 'triggered',
                'config' => json_encode(['symbol' => 'TSLA', 'event' => 'earnings', 'days_before' => 1]),
                'trigger_count' => 1,
                'triggered_at' => now()->subDays(3),
            ],
            [
                'name' => 'VIX spike > 25',
                'category' => 'technical',
                'status' => 'active',
                'config' => json_encode(['symbol' => 'VIX', 'condition' => 'above', 'value' => 25, 'field' => 'price']),
                'recurring' => true,
                'cooldown_ms' => 7200000,
            ],
        ];
        foreach ($alertsData as $ad) {
            $alert = Alert::create(array_merge($ad, ['user_id' => $userId]));

            if (($ad['status'] ?? '') === 'triggered') {
                AlertHistory::create([
                    'user_id' => $userId,
                    'alert_id' => $alert->id,
                    'message' => "Alert triggered: {$ad['name']}",
                    'created_at' => $ad['triggered_at'],
                ]);
            }
        }

        // ── Strategies ──
        $strategiesData = [
            [
                'name' => 'RSI Mean Reversion',
                'entry_conditions' => json_encode([
                    ['indicator' => 'RSI', 'timeframe' => '1D', 'condition' => 'below', 'value' => 30],
                    ['indicator' => 'SMA_200', 'condition' => 'price_above'],
                ]),
                'exit_conditions' => json_encode([
                    ['indicator' => 'RSI', 'timeframe' => '1D', 'condition' => 'above', 'value' => 70],
                ]),
                'stop_loss' => 5.0,
                'take_profit' => 15.0,
                'position_size' => 10.0,
            ],
            [
                'name' => 'Breakout Momentum',
                'entry_conditions' => json_encode([
                    ['indicator' => 'price', 'condition' => 'above', 'reference' => '52w_high'],
                    ['indicator' => 'volume', 'condition' => 'above', 'value' => 1.5, 'reference' => 'avg_volume'],
                ]),
                'exit_conditions' => json_encode([
                    ['indicator' => 'price', 'condition' => 'below', 'reference' => 'EMA_21'],
                ]),
                'stop_loss' => 8.0,
                'take_profit' => 25.0,
                'position_size' => 5.0,
            ],
            [
                'name' => 'MACD Crossover',
                'entry_conditions' => json_encode([
                    ['indicator' => 'MACD', 'condition' => 'crossover', 'reference' => 'signal'],
                    ['indicator' => 'MACD_histogram', 'condition' => 'above', 'value' => 0],
                ]),
                'exit_conditions' => json_encode([
                    ['indicator' => 'MACD', 'condition' => 'crossunder', 'reference' => 'signal'],
                ]),
                'stop_loss' => 3.0,
                'take_profit' => 10.0,
                'position_size' => 8.0,
            ],
        ];
        foreach ($strategiesData as $sd) {
            Strategy::create(array_merge($sd, ['user_id' => $userId]));
        }

        // ── Journal Entries ──
        $journalData = [
            [
                'entry_date' => now()->subDays(1)->toDateString(),
                'notes' => 'Strong day for tech. NVDA surged on AI chip demand news. Held positions — waiting for earnings confirmation before adding. SPY held above 520 support cleanly.',
                'trades_data' => json_encode([
                    ['symbol' => 'NVDA', 'side' => 'hold', 'notes' => 'Up 4.2% — strong momentum'],
                    ['symbol' => 'SPY', 'side' => 'sell', 'quantity' => 20, 'price' => 525.40, 'pnl' => 312.50],
                ]),
                'mood' => 5,
                'lessons' => 'Patience paid off. Resisted FOMO on MSTR spike — stuck to plan.',
            ],
            [
                'entry_date' => now()->subDays(3)->toDateString(),
                'notes' => 'Choppy market. Fed minutes spooked bonds but equities recovered into close. Trimmed QQQ position at 485 — locking in gains from last week entry.',
                'trades_data' => json_encode([
                    ['symbol' => 'QQQ', 'side' => 'sell', 'quantity' => 15, 'price' => 485.20, 'pnl' => 228.00],
                ]),
                'mood' => 3,
                'lessons' => 'Taking profits on strength is never wrong. Better to sell too early than too late.',
            ],
            [
                'entry_date' => now()->subDays(5)->toDateString(),
                'notes' => 'Opened new position in GOOGL after the Cloud revenue beat. Entry at 165.90 — targeting 185 over next 4-6 weeks. Risk/reward looks attractive at this level.',
                'trades_data' => json_encode([
                    ['symbol' => 'GOOGL', 'side' => 'buy', 'quantity' => 25, 'price' => 165.90],
                ]),
                'mood' => 4,
                'lessons' => 'Earnings reactions create the best entries when the move is warranted by fundamentals.',
            ],
            [
                'entry_date' => now()->subDays(8)->toDateString(),
                'notes' => 'Red day across the board. VIX up to 22 — not panic territory but watching closely. All stop losses intact. No new positions today, just monitoring.',
                'trades_data' => json_encode([]),
                'mood' => 2,
                'lessons' => 'Red days are for watching, not reacting. My system handles drawdowns — trust the process.',
            ],
            [
                'entry_date' => now()->subDays(12)->toDateString(),
                'notes' => 'Added to AAPL on the dip to 178. Thesis unchanged — services revenue accelerating, buyback program massive. Also started a small META position for the AI monetization story.',
                'trades_data' => json_encode([
                    ['symbol' => 'AAPL', 'side' => 'buy', 'quantity' => 15, 'price' => 178.52],
                    ['symbol' => 'META', 'side' => 'buy', 'quantity' => 15, 'price' => 505.20],
                ]),
                'mood' => 5,
                'lessons' => 'Buying dips in quality names with conviction — this is how wealth compounds.',
            ],
        ];
        foreach ($journalData as $jd) {
            JournalEntry::create(array_merge($jd, ['user_id' => $userId]));
        }

        // ── Notifications ──
        $notifData = [
            ['type' => 'signal', 'title' => 'Order Filled', 'message' => 'Your market buy order for 20 shares of SPY was filled at $518.30', 'read' => true, 'created_at' => now()->subDays(10)],
            ['type' => 'signal', 'title' => 'Order Filled', 'message' => 'Your market sell order for 20 shares of SPY was filled at $525.40', 'read' => true, 'created_at' => now()->subDays(2)],
            ['type' => 'signal', 'title' => 'Order Filled', 'message' => 'Your market sell order for 15 shares of QQQ was filled at $485.20', 'read' => false, 'created_at' => now()->subDays(4)],
            ['type' => 'alert', 'title' => 'Price Alert Triggered', 'message' => 'TSLA earnings in 1 day — your alert has been triggered', 'read' => false, 'created_at' => now()->subDays(3)],
            ['type' => 'system', 'title' => 'Welcome to Aria Quant', 'message' => 'Your account is ready. Start by adding stocks to your watchlist and setting up price alerts.', 'read' => true, 'created_at' => now()->subDays(30)],
            ['type' => 'alert', 'title' => 'Watchlist Alert', 'message' => 'NVDA is up 4.2% today — currently at $142.50', 'read' => false, 'created_at' => now()->subDays(1)],
            ['type' => 'system', 'title' => 'Market Update', 'message' => 'Markets closed higher. S&P 500 +0.8%, Nasdaq +1.2%. Your portfolio gained $1,847.30 today.', 'read' => false, 'created_at' => now()->subHours(6)],
        ];
        foreach ($notifData as $nd) {
            NotificationLog::create(array_merge($nd, ['user_id' => $userId]));
        }

        // ── Workflows ──
        $firstAlert = Alert::where('user_id', $userId)->first();
        if ($firstAlert) {
            Workflow::create([
                'user_id' => $userId,
                'name' => 'Buy AAPL on dip',
                'enabled' => true,
                'trigger_alert_id' => $firstAlert->id,
                'conditions' => json_encode(['all' => [['field' => 'price', 'op' => 'lte', 'value' => 175]]]),
                'actions' => json_encode([['type' => 'place_order', 'symbol' => 'AAPL', 'side' => 'buy', 'quantity' => 10, 'order_type' => 'market']]),
                'trigger_count' => 0,
            ]);
        }
    }
}
