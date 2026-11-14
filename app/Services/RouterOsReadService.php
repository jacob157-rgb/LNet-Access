<?php

namespace App\Services;

use App\Models\RouterConnection;
use App\Services\RouterOs\RouterOsTransportFactory;

class RouterOsReadService
{
    public function getHotspotProfiles(RouterConnection $connection): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/ip/hotspot/user/profile');
        $transport->disconnect();
        return $records;
    }

    public function getHotspotUsers(RouterConnection $connection, array $criteria = []): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/ip/hotspot/user', $criteria);
        $transport->disconnect();
        return $records;
    }

    public function getHotspotActiveSessions(RouterConnection $connection): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/ip/hotspot/active');
        $transport->disconnect();
        return $records;
    }

    public function getPppProfiles(RouterConnection $connection): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/ppp/profile');
        $transport->disconnect();
        return $records;
    }

    public function getPppSecrets(RouterConnection $connection, array $criteria = []): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/ppp/secret', $criteria);
        $transport->disconnect();
        return $records;
    }

    public function getPppActiveSessions(RouterConnection $connection): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/ppp/active');
        $transport->disconnect();
        return $records;
    }

    public function getBridgeHosts(RouterConnection $connection): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/interface/bridge/host');
        $transport->disconnect();
        return $records;
    }

    public function getHotspotIpBindings(RouterConnection $connection): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $records = $transport->query('/ip/hotspot/ip-binding');
        $transport->disconnect();
        return $records;
    }
}
