<?php

namespace App\Mail;

use App\Models\Alert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlertTriggeredEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Alert $alert,
        public string $message = ''
    ) {}

    public function envelope(): Envelope
    {
        $symbol = $this->alert->config['symbol'] ?? '';
        return new Envelope(
            subject: "Alert Triggered: {$this->alert->name}" . ($symbol ? " ($symbol)" : '')
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.alert-triggered');
    }
}
