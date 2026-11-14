<?php

namespace App\Console\Commands;

use App\Models\RouterConnection;
use App\Services\ReconciliationService;
use Illuminate\Console\Command;

class ReconcileRoutersCommand extends Command
{
    protected $signature = 'lnet:reconcile {router_id?}';
    protected $description = 'Reconcile local voucher/member accounts with RouterOS users';

    public function handle(ReconciliationService $reconciliationService): int
    {
        $routerId = $this->argument('router_id');

        $query = RouterConnection::where('is_active', true);
        if ($routerId) {
            $query->where('id', $routerId);
        }

        $routers = $query->get();

        foreach ($routers as $router) {
            $this->info("Reconciling router: {$router->name}...");
            try {
                $issues = $reconciliationService->reconcile($router);
                $this->line("  Found {$issues->count()} reconciliation issues.");
            } catch (\Throwable $e) {
                $this->error("  Reconciliation failed: " . $e->getMessage());
            }
        }

        $this->info("Reconciliation completed.");
        return 0;
    }
}
