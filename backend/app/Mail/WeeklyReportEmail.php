<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyReportEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $report,
        public ?string $period = null
    ) {}

    public function envelope(): Envelope
    {
        $ret = $this->report['weekly_return'] ?? 0;
        $symbol = $ret >= 0 ? '+' : '';
        return new Envelope(
            subject: "Weekly Report: {$symbol}{$ret}% — AriaQuant"
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.weekly-report');
    }
}
