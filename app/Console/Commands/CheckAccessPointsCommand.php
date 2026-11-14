<?php

namespace App\Console\Commands;

use App\Models\AccessPoint;
use App\Services\AccessPointHealthCheckService;
use Illuminate\Console\Command;

class CheckAccessPointsCommand extends Command
{
    protected $signature = 'lnet:check-ap {ap_id?}';
    protected $description = 'Run ICMP/HTTP/TCP health checks against configured Access Points';

    public function handle(AccessPointHealthCheckService $healthService): int
    {
        $apId = $this->argument('ap_id');

        $query = AccessPoint::where('is_active', true);
        if ($apId) {
            $query->where('id', $apId);
        }

        $aps = $query->get();

        if ($aps->isEmpty()) {
            $this->warn('No active Access Points found to check.');
            return 0;
        }

        $this->info("Checking {$aps->count()} Access Points...");

        foreach ($aps as $ap) {
            $check = $healthService->check($ap);
            $latency = $check->response_ms ? "{$check->response_ms}ms" : 'N/A';
            $this->line("  AP: {$ap->name} ({$ap->management_ip}) -> [{$check->status}] ({$latency})");
        }

        $this->info("Access Point health check completed.");
        return 0;
    }
}
