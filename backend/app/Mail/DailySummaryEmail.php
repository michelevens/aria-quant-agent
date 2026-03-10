<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailySummaryEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $portfolio,
        public array $top_movers = [],
        public int $alerts_triggered = 0,
        public ?string $date = null
    ) {}

    public function envelope(): Envelope
    {
        $change = $this->portfolio['day_change'] ?? 0;
        $symbol = $change >= 0 ? '+' : '';
        return new Envelope(
            subject: "Daily Summary: {$symbol}\${$change} — AriaQuant"
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.daily-summary');
    }
}
