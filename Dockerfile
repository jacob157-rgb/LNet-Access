# Multi-stage production build for MikroTik RouterOS Container (x86_64 / amd64)
FROM php:8.3-fpm-alpine AS production

LABEL maintainer="LNet-Access"
LABEL description="Optimized LNet-Access Container for MikroTik RouterOS"

# Set working directory
WORKDIR /var/www/html

# Install production system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    sqlite \
    tzdata \
    curl \
    libzip-dev \
    libpng-dev \
    oniguruma-dev

# Install required PHP extensions
RUN docker-php-ext-install \
    pdo_sqlite \
    bcmath \
    sockets \
    opcache \
    zip \
    pcntl

# Configure timezone
ENV TZ=Asia/Jakarta
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy custom configs
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/nginx-ssl.conf /etc/nginx/http.d/ssl.conf.template
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Install composer binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . /var/www/html

# Install vendor dependencies if not already present
RUN if [ ! -d "/var/www/html/vendor" ]; then \
        composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader; \
    fi

# Clean up dev artifacts
RUN rm -rf /var/www/html/tests \
    /var/www/html/.git \
    /var/www/html/node_modules \
    /var/www/html/storage/logs/*.log

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Expose HTTP and HTTPS ports
EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
