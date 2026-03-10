<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Watchlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WatchlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $watchlists = $request->user()
            ->watchlists()
            ->with('items')
            ->get();

        return response()->json(['watchlists' => $watchlists]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'category' => ['sometimes', 'in:stocks,forex,crypto'],
            'symbols' => ['sometimes', 'array'],
            'symbols.*' => ['string', 'max:10'],
        ]);

        $watchlist = Watchlist::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'category' => $request->category ?? 'stocks',
        ]);

        if ($request->has('symbols')) {
            foreach ($request->symbols as $i => $symbol) {
                $watchlist->items()->create([
                    'symbol' => strtoupper($symbol),
                    'sort_order' => $i,
                ]);
            }
        }

        return response()->json(['watchlist' => $watchlist->load('items')], 201);
    }

    public function update(Request $request, Watchlist $watchlist): JsonResponse
    {
        abort_unless($watchlist->user_id === $request->user()->id, 403);

        $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'symbols' => ['sometimes', 'array'],
            'symbols.*' => ['string', 'max:10'],
        ]);

        if ($request->has('name')) {
            $watchlist->update(['name' => $request->name]);
        }

        if ($request->has('symbols')) {
            $watchlist->items()->delete();
            foreach ($request->symbols as $i => $symbol) {
                $watchlist->items()->create([
                    'symbol' => strtoupper($symbol),
                    'sort_order' => $i,
                ]);
            }
        }

        return response()->json(['watchlist' => $watchlist->load('items')]);
    }

    public function destroy(Request $request, Watchlist $watchlist): JsonResponse
    {
        abort_unless($watchlist->user_id === $request->user()->id, 403);
        $watchlist->delete();

        return response()->json(['message' => 'Watchlist deleted']);
    }

    public function addSymbol(Request $request, Watchlist $watchlist): JsonResponse
    {
        abort_unless($watchlist->user_id === $request->user()->id, 403);

        $request->validate(['symbol' => ['required', 'string', 'max:10']]);

        $watchlist->items()->firstOrCreate(
            ['symbol' => strtoupper($request->symbol)],
            ['sort_order' => $watchlist->items()->count()]
        );

        return response()->json(['watchlist' => $watchlist->load('items')]);
    }

    public function removeSymbol(Request $request, Watchlist $watchlist, string $symbol): JsonResponse
    {
        abort_unless($watchlist->user_id === $request->user()->id, 403);
        $watchlist->items()->where('symbol', strtoupper($symbol))->delete();

        return response()->json(['watchlist' => $watchlist->load('items')]);
    }
}
