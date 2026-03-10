<?php

namespace App\Events;

use App\Models\Alert;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class AlertTriggered implements ShouldBroadcast
{
    use Dispatchable;

    public function __construct(
        public Alert $alert,
        public string $message
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->alert->user_id)];
    }

    public function broadcastAs(): string
    {
        return 'alert.triggered';
    }

    public function broadcastWith(): array
    {
        return [
            'alert_id' => $this->alert->id,
            'name' => $this->alert->name,
            'category' => $this->alert->category,
            'config' => $this->alert->config,
            'message' => $this->message,
            'triggered_at' => now()->toISOString(),
        ];
    }
}
