@extends('emails.base')
@section('header-subtitle', 'Trading Signal')

@section('content')
<p class="greeting">New Signal: {{ $signal['symbol'] }}</p>

<div class="highlight" style="background: {{ $signal['action'] === 'BUY' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)' }};">
    <div class="label">Signal</div>
    <div class="value">{{ $signal['action'] }} {{ $signal['symbol'] }}</div>
</div>

<div class="card">
    <div class="card-title">Signal Analysis</div>
    <table>
        <tr>
            <td class="stat-label">Strategy</td>
            <td class="stat-value">{{ $signal['strategy'] ?? 'Multi-Factor Composite' }}</td>
        </tr>
        <tr>
            <td class="stat-label">Confidence</td>
            <td class="stat-value">{{ $signal['confidence'] ?? 75 }}%</td>
        </tr>
        <tr>
            <td class="stat-label">Entry Price</td>
            <td class="stat-value">${{ number_format($signal['price'] ?? 0, 2) }}</td>
        </tr>
        @if(isset($signal['target']))
        <tr>
            <td class="stat-label">Target</td>
            <td class="stat-value up">${{ number_format($signal['target'], 2) }}</td>
        </tr>
        @endif
        @if(isset($signal['stop_loss']))
        <tr>
            <td class="stat-label">Stop Loss</td>
            <td class="stat-value down">${{ number_format($signal['stop_loss'], 2) }}</td>
        </tr>
        @endif
        <tr>
            <td class="stat-label">Timeframe</td>
            <td class="stat-value">{{ $signal['timeframe'] ?? '1D' }}</td>
        </tr>
    </table>
</div>

@if(isset($signal['reasons']) && count($signal['reasons']) > 0)
<div class="card">
    <div class="card-title">Key Factors</div>
    @foreach($signal['reasons'] as $reason)
    <p class="text" style="margin: 4px 0;">• {{ $reason }}</p>
    @endforeach
</div>
@endif

<p class="text" style="font-size: 12px; color: #64748b;">This is not financial advice. Signals are generated algorithmically and should be used as one input in your decision-making process.</p>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/signals" class="btn">View All Signals</a>
</div>
@endsection
