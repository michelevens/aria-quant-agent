<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiCredential;
use App\Models\UserSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $settings = $request->user()
            ->settings()
            ->pluck('value', 'key')
            ->toArray();

        // Include which providers have credentials (but not the credentials themselves)
        $providers = $request->user()
            ->apiCredentials()
            ->pluck('provider')
            ->toArray();

        return response()->json([
            'settings' => $settings,
            'configured_providers' => $providers,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => ['required', 'array'],
        ]);

        foreach ($request->settings as $key => $value) {
            UserSetting::updateOrCreate(
                ['user_id' => $request->user()->id, 'key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated']);
    }

    public function storeCredential(Request $request): JsonResponse
    {
        $request->validate([
            'provider' => ['required', 'in:alpaca,finnhub,alpha_vantage'],
            'credentials' => ['required', 'array'],
        ]);

        ApiCredential::updateOrCreate(
            ['user_id' => $request->user()->id, 'provider' => $request->provider],
            ['credentials' => $request->credentials]
        );

        return response()->json(['message' => ucfirst($request->provider) . ' credentials saved']);
    }

    public function deleteCredential(Request $request, string $provider): JsonResponse
    {
        $request->user()->apiCredentials()->where('provider', $provider)->delete();

        return response()->json(['message' => 'Credentials removed']);
    }

    public function getCredential(Request $request, string $provider): JsonResponse
    {
        $cred = $request->user()->apiCredentials()->where('provider', $provider)->first();

        if (! $cred) {
            return response()->json(['credentials' => null]);
        }

        return response()->json(['credentials' => $cred->credentials]);
    }
}
