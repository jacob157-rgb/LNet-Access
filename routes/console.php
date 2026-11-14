<?php

use App\Models\TeamInvitation;
use Illuminate\Support\Facades\Schedule;

// Expired team invitations
Schedule::call(function () {
    TeamInvitation::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->delete();
})->daily()->description('Delete expired team invitations');

// RouterOS active sessions, health and bridge host sync every minute
Schedule::command('lnet:sync-router')
    ->everyMinute()
    ->withoutOverlapping()
    ->description('Sync RouterOS live sessions and resources');

// AP health checks every minute
Schedule::command('lnet:check-ap')
    ->everyMinute()
    ->withoutOverlapping()
    ->description('Run AP reachability health checks');

// Reconciliation every 10 minutes
Schedule::command('lnet:reconcile')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->description('Reconcile local accounts with RouterOS');
