<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class MarketDataUpdated implements ShouldBroadcast
{
    use Dispatchable;

    public function __construct(
        public string $channel,
        public array $data
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('market.' . $this->channel)];
    }

    public function broadcastAs(): string
    {
        return 'data.updated';
    }
}
