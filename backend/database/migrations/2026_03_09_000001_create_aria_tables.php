<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extend users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('email');
            $table->enum('plan', ['free', 'pro', 'enterprise'])->default('free')->after('avatar');
            $table->string('theme', 10)->default('dark')->after('plan');
        });

        // Holdings (portfolio positions)
        Schema::create('holdings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('symbol', 10);
            $table->decimal('quantity', 16, 6);
            $table->decimal('avg_cost', 16, 4);
            $table->timestamps();
            $table->unique(['user_id', 'symbol']);
        });

        // Watchlists (named groups)
        Schema::create('watchlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category', 20)->default('stocks'); // stocks, forex, crypto
            $table->timestamps();
            $table->index(['user_id', 'category']);
        });

        Schema::create('watchlist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('watchlist_id')->constrained()->cascadeOnDelete();
            $table->string('symbol', 10);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['watchlist_id', 'symbol']);
        });

        // Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('symbol', 10);
            $table->enum('side', ['BUY', 'SELL']);
            $table->enum('type', ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TRAILING_STOP', 'OCO', 'BRACKET']);
            $table->decimal('quantity', 16, 6);
            $table->decimal('limit_price', 16, 4)->nullable();
            $table->decimal('stop_price', 16, 4)->nullable();
            $table->decimal('trail_amount', 16, 4)->nullable();
            $table->decimal('trail_percent', 8, 4)->nullable();
            $table->decimal('bracket_take_profit', 16, 4)->nullable();
            $table->decimal('bracket_stop_loss', 16, 4)->nullable();
            $table->string('linked_order_id')->nullable();
            $table->string('parent_order_id')->nullable();
            $table->enum('tif', ['DAY', 'GTC', 'IOC', 'FOK'])->default('DAY');
            $table->enum('status', ['OPEN', 'FILLED', 'PARTIAL', 'CANCELLED'])->default('OPEN');
            $table->decimal('filled_qty', 16, 6)->default(0);
            $table->decimal('filled_price', 16, 4)->default(0);
            $table->decimal('pnl', 16, 4)->nullable();
            $table->timestamp('filled_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'symbol']);
        });

        // Trades (executed fills)
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('symbol', 10);
            $table->enum('side', ['BUY', 'SELL']);
            $table->decimal('quantity', 16, 6);
            $table->decimal('price', 16, 4);
            $table->decimal('total', 16, 4);
            $table->timestamps();
            $table->index(['user_id', 'symbol']);
        });

        // Alerts
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('category', ['price', 'technical', 'volume', 'sentiment', 'portfolio']);
            $table->enum('status', ['active', 'triggered', 'paused', 'expired'])->default('active');
            $table->json('config'); // category-specific fields
            $table->boolean('recurring')->default(false);
            $table->integer('cooldown_ms')->default(0);
            $table->integer('trigger_count')->default(0);
            $table->timestamp('triggered_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        // Alert history
        Schema::create('alert_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('alert_id')->constrained()->cascadeOnDelete();
            $table->string('message');
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        // Workflows (alert automations)
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('enabled')->default(true);
            $table->foreignId('trigger_alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->json('conditions');
            $table->json('actions');
            $table->integer('trigger_count')->default(0);
            $table->timestamp('last_triggered_at')->nullable();
            $table->timestamps();
        });

        // Strategies (strategy builder)
        Schema::create('strategies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->json('entry_conditions');
            $table->json('exit_conditions');
            $table->string('stop_loss')->nullable();
            $table->string('take_profit')->nullable();
            $table->string('position_size')->nullable();
            $table->timestamps();
        });

        // Journal entries
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('entry_date');
            $table->text('notes')->nullable();
            $table->json('trades_data')->nullable();
            $table->tinyInteger('mood')->nullable(); // 1-5
            $table->text('lessons')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'entry_date']);
        });

        // User settings (key-value)
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('key', 50);
            $table->json('value');
            $table->timestamps();
            $table->unique(['user_id', 'key']);
        });

        // API credentials (encrypted)
        Schema::create('api_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30); // alpaca, finnhub, alpha_vantage
            $table->text('credentials'); // encrypted JSON
            $table->timestamps();
            $table->unique(['user_id', 'provider']);
        });

        // Notifications
        Schema::create('notifications_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['alert', 'signal', 'risk', 'system', 'ipo']);
            $table->string('title');
            $table->text('message');
            $table->boolean('read')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'read', 'created_at']);
        });

        // Signal subscriptions
        Schema::create('signal_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('signal_id');
            $table->timestamps();
            $table->unique(['user_id', 'signal_id']);
        });

        // Portfolio cash balance
        Schema::create('portfolio_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('cash', 16, 4)->default(100000);
            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_balances');
        Schema::dropIfExists('signal_subscriptions');
        Schema::dropIfExists('notifications_log');
        Schema::dropIfExists('api_credentials');
        Schema::dropIfExists('user_settings');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('strategies');
        Schema::dropIfExists('workflows');
        Schema::dropIfExists('alert_history');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('trades');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('watchlist_items');
        Schema::dropIfExists('watchlists');
        Schema::dropIfExists('holdings');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'plan', 'theme']);
        });
    }
};
