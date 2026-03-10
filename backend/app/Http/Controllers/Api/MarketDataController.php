<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FearGreedService;
use App\Services\IpoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MarketDataController extends Controller
{
    public function fearGreed(): JsonResponse
    {
        $data = Cache::remember('fear-greed-index', 300, function () {
            return app(FearGreedService::class)->calculate();
        });

        return response()->json($data);
    }

    public function ipos(): JsonResponse
    {
        $data = Cache::remember('upcoming-ipos', 3600, function () {
            return app(IpoService::class)->getUpcoming();
        });

        return response()->json(['ipos' => $data]);
    }

    /**
     * Proxy Yahoo Finance chart data to avoid CORS issues
     */
    public function yahooChart(Request $request): JsonResponse
    {
        $symbol = $request->input('symbol');
        $range = $request->input('range', '1d');
        $interval = $request->input('interval', '5m');

        if (!$symbol || !preg_match('/^[A-Z0-9\-\.\^]{1,12}$/', $symbol)) {
            return response()->json(['error' => 'Invalid symbol'], 400);
        }

        $allowedRanges = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'];
        $allowedIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '1h', '1d', '5d', '1wk', '1mo'];

        if (!in_array($range, $allowedRanges) || !in_array($interval, $allowedIntervals)) {
            return response()->json(['error' => 'Invalid range or interval'], 400);
        }

        $cacheKey = "yahoo-chart:{$symbol}:{$range}:{$interval}";
        $cacheTtl = $range === '1d' ? 60 : 300;

        $data = Cache::remember($cacheKey, $cacheTtl, function () use ($symbol, $range, $interval) {
            $url = "https://query2.finance.yahoo.com/v8/finance/chart/{$symbol}";

            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ])->get($url, [
                'range' => $range,
                'interval' => $interval,
                'includePrePost' => 'false',
            ]);

            if (!$response->successful()) {
                return null;
            }

            return $response->json();
        });

        if (!$data) {
            Cache::forget($cacheKey);
            return response()->json(['error' => "Could not load data for {$symbol}"], 502);
        }

        return response()->json($data);
    }

    /**
     * Proxy Yahoo Finance search/news
     */
    public function yahooSearch(Request $request): JsonResponse
    {
        $q = $request->input('q', 'stock market');

        $cacheKey = 'yahoo-search:' . md5($q);

        $data = Cache::remember($cacheKey, 300, function () use ($q) {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ])->get('https://query2.finance.yahoo.com/v1/finance/search', [
                'q' => $q,
                'newsCount' => 20,
                'quotesCount' => 0,
            ]);

            if (!$response->successful()) {
                return null;
            }

            return $response->json();
        });

        if (!$data) {
            Cache::forget($cacheKey);
            return response()->json(['error' => 'Search failed'], 502);
        }

        return response()->json($data);
    }
}
