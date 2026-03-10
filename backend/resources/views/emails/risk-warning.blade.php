@extends('emails.base')
@section('header-subtitle', 'Risk Warning')

@section('content')
<p class="greeting">Risk Alert</p>

<div class="highlight" style="background: linear-gradient(135deg, #dc2626, #ef4444);">
    <div class="label">{{ $warning['type'] ?? 'Portfolio Risk' }}</div>
    <div class="value">{{ $warning['title'] ?? 'Action Required' }}</div>
</div>

<div class="card">
    <div class="card-title">Risk Details</div>
    <table>
        @if(isset($warning['metric']))
        <tr>
            <td class="stat-label">Metric</td>
            <td class="stat-value">{{ $warning['metric'] }}</td>
        </tr>
        @endif
        @if(isset($warning['current_value']))
        <tr>
            <td class="stat-label">Current Value</td>
            <td class="stat-value down">{{ $warning['current_value'] }}</td>
        </tr>
        @endif
        @if(isset($warning['threshold']))
        <tr>
            <td class="stat-label">Threshold</td>
            <td class="stat-value">{{ $warning['threshold'] }}</td>
        </tr>
        @endif
        @if(isset($warning['symbol']))
        <tr>
            <td class="stat-label">Position</td>
            <td class="stat-value">{{ $warning['symbol'] }}</td>
        </tr>
        @endif
    </table>
</div>

<p class="text">{{ $warning['description'] ?? 'One or more risk thresholds have been breached. Review your positions and consider adjusting your exposure.' }}</p>

@if(isset($warning['suggestions']) && count($warning['suggestions']) > 0)
<div class="card">
    <div class="card-title">Suggested Actions</div>
    @foreach($warning['suggestions'] as $suggestion)
    <p class="text" style="margin: 4px 0;">• {{ $suggestion }}</p>
    @endforeach
</div>
@endif

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/risk" class="btn">View Risk Dashboard</a>
</div>
@endsection
