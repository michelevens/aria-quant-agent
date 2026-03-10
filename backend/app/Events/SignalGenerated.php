<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class SignalGenerated implements ShouldBroadcast
{
    use Dispatchable;

    public function __construct(public array $signal) {}

    public function broadcastOn(): array
    {
        return [new Channel('signals')];
    }

    public function broadcastAs(): string
    {
        return 'signal.generated';
    }
}
