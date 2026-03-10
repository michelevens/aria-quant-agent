#!/bin/bash
set -e

# Run migrations
php artisan migrate --force

# Clear old caches, then re-cache for performance
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Debug: show registered routes count
php artisan route:list --compact 2>/dev/null | wc -l || true

# Create storage link
php artisan storage:link 2>/dev/null || true

# Start PHP-FPM in background
php-fpm -D

# Start nginx in foreground
nginx -g 'daemon off;'
