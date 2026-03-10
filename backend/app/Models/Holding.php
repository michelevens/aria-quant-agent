<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Holding extends Model
{
    protected $fillable = ['user_id', 'symbol', 'quantity', 'avg_cost'];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'avg_cost' => 'decimal:4',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
