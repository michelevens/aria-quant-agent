<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderConfirmationEmail;
use App\Models\Order;
use App\Models\Trade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'symbol' => ['required', 'string', 'max:10'],
            'side' => ['required', 'in:BUY,SELL'],
            'type' => ['required', 'in:MARKET,LIMIT,STOP,STOP_LIMIT,TRAILING_STOP,OCO,BRACKET'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'limit_price' => ['nullable', 'numeric', 'gt:0'],
            'stop_price' => ['nullable', 'numeric', 'gt:0'],
            'trail_amount' => ['nullable', 'numeric', 'gt:0'],
            'trail_percent' => ['nullable', 'numeric', 'gt:0'],
            'bracket_take_profit' => ['nullable', 'numeric', 'gt:0'],
            'bracket_stop_loss' => ['nullable', 'numeric', 'gt:0'],
            'tif' => ['sometimes', 'in:DAY,GTC,IOC,FOK'],
        ]);

        $order = Order::create([
            'user_id' => $request->user()->id,
            ...$request->only([
                'symbol', 'side', 'type', 'quantity',
                'limit_price', 'stop_price', 'trail_amount', 'trail_percent',
                'bracket_take_profit', 'bracket_stop_loss',
            ]),
            'tif' => $request->tif ?? 'DAY',
        ]);

        Mail::to($request->user())->queue(new OrderConfirmationEmail($order));

        return response()->json(['order' => $order], 201);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 403);
        abort_unless($order->status === 'OPEN', 422, 'Order is not open');

        $order->update(['status' => 'CANCELLED']);

        return response()->json(['order' => $order]);
    }

    public function trades(Request $request): JsonResponse
    {
        $trades = $request->user()
            ->trades()
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json(['trades' => $trades]);
    }
}
