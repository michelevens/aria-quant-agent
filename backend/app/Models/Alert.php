<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    protected $fillable = [
        'user_id', 'name', 'category', 'status', 'config',
        'recurring', 'cooldown_ms', 'trigger_count',
        'triggered_at', 'last_checked_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'recurring' => 'boolean',
            'triggered_at' => 'datetime',
            'last_checked_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(AlertHistory::class);
    }

    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class, 'trigger_alert_id');
    }
}
