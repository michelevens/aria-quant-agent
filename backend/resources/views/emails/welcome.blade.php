@extends('emails.base')
@section('header-subtitle', 'Welcome to AriaQuant')

@section('content')
<p class="greeting">Welcome, {{ $user->name }}!</p>
<p class="text">Your AriaQuant account is ready. You now have access to institutional-grade quantitative trading tools, real-time market intelligence, and AI-powered signal analysis.</p>

<div class="highlight">
    <div class="label">Your Starting Balance</div>
    <div class="value">$100,000</div>
</div>

<div class="card">
    <div class="card-title">Get Started</div>
    <table>
        <tr>
            <td class="stat-label">1.</td>
            <td class="stat-value">Connect your broker (Alpaca) for live trading</td>
        </tr>
        <tr>
            <td class="stat-label">2.</td>
            <td class="stat-value">Build your watchlist with stocks you follow</td>
        </tr>
        <tr>
            <td class="stat-label">3.</td>
            <td class="stat-value">Set up price & technical alerts</td>
        </tr>
        <tr>
            <td class="stat-label">4.</td>
            <td class="stat-value">Create & backtest your first strategy</td>
        </tr>
    </table>
</div>

<div class="card">
    <div class="card-title">Your Plan: <span class="badge badge-blue">{{ ucfirst($user->plan) }}</span></div>
    <p class="text" style="margin: 8px 0 0;">Upgrade anytime to unlock advanced AI agents, real-time signals, and unlimited backtesting.</p>
</div>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/dashboard" class="btn">Open Dashboard</a>
</div>
@endsection
