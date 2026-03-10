<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Workflow extends Model
{
    protected $fillable = [
        'user_id', 'name', 'enabled', 'trigger_alert_id',
        'conditions', 'actions', 'trigger_count', 'last_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'conditions' => 'array',
            'actions' => 'array',
            'last_triggered_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function triggerAlert(): BelongsTo
    {
        return $this->belongsTo(Alert::class, 'trigger_alert_id');
    }
}
