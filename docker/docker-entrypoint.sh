#!/bin/sh
set -e

echo "[LNet-Access] Starting container bootstrap..."

# Ensure persistent directories exist
mkdir -p /var/www/html/database
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs

# Initialize SQLite database file if not exists
if [ ! -f /var/www/html/database/database.sqlite ]; then
    echo "[LNet-Access] Creating database.sqlite..."
    touch /var/www/html/database/database.sqlite
fi

# Check for SSL certificates in persistent database/certs folder
if [ -f /var/www/html/database/certs/fullchain.pem ] && [ -f /var/www/html/database/certs/privkey.pem ]; then
    echo "[LNet-Access] SSL certificates found. Enabling HTTPS on port 443..."
    cp /etc/nginx/http.d/ssl.conf.template /etc/nginx/http.d/default.conf
else
    echo "[LNet-Access] No SSL certificates in /database/certs. Running standard HTTP on port 80..."
fi

# Set ownership
chown -R www-data:www-data /var/www/html/storage /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/database

# Setup Laravel cron job in crond
echo "* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1" > /var/spool/cron/crontabs/root

# Optimize Laravel caches
echo "[LNet-Access] Running migrations and optimizing caches..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true
php artisan migrate --force || true

echo "[LNet-Access] System ready. Launching services..."
exec "$@"
