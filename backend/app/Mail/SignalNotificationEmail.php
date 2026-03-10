<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SignalNotificationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $signal) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Signal: {$this->signal['action']} {$this->signal['symbol']} — AriaQuant"
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.signal-notification');
    }
}
