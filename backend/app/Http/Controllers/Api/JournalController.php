<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = $request->user()
            ->journalEntries()
            ->orderByDesc('entry_date')
            ->limit(100)
            ->get();

        return response()->json(['entries' => $entries]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'entry_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'trades_data' => ['nullable', 'array'],
            'mood' => ['nullable', 'integer', 'between:1,5'],
            'lessons' => ['nullable', 'string'],
        ]);

        $entry = JournalEntry::updateOrCreate(
            ['user_id' => $request->user()->id, 'entry_date' => $request->entry_date],
            $request->only(['notes', 'trades_data', 'mood', 'lessons'])
        );

        return response()->json(['entry' => $entry], 201);
    }

    public function destroy(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        abort_unless($journalEntry->user_id === $request->user()->id, 403);
        $journalEntry->delete();

        return response()->json(['message' => 'Entry deleted']);
    }
}
