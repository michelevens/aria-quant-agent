<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $alerts = $request->user()->alerts()->orderByDesc('created_at')->get();

        return response()->json(['alerts' => $alerts]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'category' => ['required', 'in:price,technical,volume,sentiment,portfolio'],
            'config' => ['required', 'array'],
            'recurring' => ['sometimes', 'boolean'],
            'cooldown_ms' => ['sometimes', 'integer', 'min:0'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $alert = Alert::create([
            'user_id' => $request->user()->id,
            ...$request->only(['name', 'category', 'config', 'recurring', 'cooldown_ms', 'expires_at']),
        ]);

        return response()->json(['alert' => $alert], 201);
    }

    public function update(Request $request, Alert $alert): JsonResponse
    {
        abort_unless($alert->user_id === $request->user()->id, 403);

        $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'config' => ['sometimes', 'array'],
            'status' => ['sometimes', 'in:active,paused'],
            'recurring' => ['sometimes', 'boolean'],
        ]);

        $alert->update($request->only(['name', 'config', 'status', 'recurring']));

        return response()->json(['alert' => $alert]);
    }

    public function destroy(Request $request, Alert $alert): JsonResponse
    {
        abort_unless($alert->user_id === $request->user()->id, 403);
        $alert->delete();

        return response()->json(['message' => 'Alert deleted']);
    }

    public function history(Request $request): JsonResponse
    {
        $history = $request->user()
            ->alertHistory()
            ->with('alert:id,name,category')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json(['history' => $history]);
    }

    // Workflows
    public function workflows(Request $request): JsonResponse
    {
        $workflows = $request->user()->workflows()->with('triggerAlert:id,name')->get();

        return response()->json(['workflows' => $workflows]);
    }

    public function storeWorkflow(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'trigger_alert_id' => ['required', 'exists:alerts,id'],
            'conditions' => ['required', 'array'],
            'actions' => ['required', 'array'],
        ]);

        $alert = Alert::findOrFail($request->trigger_alert_id);
        abort_unless($alert->user_id === $request->user()->id, 403);

        $workflow = Workflow::create([
            'user_id' => $request->user()->id,
            ...$request->only(['name', 'trigger_alert_id', 'conditions', 'actions']),
        ]);

        return response()->json(['workflow' => $workflow], 201);
    }

    public function destroyWorkflow(Request $request, Workflow $workflow): JsonResponse
    {
        abort_unless($workflow->user_id === $request->user()->id, 403);
        $workflow->delete();

        return response()->json(['message' => 'Workflow deleted']);
    }
}
