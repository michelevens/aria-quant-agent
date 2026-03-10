<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FearGreedService;
use App\Services\IpoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

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
}
