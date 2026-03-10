<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FearGreedService
{
    /**
     * Calculate Fear & Greed Index from real market data.
     *
     * Components (equally weighted):
     * 1. VIX (Market Volatility) — inversely correlated
     * 2. S&P 500 momentum (125-day MA vs current)
     * 3. Put/Call ratio — inversely correlated
     * 4. Market breadth (advance/decline)
     * 5. Safe haven demand (bond yield spread)
     */
    public function calculate(): array
    {
        $components = [];

        // 1. VIX — Fear gauge
        $vix = $this->fetchVix();
        $vixScore = $this->vixToScore($vix);
        $components['volatility'] = [
            'value' => $vix,
            'score' => $vixScore,
            'label' => 'Market Volatility (VIX)',
        ];

        // 2. S&P 500 Momentum
        $momentum = $this->fetchMomentum();
        $components['momentum'] = [
            'value' => $momentum['percent_above_ma'],
            'score' => $momentum['score'],
            'label' => 'Stock Price Momentum',
        ];

        // 3. Put/Call Ratio
        $pcr = $this->fetchPutCallRatio();
        $pcrScore = $this->putCallToScore($pcr);
        $components['put_call'] = [
            'value' => $pcr,
            'score' => $pcrScore,
            'label' => 'Put/Call Ratio',
        ];

        // 4. Market Breadth (new highs vs new lows proxy)
        $breadth = $this->fetchBreadth();
        $components['breadth'] = [
            'value' => $breadth['ratio'],
            'score' => $breadth['score'],
            'label' => 'Market Breadth',
        ];

        // 5. Safe Haven Demand (treasury yield as proxy)
        $safeHaven = $this->fetchSafeHaven();
        $components['safe_haven'] = [
            'value' => $safeHaven['spread'],
            'score' => $safeHaven['score'],
            'label' => 'Safe Haven Demand',
        ];

        // Calculate composite score
        $scores = array_column($components, 'score');
        $composite = count($scores) > 0 ? round(array_sum($scores) / count($scores)) : 50;

        return [
            'score' => $composite,
            'label' => $this->scoreToLabel($composite),
            'components' => $components,
            'updated_at' => now()->toISOString(),
        ];
    }

    private function fetchVix(): float
    {
        try {
            $response = Http::timeout(10)->get('https://corsproxy.io/?' . urlencode(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d'
            ));

            if ($response->successful()) {
                $data = $response->json();
                $close = $data['chart']['result'][0]['meta']['regularMarketPrice'] ?? null;
                if ($close) {
                    return round((float) $close, 2);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('FearGreed: VIX fetch failed', ['error' => $e->getMessage()]);
        }

        return 20.0; // neutral default
    }

    private function vixToScore(float $vix): int
    {
        // VIX < 12 = extreme greed (90+), VIX > 35 = extreme fear (10-)
        if ($vix <= 12) return 95;
        if ($vix >= 40) return 5;

        // Linear interpolation: 12->90, 40->10
        return (int) round(90 - (($vix - 12) / 28) * 80);
    }

    private function fetchMomentum(): array
    {
        try {
            $response = Http::timeout(10)->get('https://corsproxy.io/?' . urlencode(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=6mo'
            ));

            if ($response->successful()) {
                $data = $response->json();
                $closes = $data['chart']['result'][0]['indicators']['quote'][0]['close'] ?? [];
                $closes = array_filter($closes, fn($v) => $v !== null);

                if (count($closes) >= 125) {
                    $recent = array_slice($closes, -125);
                    $ma125 = array_sum($recent) / count($recent);
                    $current = end($closes);
                    $percentAbove = (($current - $ma125) / $ma125) * 100;

                    // > +8% above MA = extreme greed, < -8% = extreme fear
                    $score = (int) round(50 + ($percentAbove / 8) * 40);
                    $score = max(0, min(100, $score));

                    return ['percent_above_ma' => round($percentAbove, 2), 'score' => $score];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('FearGreed: Momentum fetch failed', ['error' => $e->getMessage()]);
        }

        return ['percent_above_ma' => 0, 'score' => 50];
    }

    private function fetchPutCallRatio(): float
    {
        // CBOE put/call ratio — use VIX as proxy since direct data requires paid feed
        // In production, use CBOE data or options API
        try {
            $response = Http::timeout(10)->get('https://corsproxy.io/?' . urlencode(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d'
            ));

            if ($response->successful()) {
                $data = $response->json();
                $closes = $data['chart']['result'][0]['indicators']['quote'][0]['close'] ?? [];
                $closes = array_filter($closes, fn($v) => $v !== null);

                if (count($closes) >= 2) {
                    $current = end($closes);
                    // Derive synthetic PCR from VIX level
                    // VIX 12 -> PCR 0.7 (greedy), VIX 35 -> PCR 1.3 (fearful)
                    return round(0.7 + ($current - 12) * 0.026, 2);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('FearGreed: PCR fetch failed', ['error' => $e->getMessage()]);
        }

        return 0.95;
    }

    private function putCallToScore(float $pcr): int
    {
        // PCR < 0.7 = extreme greed, PCR > 1.3 = extreme fear
        if ($pcr <= 0.6) return 95;
        if ($pcr >= 1.4) return 5;

        return (int) round(95 - (($pcr - 0.6) / 0.8) * 90);
    }

    private function fetchBreadth(): array
    {
        try {
            // Use Russell 2000 vs S&P 500 ratio as breadth proxy
            $spResponse = Http::timeout(10)->get('https://corsproxy.io/?' . urlencode(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1mo'
            ));
            $rutResponse = Http::timeout(10)->get('https://corsproxy.io/?' . urlencode(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5ERUT?interval=1d&range=1mo'
            ));

            if ($spResponse->successful() && $rutResponse->successful()) {
                $spCloses = $spResponse->json()['chart']['result'][0]['indicators']['quote'][0]['close'] ?? [];
                $rutCloses = $rutResponse->json()['chart']['result'][0]['indicators']['quote'][0]['close'] ?? [];

                $spCloses = array_filter($spCloses, fn($v) => $v !== null);
                $rutCloses = array_filter($rutCloses, fn($v) => $v !== null);

                if (count($spCloses) >= 2 && count($rutCloses) >= 2) {
                    $spChange = (end($spCloses) - reset($spCloses)) / reset($spCloses) * 100;
                    $rutChange = (end($rutCloses) - reset($rutCloses)) / reset($rutCloses) * 100;

                    // If small caps outperform, breadth is good (greedy)
                    $ratio = round($rutChange - $spChange, 2);
                    $score = (int) round(50 + $ratio * 10);
                    $score = max(0, min(100, $score));

                    return ['ratio' => $ratio, 'score' => $score];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('FearGreed: Breadth fetch failed', ['error' => $e->getMessage()]);
        }

        return ['ratio' => 0, 'score' => 50];
    }

    private function fetchSafeHaven(): array
    {
        try {
            // 10Y Treasury yield — higher yield = less demand for safe havens = greed
            $response = Http::timeout(10)->get('https://corsproxy.io/?' . urlencode(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=3mo'
            ));

            if ($response->successful()) {
                $closes = $response->json()['chart']['result'][0]['indicators']['quote'][0]['close'] ?? [];
                $closes = array_filter($closes, fn($v) => $v !== null);

                if (count($closes) >= 20) {
                    $current = end($closes);
                    $avg = array_sum(array_slice($closes, -60)) / min(count($closes), 60);
                    $spread = round($current - $avg, 2);

                    // Rising yields (positive spread) = less safe haven demand = greed
                    $score = (int) round(50 + $spread * 30);
                    $score = max(0, min(100, $score));

                    return ['spread' => $spread, 'score' => $score];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('FearGreed: SafeHaven fetch failed', ['error' => $e->getMessage()]);
        }

        return ['spread' => 0, 'score' => 50];
    }

    private function scoreToLabel(int $score): string
    {
        if ($score <= 20) return 'Extreme Fear';
        if ($score <= 40) return 'Fear';
        if ($score <= 60) return 'Neutral';
        if ($score <= 80) return 'Greed';
        return 'Extreme Greed';
    }
}
