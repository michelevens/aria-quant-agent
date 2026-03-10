<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Strategy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StrategyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'strategies' => $request->user()->strategies()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'entry_conditions' => ['required', 'array'],
            'exit_conditions' => ['required', 'array'],
            'stop_loss' => ['nullable', 'string'],
            'take_profit' => ['nullable', 'string'],
            'position_size' => ['nullable', 'string'],
        ]);

        $strategy = Strategy::create([
            'user_id' => $request->user()->id,
            ...$request->only(['name', 'entry_conditions', 'exit_conditions', 'stop_loss', 'take_profit', 'position_size']),
        ]);

        return response()->json(['strategy' => $strategy], 201);
    }

    public function update(Request $request, Strategy $strategy): JsonResponse
    {
        abort_unless($strategy->user_id === $request->user()->id, 403);

        $strategy->update($request->only([
            'name', 'entry_conditions', 'exit_conditions',
            'stop_loss', 'take_profit', 'position_size',
        ]));

        return response()->json(['strategy' => $strategy]);
    }

    public function destroy(Request $request, Strategy $strategy): JsonResponse
    {
        abort_unless($strategy->user_id === $request->user()->id, 403);
        $strategy->delete();

        return response()->json(['message' => 'Strategy deleted']);
    }
}
