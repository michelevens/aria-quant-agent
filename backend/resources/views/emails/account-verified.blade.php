@extends('emails.base')
@section('header-subtitle', 'Email Verified')

@section('content')
<p class="greeting">Email Verified!</p>
<p class="text">Your email has been verified successfully. Your AriaQuant account is now fully activated.</p>

<div class="highlight">
    <div class="label">Account Status</div>
    <div class="value" style="font-size: 22px;">Verified ✓</div>
</div>

<p class="text">You now have full access to all features in your {{ ucfirst($user->plan) }} plan. Start building your portfolio and setting up your trading strategies.</p>

<div class="btn-center">
    <a href="{{ config('app.frontend_url') }}/dashboard" class="btn">Go to Dashboard</a>
</div>
@endsection
