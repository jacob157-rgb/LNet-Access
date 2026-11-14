<?php

namespace App\Services;

use App\Models\AccessPoint;
use App\Models\AccessPointHealthCheck;
use Exception;
use Illuminate\Support\Facades\Http;

class AccessPointHealthCheckService
{
    /**
     * Run a health check for an access point.
     */
    public function check(AccessPoint $ap): AccessPointHealthCheck
    {
        $startTime = microtime(true);
        $status = 'offline';
        $responseMs = null;
        $httpStatus = null;
        $packetLoss = null;
        $error = null;

        try {
            switch ($ap->health_check_type) {
                case 'http':
                case 'https':
                    $checkResult = $this->checkHttp($ap);
                    $status = $checkResult['status'];
                    $responseMs = $checkResult['latency_ms'];
                    $httpStatus = $checkResult['http_status'];
                    break;

                case 'tcp':
                    $checkResult = $this->checkTcp($ap);
                    $status = $checkResult['status'];
                    $responseMs = $checkResult['latency_ms'];
                    break;

                case 'icmp':
                default:
                    $checkResult = $this->checkIcmp($ap);
                    $status = $checkResult['status'];
                    $responseMs = $checkResult['latency_ms'];
                    $packetLoss = $checkResult['packet_loss'];
                    break;
            }
        } catch (Exception $e) {
            $status = 'offline';
            $error = $e->getMessage();
        }

        // Update AP consecutive failures & final status
        if ($status === 'online') {
            $ap->update([
                'status' => 'online',
                'consecutive_failures' => 0,
                'last_checked_at' => now(),
                'last_success_at' => now(),
                'last_response_ms' => $responseMs,
                'last_http_status' => $httpStatus,
                'last_error' => null,
            ]);
        } else {
            $failures = $ap->consecutive_failures + 1;
            $newStatus = ($failures >= $ap->failure_threshold) ? 'offline' : 'degraded';

            $ap->update([
                'status' => $newStatus,
                'consecutive_failures' => $failures,
                'last_checked_at' => now(),
                'last_response_ms' => $responseMs,
                'last_http_status' => $httpStatus,
                'last_error' => $error ?? 'Health check probe failed',
            ]);
        }

        // Record check history
        return AccessPointHealthCheck::create([
            'access_point_id' => $ap->id,
            'check_type' => $ap->health_check_type,
            'status' => $status,
            'response_ms' => $responseMs,
            'http_status' => $httpStatus,
            'packet_loss_percent' => $packetLoss,
            'error_message' => $error,
            'checked_at' => now(),
        ]);
    }

    /**
     * ICMP ping probe.
     */
    protected function checkIcmp(AccessPoint $ap): array
    {
        $ip = escapeshellarg($ap->management_ip);
        $timeoutSeconds = max(1, (int)ceil($ap->timeout_ms / 1000));

        // Windows ping syntax: ping -n 1 -w <timeout_ms> <ip>
        // Linux syntax: ping -c 1 -W <timeout_s> <ip>
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $cmd = $isWindows
            ? "ping -n 1 -w {$ap->timeout_ms} {$ip}"
            : "ping -c 1 -W {$timeoutSeconds} {$ip}";

        $start = microtime(true);
        exec($cmd, $output, $returnCode);
        $latency = round((microtime(true) - $start) * 1000);

        if ($returnCode === 0) {
            return [
                'status' => 'online',
                'latency_ms' => (int)$latency,
                'packet_loss' => 0,
            ];
        }

        // If ICMP ping failed, try fallback TCP probe to port 80/443 before declaring dead
        $tcpFallback = $this->pingSocket($ap->management_ip, 80, $ap->timeout_ms);
        if ($tcpFallback['status'] === 'online') {
            return $tcpFallback;
        }

        return [
            'status' => 'offline',
            'latency_ms' => null,
            'packet_loss' => 100,
        ];
    }

    /**
     * HTTP / HTTPS probe.
     */
    protected function checkHttp(AccessPoint $ap): array
    {
        $proto = $ap->health_check_type === 'https' ? 'https://' : 'http://';
        $url = $ap->health_check_url ?: ($proto . $ap->management_ip);
        if (!str_starts_with($url, 'http')) {
            $url = $proto . $ap->management_ip . '/' . ltrim($url, '/');
        }

        $timeoutSeconds = max(1, $ap->timeout_ms / 1000);
        $start = microtime(true);

        $res = Http::timeout($timeoutSeconds)
            ->withoutVerifying()
            ->get($url);

        $latency = round((microtime(true) - $start) * 1000);
        $statusCode = $res->status();

        $expected = $ap->expected_http_statuses_json ?? [200, 301, 302, 401];

        $isOk = in_array($statusCode, $expected) || ($statusCode >= 200 && $statusCode < 400);

        return [
            'status' => $isOk ? 'online' : 'degraded',
            'latency_ms' => (int)$latency,
            'http_status' => $statusCode,
        ];
    }

    /**
     * TCP port probe.
     */
    protected function checkTcp(AccessPoint $ap): array
    {
        $port = $ap->health_check_port ?: 80;
        return $this->pingSocket($ap->management_ip, $port, $ap->timeout_ms);
    }

    protected function pingSocket(string $ip, int $port, int $timeoutMs): array
    {
        $timeoutSec = max(1, ceil($timeoutMs / 1000));
        $start = microtime(true);

        $fp = @fsockopen($ip, $port, $errno, $errstr, $timeoutSec);
        $latency = round((microtime(true) - $start) * 1000);

        if ($fp) {
            fclose($fp);
            return [
                'status' => 'online',
                'latency_ms' => (int)$latency,
                'packet_loss' => 0,
            ];
        }

        return [
            'status' => 'offline',
            'latency_ms' => null,
            'packet_loss' => 100,
        ];
    }
}
