@extends('emails.base')
@section('header-subtitle', 'IPO Alert')

@section('content')
<p class="greeting">Upcoming IPO Alert</p>
<p class="text">A new IPO matching your interests is scheduled. Here are the details:</p>

<div class="highlight">
    <div class="label">{{ $ipo['name'] ?? 'New IPO' }}</div>
    <div class="value">{{ $ipo['symbol'] ?? 'TBD' }}</div>
</div>

<div class="card">
    <div class="card-title">IPO Details</div>
    <table>
        <tr>
            <td class="stat-label">Company</td>
            <td class="stat-value">{{ $ipo['name'] ?? 'TBD' }}</td>
        </tr>
        <tr>
            <td class="stat-label">Symbol</td>
            <td class="stat-value">{{ $ipo['symbol'] ?? 'TBD' }}</td>
        </tr>
        <tr>
            <td class="stat-label">Expected Date</td>
            <td class="stat-value">{{ $ipo['date'] ?? 'TBD' }}</td>
        </tr>
        <tr>
            <td class="stat-label">Exchange</td>
            <td class="stat-value">{{ $ipo['exchange'] ?? 'TBD' }}</td>
        </tr>
        <tr>
            <td class="stat-label">Price Range</td>
            <td class="stat-value">{{ $ipo['price_range'] ?? 'TBD' }}</td>
        </tr>
        @if(isset($ipo['shares']))
        <tr>
            <td class="stat-label">Shares Offered</td>
            <td class="stat-value">{{ number_format($ipo['shares']) }}</td>
        </tr>
        @endif
        <tr>
            <td class="stat-label">Status</td>
            <td class="stat-value"><span class="badge badge-blue">{{ ucfirst($ipo['status'] ?? 'Expected') }}</span></td>
        </tr>
    </table>
</div>

<p class="text" style="font-size: 12px; color: #64748b;">IPO dates and pricing are subject to change. This is informational only and not a recommendation to invest.</p>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/ipos" class="btn">View All IPOs</a>
</div>
@endsection
