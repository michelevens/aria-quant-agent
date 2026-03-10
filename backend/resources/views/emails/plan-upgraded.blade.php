@extends('emails.base')
@section('header-subtitle', 'Plan Upgraded')

@section('content')
<p class="greeting">Welcome to {{ ucfirst($plan) }}!</p>
<p class="text">Your AriaQuant plan has been upgraded. Here's what's now unlocked:</p>

<div class="highlight">
    <div class="label">Your New Plan</div>
    <div class="value">{{ ucfirst($plan) }}</div>
</div>

<div class="card">
    <div class="card-title">Unlocked Features</div>
    @if($plan === 'pro')
    <table>
        <tr><td class="stat-value">Advanced AI agents (Momentum, Quant, Options)</td></tr>
        <tr><td class="stat-value">Real-time signal dashboard</td></tr>
        <tr><td class="stat-value">Unlimited backtesting</td></tr>
        <tr><td class="stat-value">Options flow & dark pool monitor</td></tr>
        <tr><td class="stat-value">Monte Carlo simulations</td></tr>
        <tr><td class="stat-value">Priority signal delivery</td></tr>
    </table>
    @elseif($plan === 'enterprise')
    <table>
        <tr><td class="stat-value">Everything in Pro, plus:</td></tr>
        <tr><td class="stat-value">Research-grade agents (Alpha, Macro, Sentiment AI)</td></tr>
        <tr><td class="stat-value">Custom strategy marketplace</td></tr>
        <tr><td class="stat-value">API access for algorithmic trading</td></tr>
        <tr><td class="stat-value">White-glove onboarding</td></tr>
        <tr><td class="stat-value">Dedicated support channel</td></tr>
    </table>
    @endif
</div>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/dashboard" class="btn">Explore New Features</a>
</div>
@endsection
