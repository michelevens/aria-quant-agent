<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderFilledEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Order Filled: {$this->order->side} {$this->order->filled_qty} {$this->order->symbol} @ \${$this->order->filled_price}"
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-filled');
    }
}
