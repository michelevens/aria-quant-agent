<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Aria Quant' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e2e8f0; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid #1e293b; border-radius: 16px 16px 0 0; padding: 32px; text-align: center; }
        .header h1 { color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .header .accent { color: #6366f1; }
        .header p { color: #94a3b8; font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; }
        .body { background: #0f172a; border: 1px solid #1e293b; border-top: none; padding: 32px; border-radius: 0 0 16px 16px; }
        .greeting { font-size: 16px; color: #f1f5f9; margin-bottom: 16px; }
        .text { color: #94a3b8; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .card-title { color: #f1f5f9; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
        .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; }
        .stat-row:last-child { border-bottom: none; }
        .stat-label { color: #64748b; }
        .stat-value { color: #f1f5f9; font-weight: 600; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center; }
        .btn-center { text-align: center; margin: 24px 0; }
        .highlight { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .highlight .value { color: #fff; font-size: 28px; font-weight: 700; }
        .highlight .label { color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .badge-green { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .badge-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .badge-blue { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
        .badge-amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .up { color: #22c55e; }
        .down { color: #ef4444; }
        .divider { border: none; border-top: 1px solid #1e293b; margin: 24px 0; }
        .footer { text-align: center; padding-top: 16px; }
        .footer p { color: #475569; font-size: 11px; line-height: 1.6; }
        .footer a { color: #6366f1; text-decoration: none; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <h1>Aria<span class="accent">Quant</span></h1>
        <p>@yield('header-subtitle', 'Quantitative Trading Platform')</p>
    </div>
    <div class="body">
        @yield('content')
        <hr class="divider">
        <div class="footer">
            <p>AriaQuant &bull; Institutional-Grade Trading Intelligence</p>
            <p style="margin-top: 4px;"><a href="{{ config('app.frontend_url') }}">Open Dashboard</a> &bull; <a href="{{ config('app.frontend_url') }}/settings">Settings</a></p>
            <p style="margin-top: 8px; font-size: 10px;">You're receiving this because you have an AriaQuant account.<br>
            <a href="{{ config('app.frontend_url') }}/settings#notifications">Manage email preferences</a></p>
        </div>
    </div>
</div>
</body>
</html>
