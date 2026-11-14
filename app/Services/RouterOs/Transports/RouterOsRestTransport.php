<?php

namespace App\Services\RouterOs\Transports;

use App\Models\RouterConnection;
use App\Services\RouterOs\Contracts\RouterOsTransportInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RouterOsRestTransport implements RouterOsTransportInterface
{
    protected ?RouterConnection $connection = null;

    protected bool $connected = false;

    public function connect(RouterConnection $connection): void
    {
        $this->connection = $connection;
        // Verify connectivity via /rest/system/identity
        $url = $this->baseUrl() . '/system/identity';
        $res = $this->client()->get($url);

        if (!$res->successful()) {
            throw new Exception("REST API connection failed (HTTP {$res->status()}): {$res->body()}");
        }

        $this->connected = true;
    }

    public function disconnect(): void
    {
        $this->connected = false;
        $this->connection = null;
    }

    public function isConnected(): bool
    {
        return $this->connected;
    }

    protected function baseUrl(): string
    {
        $proto = ($this->connection->port == 443 || $this->connection->transport === 'rest') ? 'https://' : 'http://';
        return "{$proto}{$this->connection->host}:{$this->connection->port}/rest";
    }

    protected function client()
    {
        $options = [
            'timeout' => 4,
            'verify' => $this->connection->tls_verify,
        ];

        return Http::withOptions($options)
            ->withBasicAuth($this->connection->username, $this->connection->password_encrypted ?? '');
    }

    public function query(string $endpoint, array $criteria = []): array
    {
        $endpoint = trim(str_replace('/print', '', $endpoint), '/');
        $url = $this->baseUrl() . '/' . $endpoint;

        $res = $this->client()->get($url, $criteria);
        if (!$res->successful()) {
            throw new Exception("RouterOS REST query error: " . $res->body());
        }

        $data = $res->json();
        return is_array($data) ? (isset($data[0]) ? $data : [$data]) : [];
    }

    public function write(string $command, array $data = []): array
    {
        $isAdd = str_ends_with($command, '/add');
        $clean = trim(str_replace(['/add', '/set'], '', $command), '/');
        $url = $this->baseUrl() . '/' . $clean;

        if ($isAdd) {
            $res = $this->client()->put($url, $data);
        } else {
            // /set usually requires PATCH or POST to specific object
            $res = $this->client()->patch($url, $data);
        }

        if (!$res->successful()) {
            throw new Exception("RouterOS REST write error: " . $res->body());
        }

        return $res->json() ?? [];
    }

    public function remove(string $endpoint, string $id): bool
    {
        $clean = trim(str_replace('/remove', '', $endpoint), '/');
        $url = $this->baseUrl() . '/' . $clean . '/' . urlencode($id);

        $res = $this->client()->delete($url);
        return $res->successful();
    }

    public function detectCapabilities(): array
    {
        $caps = [
            'identity' => null,
            'version' => null,
            'board_name' => null,
            'cpu_load' => null,
            'free_memory' => null,
            'total_memory' => null,
            'uptime' => null,
            'hotspot_supported' => false,
            'pppoe_supported' => false,
            'bridge_hosts_supported' => false,
            'wireless_supported' => false,
            'rest_supported' => true,
        ];

        try {
            $ident = $this->query('/system/identity');
            if (!empty($ident[0]['name'])) {
                $caps['identity'] = $ident[0]['name'];
            }
        } catch (\Throwable $e) {}

        try {
            $res = $this->query('/system/resource');
            if (!empty($res[0])) {
                $r = $res[0];
                $caps['version'] = $r['version'] ?? null;
                $caps['board_name'] = $r['board-name'] ?? null;
                $caps['cpu_load'] = isset($r['cpu-load']) ? (int)$r['cpu-load'] : null;
                $caps['free_memory'] = isset($r['free-memory']) ? (int)$r['free-memory'] : null;
                $caps['total_memory'] = isset($r['total-memory']) ? (int)$r['total-memory'] : null;
                $caps['uptime'] = $r['uptime'] ?? null;
            }
        } catch (\Throwable $e) {}

        try {
            $this->query('/ip/hotspot/user/profile');
            $caps['hotspot_supported'] = true;
        } catch (\Throwable $e) {}

        try {
            $this->query('/ppp/profile');
            $caps['pppoe_supported'] = true;
        } catch (\Throwable $e) {}

        try {
            $this->query('/interface/bridge/host');
            $caps['bridge_hosts_supported'] = true;
        } catch (\Throwable $e) {}

        return $caps;
    }
}
