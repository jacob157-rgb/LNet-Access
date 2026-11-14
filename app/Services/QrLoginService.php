<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\QrLoginToken;
use App\Models\Voucher;
use Exception;
use Illuminate\Support\Str;

class QrLoginService
{
    /**
     * Issue a short-lived, single-use QR token for a voucher.
     */
    public function issueToken(Voucher $voucher, int $ttlMinutes = 5): array
    {
        $rawToken = Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $qrToken = QrLoginToken::create([
            'token_hash' => $tokenHash,
            'voucher_id' => $voucher->id,
            'router_connection_id' => $voucher->router_connection_id,
            'expires_at' => now()->addMinutes($ttlMinutes),
            'created_by' => auth()->id(),
        ]);

        return [
            'raw_token' => $rawToken,
            'expires_at' => $qrToken->expires_at,
            'url' => url("/portal/qr/{$rawToken}"),
        ];
    }

    /**
     * Atomically redeem a token.
     */
    public function redeemToken(string $rawToken, ?string $sessionRef = null): Voucher
    {
        $tokenHash = hash('sha256', $rawToken);

        $token = QrLoginToken::where('token_hash', $tokenHash)->first();

        if (!$token) {
            throw new Exception("Invalid or non-existent QR token.");
        }

        if ($token->isExpired()) {
            throw new Exception("QR token has expired.");
        }

        if ($token->isRedeemed()) {
            throw new Exception("QR token has already been redeemed.");
        }

        $token->update([
            'redeemed_at' => now(),
            'redeemed_session_reference' => $sessionRef,
            'attempt_count' => $token->attempt_count + 1,
        ]);

        $voucher = $token->voucher->load(['hotspotProfile', 'routerConnection']);

        AuditLog::log('redeem_qr', 'qr_token', $token->id, $token->router_connection_id, null, [
            'voucher_id' => $voucher->id,
            'username' => $voucher->username,
        ]);

        return $voucher;
    }
}
