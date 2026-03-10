@extends('emails.base')
@section('header-subtitle', 'Weekly Performance Report')

@section('content')
<p class="greeting">Weekly Recap — {{ $period ?? 'This Week' }}</p>

<div class="highlight">
    <div class="label">Weekly Return</div>
    <div class="value" style="color: {{ ($report['weekly_return'] ?? 0) >= 0 ? '#22c55e' : '#ef4444' }};">
        {{ ($report['weekly_return'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($report['weekly_return'] ?? 0, 2) }}%
    </div>
</div>

<div class="card">
    <div class="card-title">Performance Summary</div>
    <table>
        <tr>
            <td class="stat-label">Starting Value</td>
            <td class="stat-value">${{ number_format($report['start_value'] ?? 0, 2) }}</td>
        </tr>
        <tr>
            <td class="stat-label">Ending Value</td>
            <td class="stat-value">${{ number_format($report['end_value'] ?? 0, 2) }}</td>
        </tr>
        <tr>
            <td class="stat-label">Net Change</td>
            <td class="stat-value {{ ($report['net_change'] ?? 0) >= 0 ? 'up' : 'down' }}">
                {{ ($report['net_change'] ?? 0) >= 0 ? '+' : '' }}${{ number_format($report['net_change'] ?? 0, 2) }}
            </td>
        </tr>
        <tr>
            <td class="stat-label">Trades Executed</td>
            <td class="stat-value">{{ $report['trades_count'] ?? 0 }}</td>
        </tr>
        <tr>
            <td class="stat-label">Win Rate</td>
            <td class="stat-value">{{ number_format($report['win_rate'] ?? 0, 1) }}%</td>
        </tr>
        <tr>
            <td class="stat-label">Best Position</td>
            <td class="stat-value up">{{ $report['best_position'] ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="stat-label">Worst Position</td>
            <td class="stat-value down">{{ $report['worst_position'] ?? 'N/A' }}</td>
        </tr>
    </table>
</div>

@if(isset($report['signals_generated']) && $report['signals_generated'] > 0)
<div class="card">
    <div class="card-title">Signal Activity</div>
    <table>
        <tr>
            <td class="stat-label">Signals Generated</td>
            <td class="stat-value">{{ $report['signals_generated'] }}</td>
        </tr>
        <tr>
            <td class="stat-label">Alerts Triggered</td>
            <td class="stat-value">{{ $report['alerts_triggered'] ?? 0 }}</td>
        </tr>
    </table>
</div>
@endif

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/analytics" class="btn">Full Analytics</a>
</div>
@endsection
