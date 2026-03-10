<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holding;
use App\Models\PortfolioBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $holdings = $request->user()->holdings()->get();
        $cash = $request->user()->portfolioBalance?->cash ?? 100000;

        return response()->json([
            'holdings' => $holdings,
            'cash' => $cash,
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'holdings' => ['required', 'array'],
            'holdings.*.symbol' => ['required', 'string', 'max:10'],
            'holdings.*.quantity' => ['required', 'numeric', 'min:0'],
            'holdings.*.avg_cost' => ['required', 'numeric', 'min:0'],
            'cash' => ['required', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        // Replace all holdings
        $user->holdings()->delete();

        foreach ($request->holdings as $h) {
            if ($h['quantity'] > 0) {
                Holding::create([
                    'user_id' => $user->id,
                    'symbol' => strtoupper($h['symbol']),
                    'quantity' => $h['quantity'],
                    'avg_cost' => $h['avg_cost'],
                ]);
            }
        }

        PortfolioBalance::updateOrCreate(
            ['user_id' => $user->id],
            ['cash' => $request->cash]
        );

        return response()->json(['message' => 'Portfolio synced']);
    }

    public function updateHolding(Request $request): JsonResponse
    {
        $request->validate([
            'symbol' => ['required', 'string', 'max:10'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'avg_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $holding = Holding::updateOrCreate(
            ['user_id' => $request->user()->id, 'symbol' => strtoupper($request->symbol)],
            ['quantity' => $request->quantity, 'avg_cost' => $request->avg_cost]
        );

        if ($request->quantity <= 0) {
            $holding->delete();
            return response()->json(['message' => 'Position closed']);
        }

        return response()->json(['holding' => $holding]);
    }
}
