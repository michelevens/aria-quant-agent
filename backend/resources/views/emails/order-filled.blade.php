@extends('emails.base')
@section('header-subtitle', 'Order Filled')

@section('content')
<p class="greeting">Order Filled!</p>

<div class="highlight" style="background: {{ $order->side === 'BUY' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)' }};">
    <div class="label">{{ $order->side }} — FILLED</div>
    <div class="value">{{ number_format($order->filled_qty, 2) }} {{ $order->symbol }}</div>
</div>

<div class="card">
    <div class="card-title">Fill Details</div>
    <table>
        <tr>
            <td class="stat-label">Symbol</td>
            <td class="stat-value">{{ $order->symbol }}</td>
        </tr>
        <tr>
            <td class="stat-label">Side</td>
            <td class="stat-value">
                <span class="badge {{ $order->side === 'BUY' ? 'badge-green' : 'badge-red' }}">{{ $order->side }}</span>
            </td>
        </tr>
        <tr>
            <td class="stat-label">Filled Quantity</td>
            <td class="stat-value">{{ number_format($order->filled_qty, 2) }}</td>
        </tr>
        <tr>
            <td class="stat-label">Fill Price</td>
            <td class="stat-value">${{ number_format($order->filled_price, 2) }}</td>
        </tr>
        <tr>
            <td class="stat-label">Total</td>
            <td class="stat-value">${{ number_format($order->filled_qty * $order->filled_price, 2) }}</td>
        </tr>
        @if($order->pnl !== null)
        <tr>
            <td class="stat-label">Realized P&L</td>
            <td class="stat-value {{ $order->pnl >= 0 ? 'up' : 'down' }}">
                {{ $order->pnl >= 0 ? '+' : '' }}${{ number_format($order->pnl, 2) }}
            </td>
        </tr>
        @endif
        <tr>
            <td class="stat-label">Filled At</td>
            <td class="stat-value">{{ $order->filled_at?->format('M j, Y g:i A') }} ET</td>
        </tr>
    </table>
</div>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/portfolio" class="btn">View Portfolio</a>
</div>
@endsection
