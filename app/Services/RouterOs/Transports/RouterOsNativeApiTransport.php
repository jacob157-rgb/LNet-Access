<?php

namespace App\Services\RouterOs\Transports;

use App\Models\RouterConnection;
use App\Services\RouterOs\Contracts\RouterOsTransportInterface;
use Exception;
use Illuminate\Support\Facades\Log;

class RouterOsNativeApiTransport implements RouterOsTransportInterface
{
    /** @var resource|null */
    protected $socket = null;

    protected ?RouterConnection $connection = null;

    protected int $timeout = 4;

    public function connect(RouterConnection $connection): void
    {
        $this->connection = $connection;
        $isSsl = ($connection->transport === 'api_ssl' || $connection->port == 8729);
        $protocol = $isSsl ? 'ssl://' : 'tcp://';

        $sslOptions = [
            'verify_peer' => $connection->tls_verify,
            'verify_peer_name' => $connection->tls_verify,
            'allow_self_signed' => !$connection->tls_verify,
        ];

        if ($connection->ca_certificate_path && file_exists($connection->ca_certificate_path)) {
            $sslOptions['cafile'] = $connection->ca_certificate_path;
        }

        $context = stream_context_create(['ssl' => $sslOptions]);

        $socket = @stream_socket_client(
            $protocol . $connection->host . ':' . $connection->port,
            $errno,
            $errstr,
            $this->timeout,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$socket) {
            throw new Exception("Router connection failed to {$connection->host}:{$connection->port}: {$errstr} ({$errno})");
        }

        $this->socket = $socket;
        stream_set_timeout($this->socket, $this->timeout);

        $password = $connection->password_encrypted ?? '';
        $this->authenticate($connection->username, $password);
    }

    public function disconnect(): void
    {
        if ($this->socket && is_resource($this->socket)) {
            @fclose($this->socket);
        }
        $this->socket = null;
    }

    public function isConnected(): bool
    {
        return $this->socket !== null && is_resource($this->socket) && !feof($this->socket);
    }

    protected function authenticate(string $user, string $password): void
    {
        // RouterOS 6.43+ and 7.x direct login
        $response = $this->executeSentence(['/login', '=name=' . $user, '=password=' . $password]);

        if (!empty($response) && $response[0]['type'] === '!done') {
            return;
        }

        // If challenge response returned
        if (!empty($response) && isset($response[0]['ret'])) {
            $challenge = $response[0]['ret'];
            $chalResp = '00' . md5(chr(0) . $password . pack('H*', $challenge));
            $reply = $this->executeSentence(['/login', '=name=' . $user, '=response=' . $chalResp]);
            if (!empty($reply) && $reply[0]['type'] === '!done') {
                return;
            }
        }

        $errMsg = 'Authentication failed';
        if (!empty($response) && $response[0]['type'] === '!trap' && isset($response[0]['message'])) {
            $errMsg = $response[0]['message'];
        }

        $this->disconnect();
        throw new Exception("Router authentication failed: {$errMsg}");
    }

    public function query(string $endpoint, array $criteria = []): array
    {
        if (!$this->isConnected()) {
            throw new Exception("Not connected to RouterOS");
        }

        // Normalize endpoint to command
        $command = rtrim($endpoint, '/');
        if (!str_ends_with($command, '/print')) {
            $command .= '/print';
        }

        $words = [$command];
        foreach ($criteria as $key => $val) {
            if (is_numeric($key)) {
                $words[] = $val;
            } else {
                $words[] = "?{$key}={$val}";
            }
        }

        $response = $this->executeSentence($words);
        $records = [];

        foreach ($response as $sentence) {
            $sentenceType = $sentence['!type'] ?? $sentence['type'] ?? '';
            if ($sentenceType === '!re') {
                $clean = $sentence;
                unset($clean['!type']);
                if (isset($clean['type']) && $clean['type'] === '!re') {
                    unset($clean['type']);
                }
                $records[] = $clean;
            } elseif ($sentenceType === '!trap') {
                throw new Exception("RouterOS query error: " . ($sentence['message'] ?? 'Unknown error'));
            }
        }

        return $records;
    }

    public function write(string $command, array $data = []): array
    {
        if (!$this->isConnected()) {
            throw new Exception("Not connected to RouterOS");
        }

        $words = [$command];
        foreach ($data as $key => $val) {
            if ($val === true) {
                $val = 'yes';
            } elseif ($val === false) {
                $val = 'no';
            }
            $words[] = "={$key}={$val}";
        }

        $response = $this->executeSentence($words);
        $result = [];

        foreach ($response as $sentence) {
            $sentenceType = $sentence['!type'] ?? $sentence['type'] ?? '';
            if ($sentenceType === '!trap') {
                throw new Exception("RouterOS write error: " . ($sentence['message'] ?? 'Unknown error'));
            }
            if ($sentenceType === '!done') {
                $result = $sentence;
                unset($result['!type']);
                if (isset($result['type']) && $result['type'] === '!done') {
                    unset($result['type']);
                }
            }
        }

        return $result;
    }

    public function remove(string $endpoint, string $id): bool
    {
        if (!$this->isConnected()) {
            throw new Exception("Not connected to RouterOS");
        }

        $command = rtrim($endpoint, '/');
        if (!str_ends_with($command, '/remove')) {
            $command .= '/remove';
        }

        $words = [$command, "=.id={$id}"];
        $response = $this->executeSentence($words);

        foreach ($response as $sentence) {
            $sentenceType = $sentence['!type'] ?? $sentence['type'] ?? '';
            if ($sentenceType === '!trap') {
                throw new Exception("RouterOS remove error: " . ($sentence['message'] ?? 'Unknown error'));
            }
            if ($sentenceType === '!done') {
                return true;
            }
        }

        return true;
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
            'rest_supported' => false,
        ];

        try {
            $ident = $this->query('/system/identity');
            if (!empty($ident[0]['name'])) {
                $caps['identity'] = $ident[0]['name'];
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to get identity: " . $e->getMessage());
        }

        try {
            $res = $this->query('/system/resource');
            if (!empty($res[0])) {
                $r = $res[0];
                $caps['version'] = $r['version'] ?? null;
                $caps['board_name'] = $r['board-name'] ?? ($r['platform'] ?? null);
                $caps['cpu_load'] = isset($r['cpu-load']) ? (int)$r['cpu-load'] : null;
                $caps['free_memory'] = isset($r['free-memory']) ? (int)$r['free-memory'] : null;
                $caps['total_memory'] = isset($r['total-memory']) ? (int)$r['total-memory'] : null;
                $caps['uptime'] = $r['uptime'] ?? null;
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to get resource: " . $e->getMessage());
        }

        // Test menus
        try {
            $this->query('/ip/hotspot/user/profile');
            $caps['hotspot_supported'] = true;
        } catch (\Throwable) {}

        try {
            $this->query('/ppp/profile');
            $caps['pppoe_supported'] = true;
        } catch (\Throwable) {}

        try {
            $this->query('/interface/bridge/host');
            $caps['bridge_hosts_supported'] = true;
        } catch (\Throwable) {}

        // Check if v7 REST is theoretically supported
        if ($caps['version'] && version_compare(preg_replace('/[^0-9.]/', '', $caps['version']), '7.1', '>=')) {
            $caps['rest_supported'] = true;
        }

        return $caps;
    }

    protected function executeSentence(array $words): array
    {
        foreach ($words as $word) {
            $this->writeWord($word);
        }
        fwrite($this->socket, chr(0)); // sentence terminator

        $sentences = [];
        while (true) {
            $rawSentence = $this->readRawSentence();
            if (empty($rawSentence)) {
                break;
            }

            $type = $rawSentence[0];
            $parsed = ['!type' => $type, 'type' => $type];

            for ($i = 1; $i < count($rawSentence); $i++) {
                $line = $rawSentence[$i];
                if (str_starts_with($line, '=')) {
                    $parts = explode('=', substr($line, 1), 2);
                    $key = $parts[0];
                    $val = $parts[1] ?? '';
                    $parsed[$key] = $val;
                }
            }

            $sentences[] = $parsed;
            if ($type === '!done' || $type === '!trap' || $type === '!fatal') {
                break;
            }
        }

        return $sentences;
    }

    protected function writeWord(string $word): void
    {
        $len = strlen($word);
        if ($len < 0x80) {
            fwrite($this->socket, chr($len));
        } elseif ($len < 0x4000) {
            $len |= 0x8000;
            fwrite($this->socket, chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        } elseif ($len < 0x200000) {
            $len |= 0xC00000;
            fwrite($this->socket, chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        } elseif ($len < 0x10000000) {
            $len |= 0xE0000000;
            fwrite($this->socket, chr(($len >> 24) & 0xFF) . chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        } else {
            fwrite($this->socket, chr(0xF0) . pack('N', $len));
        }
        fwrite($this->socket, $word);
    }

    protected function readWord(): string
    {
        $byte = fread($this->socket, 1);
        if ($byte === false || strlen($byte) === 0) {
            return '';
        }
        $b1 = ord($byte);
        if (($b1 & 0x80) === 0) {
            $len = $b1;
        } elseif (($b1 & 0xC0) === 0x80) {
            $b2 = ord(fread($this->socket, 1));
            $len = (($b1 & 0x3F) << 8) | $b2;
        } elseif (($b1 & 0xE0) === 0xC0) {
            $b23 = fread($this->socket, 2);
            $len = (($b1 & 0x1F) << 16) | (ord($b23[0]) << 8) | ord($b23[1]);
        } elseif (($b1 & 0xF0) === 0xE0) {
            $b24 = fread($this->socket, 3);
            $len = (($b1 & 0x0F) << 24) | (ord($b24[0]) << 16) | (ord($b24[1]) << 8) | ord($b24[2]);
        } else {
            $b25 = fread($this->socket, 4);
            $unpacked = unpack('N', $b25);
            $len = $unpacked[1] ?? 0;
        }

        if ($len === 0) {
            return '';
        }

        $received = '';
        while (strlen($received) < $len) {
            $chunk = fread($this->socket, $len - strlen($received));
            if ($chunk === false || strlen($chunk) === 0) {
                break;
            }
            $received .= $chunk;
        }
        return $received;
    }

    protected function readRawSentence(): array
    {
        $words = [];
        while (true) {
            $word = $this->readWord();
            if ($word === '') {
                break;
            }
            $words[] = $word;
        }
        return $words;
    }

    public function __destruct()
    {
        $this->disconnect();
    }
}
