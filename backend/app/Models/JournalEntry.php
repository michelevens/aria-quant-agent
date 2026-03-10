<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalEntry extends Model
{
    protected $fillable = [
        'user_id', 'entry_date', 'notes', 'trades_data', 'mood', 'lessons',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'trades_data' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
