<?php

namespace Database\Seeders;

use App\Models\RouterConnection;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Default Administrator
        $admin = User::firstOrCreate(
            ['email' => 'admin@lnet.id'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Preconfigure the user's live testing router (AgungTik on 192.168.10.1)
        RouterConnection::firstOrCreate(
            ['host' => '192.168.10.1'],
            [
                'name' => 'AgungTik Core',
                'port' => 8728, // Plain API (open and tested)
                'transport' => 'api',
                'username' => 'admin',
                'password_encrypted' => 'root1234',
                'tls_verify' => false,
                'router_identity' => 'AgungTik',
                'is_active' => true,
            ]
        );
    }
}
