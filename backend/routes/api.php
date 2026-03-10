<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\MarketDataController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\StrategyController;
use App\Http\Controllers\Api\WatchlistController;
use Illuminate\Support\Facades\Route;

// Public auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Public market data
Route::get('/market/fear-greed', [MarketDataController::class, 'fearGreed']);
Route::get('/market/ipos', [MarketDataController::class, 'ipos']);
Route::get('/market/chart', [MarketDataController::class, 'yahooChart']);
Route::get('/market/search', [MarketDataController::class, 'yahooSearch']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/email/verify', [AuthController::class, 'verifyEmail']);
    Route::post('/email/resend', [AuthController::class, 'resendVerification']);

    // Portfolio
    Route::get('/portfolio', [PortfolioController::class, 'index']);
    Route::post('/portfolio/sync', [PortfolioController::class, 'sync']);
    Route::put('/portfolio/holding', [PortfolioController::class, 'updateHolding']);

    // Watchlists
    Route::apiResource('watchlists', WatchlistController::class)->except(['show']);
    Route::post('/watchlists/{watchlist}/symbols', [WatchlistController::class, 'addSymbol']);
    Route::delete('/watchlists/{watchlist}/symbols/{symbol}', [WatchlistController::class, 'removeSymbol']);

    // Orders & Trades
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::get('/trades', [OrderController::class, 'trades']);

    // Alerts & Workflows
    Route::apiResource('alerts', AlertController::class)->except(['show']);
    Route::get('/alerts/history', [AlertController::class, 'history']);
    Route::get('/workflows', [AlertController::class, 'workflows']);
    Route::post('/workflows', [AlertController::class, 'storeWorkflow']);
    Route::delete('/workflows/{workflow}', [AlertController::class, 'destroyWorkflow']);

    // Strategies
    Route::apiResource('strategies', StrategyController::class)->except(['show']);

    // Journal
    Route::get('/journal', [JournalController::class, 'index']);
    Route::post('/journal', [JournalController::class, 'store']);
    Route::delete('/journal/{journalEntry}', [JournalController::class, 'destroy']);

    // Settings & API Credentials
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/credentials', [SettingsController::class, 'storeCredential']);
    Route::get('/credentials/{provider}', [SettingsController::class, 'getCredential']);
    Route::delete('/credentials/{provider}', [SettingsController::class, 'deleteCredential']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Admin routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{user}', [AdminController::class, 'user']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::post('/users/{user}/ban', [AdminController::class, 'banUser']);
        Route::post('/users/{user}/unban', [AdminController::class, 'unbanUser']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::get('/alerts', [AdminController::class, 'alerts']);
        Route::post('/announce', [AdminController::class, 'announce']);
        Route::post('/seed-demo', [AdminController::class, 'seedDemo']);
    });
});
