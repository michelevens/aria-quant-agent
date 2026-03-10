@extends('emails.base')
@section('header-subtitle', 'Alert Triggered')

@section('content')
<p class="greeting">Alert Triggered!</p>

<div class="highlight">
    <div class="label">{{ strtoupper($alert->category) }} Alert</div>
    <div class="value">{{ $alert->name }}</div>
</div>

<div class="card">
    <div class="card-title">Alert Details</div>
    <table>
        <tr>
            <td class="stat-label">Type</td>
            <td class="stat-value">{{ ucfirst($alert->category) }}</td>
        </tr>
        @if(isset($alert->config['symbol']))
        <tr>
            <td class="stat-label">Symbol</td>
            <td class="stat-value">{{ $alert->config['symbol'] }}</td>
        </tr>
        @endif
        @if(isset($alert->config['condition']))
        <tr>
            <td class="stat-label">Condition</td>
            <td class="stat-value">{{ str_replace('_', ' ', ucfirst($alert->config['condition'])) }}</td>
        </tr>
        @endif
        @if(isset($alert->config['targetValue']))
        <tr>
            <td class="stat-label">Target</td>
            <td class="stat-value">${{ number_format($alert->config['targetValue'], 2) }}</td>
        </tr>
        @endif
        <tr>
            <td class="stat-label">Triggered At</td>
            <td class="stat-value">{{ $alert->triggered_at?->format('M j, Y g:i A') ?? now()->format('M j, Y g:i A') }} ET</td>
        </tr>
        <tr>
            <td class="stat-label">Status</td>
            <td class="stat-value">
                @if($alert->recurring)
                    <span class="badge badge-blue">Recurring</span>
                @else
                    <span class="badge badge-amber">One-time</span>
                @endif
            </td>
        </tr>
    </table>
</div>

<p class="text">{{ $message ?? 'Your alert condition has been met. Review the details and take action if needed.' }}</p>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/alerts" class="btn">View Alerts</a>
</div>
@endsection
