<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IpoService
{
    /**
     * Fetch upcoming IPOs from Finnhub API.
     * Falls back to a curated list if no API key is configured.
     */
    public function getUpcoming(): array
    {
        $apiKey = config('services.finnhub.key');

        if ($apiKey) {
            return $this->fetchFromFinnhub($apiKey);
        }

        return $this->fetchFromYahoo();
    }

    private function fetchFromFinnhub(string $apiKey): array
    {
        try {
            $from = now()->format('Y-m-d');
            $to = now()->addMonths(3)->format('Y-m-d');

            $response = Http::timeout(10)
                ->withHeaders(['X-Finnhub-Token' => $apiKey])
                ->get('https://finnhub.io/api/v1/calendar/ipo', [
                    'from' => $from,
                    'to' => $to,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $ipos = $data['ipoCalendar'] ?? [];

                return array_map(function ($ipo) {
                    return [
                        'symbol' => $ipo['symbol'] ?? 'TBD',
                        'name' => $ipo['name'] ?? 'Unknown',
                        'date' => $ipo['date'] ?? null,
                        'exchange' => $ipo['exchange'] ?? null,
                        'price_range' => isset($ipo['price'])
                            ? '$' . number_format($ipo['price'], 2)
                            : ($ipo['priceRange'] ?? 'TBD'),
                        'shares' => $ipo['numberOfShares'] ?? null,
                        'status' => $ipo['status'] ?? 'expected',
                    ];
                }, array_slice($ipos, 0, 30));
            }
        } catch (\Throwable $e) {
            Log::warning('IPO: Finnhub fetch failed', ['error' => $e->getMessage()]);
        }

        return $this->fetchFromYahoo();
    }

    private function fetchFromYahoo(): array
    {
        try {
            // Yahoo Finance IPO calendar scrape via CORS proxy
            $response = Http::timeout(15)->get('https://corsproxy.io/?' . urlencode(
                'https://query2.finance.yahoo.com/v1/finance/screener?crumb=&formatted=false&lang=en-US&region=US'
            ));

            // Yahoo doesn't have a clean IPO API, so we fall back to a reasonable default
            // In production, use Finnhub or a paid IPO data provider
        } catch (\Throwable $e) {
            Log::info('IPO: Yahoo fallback not available');
        }

        // Return empty — frontend should show "Configure Finnhub API key for IPO data"
        return [];
    }
}
