<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Holding;
use App\Models\Order;
use App\Models\Trade;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Platform overview stats
     */
    public function dashboard(): JsonResponse
    {
        $totalUsers = User::count();
        $newUsersToday = User::whereDate('created_at', today())->count();
        $newUsersWeek = User::where('created_at', '>=', now()->subWeek())->count();
        $totalOrders = Order::count();
        $totalTrades = Trade::count();
        $totalAlerts = Alert::count();

        $planDistribution = User::select('plan', DB::raw('count(*) as count'))
            ->groupBy('plan')
            ->pluck('count', 'plan');

        $totalPortfolioValue = DB::table('portfolio_balances')->sum('cash')
            + Holding::sum(DB::raw('quantity * avg_cost'));

        $recentSignups = User::latest()
            ->take(10)
            ->get(['id', 'name', 'email', 'plan', 'role', 'created_at']);

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'new_users_today' => $newUsersToday,
                'new_users_week' => $newUsersWeek,
                'total_orders' => $totalOrders,
                'total_trades' => $totalTrades,
                'total_alerts' => $totalAlerts,
                'total_portfolio_value' => round($totalPortfolioValue, 2),
                'plan_distribution' => $planDistribution,
            ],
            'recent_signups' => $recentSignups,
        ]);
    }

    /**
     * List all users with pagination
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        if ($plan = $request->input('plan')) {
            $query->where('plan', $plan);
        }

        $users = $query->withCount(['orders', 'alerts', 'holdings', 'strategies'])
            ->latest()
            ->paginate($request->input('per_page', 25));

        return response()->json($users);
    }

    /**
     * Get single user details
     */
    public function user(User $user): JsonResponse
    {
        $user->loadCount(['orders', 'trades', 'alerts', 'holdings', 'strategies', 'watchlists', 'journalEntries']);
        $user->load('portfolioBalance');

        return response()->json([
            'user' => $user,
            'portfolio_value' => $user->cash,
        ]);
    }

    /**
     * Update a user (role, plan, etc.)
     */
    public function updateUser(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role' => ['sometimes', 'in:user,admin,moderator'],
            'plan' => ['sometimes', 'in:free,pro,enterprise'],
            'name' => ['sometimes', 'string', 'max:255'],
        ]);

        $user->update($request->only(['role', 'plan', 'name']));

        return response()->json(['user' => $user->fresh()]);
    }

    /**
     * Ban/deactivate a user (revoke all tokens)
     */
    public function banUser(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot ban an admin'], 403);
        }

        $user->tokens()->delete();
        $user->update(['role' => 'banned']);

        return response()->json(['message' => "User {$user->email} has been banned"]);
    }

    /**
     * Unban a user
     */
    public function unbanUser(User $user): JsonResponse
    {
        $user->update(['role' => 'user']);

        return response()->json(['message' => "User {$user->email} has been unbanned"]);
    }

    /**
     * Delete a user and all their data
     */
    public function deleteUser(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot delete an admin'], 403);
        }

        $email = $user->email;
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => "User {$email} has been deleted"]);
    }

    /**
     * Platform-wide recent orders
     */
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::with('user:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 25));

        return response()->json($orders);
    }

    /**
     * Platform-wide alerts
     */
    public function alerts(Request $request): JsonResponse
    {
        $alerts = Alert::with('user:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 25));

        return response()->json($alerts);
    }

    /**
     * Send a system-wide announcement (stored in notifications)
     */
    public function announce(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $users = User::where('role', '!=', 'banned')->get();
        $count = 0;

        foreach ($users as $user) {
            $user->notifications()->create([
                'type' => 'system',
                'title' => $request->input('title'),
                'message' => $request->input('message'),
                'channel' => 'in_app',
            ]);
            $count++;
        }

        return response()->json([
            'message' => "Announcement sent to {$count} users",
        ]);
    }

    /**
     * Seed demo data for all users
     */
    public function seedDemo(): JsonResponse
    {
        Artisan::call('db:seed', ['--class' => 'DemoDataSeeder', '--force' => true]);

        return response()->json([
            'message' => 'Demo data seeded successfully',
            'output' => trim(Artisan::output()),
        ]);
    }
}
