<?php

use Illuminate\Support\Facades\Broadcast;

// Private channel for user-specific events (alerts, order updates)
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
