<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Strategy extends Model
{
    protected $fillable = [
        'user_id', 'name', 'entry_conditions', 'exit_conditions',
        'stop_loss', 'take_profit', 'position_size',
    ];

    protected function casts(): array
    {
        return [
            'entry_conditions' => 'array',
            'exit_conditions' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
