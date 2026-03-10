<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RiskWarningEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $warning) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Risk Alert: {$this->warning['title']} — AriaQuant"
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.risk-warning');
    }
}
