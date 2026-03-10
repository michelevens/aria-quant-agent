@extends('emails.base')
@section('header-subtitle', 'Daily Portfolio Summary')

@section('content')
<p class="greeting">Market Close — {{ $date ?? now()->format('l, M j, Y') }}</p>

<div class="highlight">
    <div class="label">Portfolio Value</div>
    <div class="value">${{ number_format($portfolio['total_value'] ?? 0, 2) }}</div>
</div>

<div class="card">
    <div class="card-title">Today's Performance</div>
    <table>
        <tr>
            <td class="stat-label">Day Change</td>
            <td class="stat-value {{ ($portfolio['day_change'] ?? 0) >= 0 ? 'up' : 'down' }}">
                {{ ($portfolio['day_change'] ?? 0) >= 0 ? '+' : '' }}${{ number_format($portfolio['day_change'] ?? 0, 2) }}
                ({{ ($portfolio['day_change_pct'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($portfolio['day_change_pct'] ?? 0, 2) }}%)
            </td>
        </tr>
        <tr>
            <td class="stat-label">Total P&L</td>
            <td class="stat-value {{ ($portfolio['total_pnl'] ?? 0) >= 0 ? 'up' : 'down' }}">
                {{ ($portfolio['total_pnl'] ?? 0) >= 0 ? '+' : '' }}${{ number_format($portfolio['total_pnl'] ?? 0, 2) }}
            </td>
        </tr>
        <tr>
            <td class="stat-label">Cash</td>
            <td class="stat-value">${{ number_format($portfolio['cash'] ?? 0, 2) }}</td>
        </tr>
        <tr>
            <td class="stat-label">Positions</td>
            <td class="stat-value">{{ $portfolio['position_count'] ?? 0 }}</td>
        </tr>
        <tr>
            <td class="stat-label">Winners / Losers</td>
            <td class="stat-value">
                <span class="up">{{ $portfolio['winners'] ?? 0 }}</span> /
                <span class="down">{{ $portfolio['losers'] ?? 0 }}</span>
            </td>
        </tr>
    </table>
</div>

@if(isset($top_movers) && count($top_movers) > 0)
<div class="card">
    <div class="card-title">Top Movers Today</div>
    <table>
        @foreach($top_movers as $mover)
        <tr>
            <td class="stat-label">{{ $mover['symbol'] }}</td>
            <td class="stat-value {{ $mover['change_pct'] >= 0 ? 'up' : 'down' }}">
                {{ $mover['change_pct'] >= 0 ? '+' : '' }}{{ number_format($mover['change_pct'], 2) }}%
            </td>
        </tr>
        @endforeach
    </table>
</div>
@endif

@if(isset($alerts_triggered) && $alerts_triggered > 0)
<div class="card">
    <div class="card-title">Alerts Today</div>
    <p class="text"><span class="badge badge-amber">{{ $alerts_triggered }} alert(s) triggered</span></p>
</div>
@endif

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/dashboard" class="btn">View Dashboard</a>
</div>
@endsection
