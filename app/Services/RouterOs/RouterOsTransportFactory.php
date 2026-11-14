<?php

namespace App\Services\RouterOs;

use App\Models\RouterConnection;
use App\Services\RouterOs\Contracts\RouterOsTransportInterface;
use App\Services\RouterOs\Transports\RouterOsNativeApiTransport;
use App\Services\RouterOs\Transports\RouterOsRestTransport;
use InvalidArgumentException;

class RouterOsTransportFactory
{
    public static function create(RouterConnection $connection): RouterOsTransportInterface
    {
        return match ($connection->transport) {
            'api_ssl', 'api' => new RouterOsNativeApiTransport(),
            'rest' => new RouterOsRestTransport(),
            default => throw new InvalidArgumentException("Unsupported RouterOS transport: {$connection->transport}"),
        };
    }
}
