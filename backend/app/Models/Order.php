<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'symbol', 'side', 'type', 'quantity',
        'limit_price', 'stop_price', 'trail_amount', 'trail_percent',
        'bracket_take_profit', 'bracket_stop_loss',
        'linked_order_id', 'parent_order_id',
        'tif', 'status', 'filled_qty', 'filled_price', 'pnl', 'filled_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'limit_price' => 'decimal:4',
            'stop_price' => 'decimal:4',
            'trail_amount' => 'decimal:4',
            'trail_percent' => 'decimal:4',
            'bracket_take_profit' => 'decimal:4',
            'bracket_stop_loss' => 'decimal:4',
            'filled_qty' => 'decimal:6',
            'filled_price' => 'decimal:4',
            'pnl' => 'decimal:4',
            'filled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trades(): HasMany
    {
        return $this->hasMany(Trade::class);
    }
}
