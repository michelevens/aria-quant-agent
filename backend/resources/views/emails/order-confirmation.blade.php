@extends('emails.base')
@section('header-subtitle', 'Order Confirmation')

@section('content')
<p class="greeting">Order Placed</p>

<div class="highlight" style="background: {{ $order->side === 'BUY' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)' }};">
    <div class="label">{{ $order->side }}</div>
    <div class="value">{{ $order->quantity }} {{ $order->symbol }}</div>
</div>

<div class="card">
    <div class="card-title">Order Details</div>
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
            <td class="stat-label">Type</td>
            <td class="stat-value">{{ $order->type }}</td>
        </tr>
        <tr>
            <td class="stat-label">Quantity</td>
            <td class="stat-value">{{ number_format($order->quantity, 2) }}</td>
        </tr>
        @if($order->limit_price)
        <tr>
            <td class="stat-label">Limit Price</td>
            <td class="stat-value">${{ number_format($order->limit_price, 2) }}</td>
        </tr>
        @endif
        @if($order->stop_price)
        <tr>
            <td class="stat-label">Stop Price</td>
            <td class="stat-value">${{ number_format($order->stop_price, 2) }}</td>
        </tr>
        @endif
        @if($order->bracket_take_profit)
        <tr>
            <td class="stat-label">Take Profit</td>
            <td class="stat-value up">${{ number_format($order->bracket_take_profit, 2) }}</td>
        </tr>
        @endif
        @if($order->bracket_stop_loss)
        <tr>
            <td class="stat-label">Stop Loss</td>
            <td class="stat-value down">${{ number_format($order->bracket_stop_loss, 2) }}</td>
        </tr>
        @endif
        <tr>
            <td class="stat-label">Time in Force</td>
            <td class="stat-value">{{ $order->tif }}</td>
        </tr>
        <tr>
            <td class="stat-label">Status</td>
            <td class="stat-value"><span class="badge badge-blue">{{ $order->status }}</span></td>
        </tr>
        <tr>
            <td class="stat-label">Placed At</td>
            <td class="stat-value">{{ $order->created_at->format('M j, Y g:i A') }} ET</td>
        </tr>
    </table>
</div>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/orders" class="btn">View Orders</a>
</div>
@endsection
