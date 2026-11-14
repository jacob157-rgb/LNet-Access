<?php

namespace Tests\Feature;

use App\Models\AccessPoint;
use App\Models\HotspotProfile;
use App\Models\Member;
use App\Models\NetworkAccount;
use App\Models\RouterConnection;
use App\Models\Sale;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use App\Services\AccessPointHealthCheckService;
use App\Services\PrintService;
use App\Services\QrLoginService;
use App\Services\SalesService;
use App\Services\VoucherProvisioningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LNetAccessTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected RouterConnection $router;
    protected HotspotProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['name' => 'Admin Operator']);

        $this->router = RouterConnection::create([
            'name' => 'AgungTik Core',
            'host' => '192.168.10.1',
            'port' => 8728,
            'transport' => 'api',
            'username' => 'admin',
            'password_encrypted' => 'root1234',
            'tls_verify' => false,
            'router_identity' => 'AgungTik',
            'connection_status' => 'online',
            'is_active' => true,
        ]);

        $this->profile = HotspotProfile::create([
            'router_connection_id' => $this->router->id,
            'router_object_id' => '*1',
            'name' => '3k-24j',
            'rate_limit' => '2M/2M',
            'shared_users' => 1,
            'is_present' => true,
        ]);
    }

    public function test_voucher_generation_and_uniqueness(): void
    {
        $service = app(VoucherProvisioningService::class);

        $code1 = $service->generateUniqueCode(6, 'alphanumeric_safe', 'VIP-');
        $code2 = $service->generateUniqueCode(6, 'alphanumeric_safe', 'VIP-');

        $this->assertStringStartsWith('VIP-', $code1);
        $this->assertEquals(10, strlen($code1)); // VIP- (4) + 6 chars
        $this->assertNotEquals($code1, $code2);
    }

    public function test_sales_workflow_and_voucher_allocation(): void
    {
        $salesService = app(SalesService::class);

        // Create 2 ready vouchers
        $voucher1 = Voucher::create([
            'uuid' => (string)Str::uuid(),
            'router_connection_id' => $this->router->id,
            'hotspot_profile_id' => $this->profile->id,
            'username' => 'user01',
            'password_encrypted' => 'pass01',
            'commercial_status' => 'ready',
            'price_snapshot' => 3000,
        ]);

        $voucher2 = Voucher::create([
            'uuid' => (string)Str::uuid(),
            'router_connection_id' => $this->router->id,
            'hotspot_profile_id' => $this->profile->id,
            'username' => 'user02',
            'password_encrypted' => 'pass02',
            'commercial_status' => 'ready',
            'price_snapshot' => 3000,
        ]);

        $sale = $salesService->createSale([$voucher1->id, $voucher2->id], [
            'cashier_id' => $this->user->id,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'discount' => 1000,
        ]);

        $this->assertEquals('paid', $sale->payment_status);
        $this->assertEquals(6000, $sale->subtotal);
        $this->assertEquals(1000, $sale->discount_total);
        $this->assertEquals(5000, $sale->grand_total);
        $this->assertCount(2, $sale->vouchers);

        // Verify vouchers marked as sold
        $this->assertEquals('sold', $voucher1->fresh()->commercial_status);
        $this->assertEquals('sold', $voucher2->fresh()->commercial_status);

        // Cannot sell already sold vouchers
        $this->expectException(\Exception::class);
        $salesService->createSale([$voucher1->id], [
            'cashier_id' => $this->user->id,
        ]);
    }

    public function test_member_and_account_association_without_mac_identity(): void
    {
        $member = Member::create([
            'member_code' => 'MEM-TEST01',
            'name' => 'Budi Testing',
            'phone' => '08123456789',
            'status' => 'active',
        ]);

        $account = NetworkAccount::create([
            'member_id' => $member->id,
            'router_connection_id' => $this->router->id,
            'account_type' => 'hotspot',
            'username' => 'budi_hs',
            'password_encrypted' => 'secret123',
            'profile_name' => '3k-24j',
            'managed_by_app' => true,
            'expected_enabled' => true,
        ]);

        $this->assertCount(1, $member->networkAccounts);
        $this->assertEquals('budi_hs', $member->networkAccounts->first()->username);
    }

    public function test_qr_token_issuance_and_redemption(): void
    {
        $qrService = app(QrLoginService::class);

        $voucher = Voucher::create([
            'uuid' => (string)Str::uuid(),
            'router_connection_id' => $this->router->id,
            'hotspot_profile_id' => $this->profile->id,
            'username' => 'qruser1',
            'password_encrypted' => 'qrpass1',
            'commercial_status' => 'ready',
            'price_snapshot' => 3000,
        ]);

        $tokenData = $qrService->issueToken($voucher, 5);
        $rawToken = $tokenData['raw_token'];

        $this->assertNotEmpty($rawToken);

        // Redeem token
        $redeemedVoucher = $qrService->redeemToken($rawToken, '192.168.10.50');
        $this->assertEquals($voucher->id, $redeemedVoucher->id);

        // Cannot redeem same token twice
        $this->expectException(\Exception::class);
        $qrService->redeemToken($rawToken, '192.168.10.50');
    }

    public function test_access_point_health_check_service(): void
    {
        $ap = AccessPoint::create([
            'name' => 'AP-Office',
            'management_ip' => '127.0.0.1',
            'health_check_type' => 'tcp',
            'health_check_port' => 80,
            'timeout_ms' => 500,
            'failure_threshold' => 2,
            'topology_mode' => 'bridged_dedicated_port',
            'router_bridge_port' => 'ether2',
        ]);

        $service = app(AccessPointHealthCheckService::class);
        $check = $service->check($ap);

        $this->assertNotNull($check);
        $this->assertContains($check->status, ['online', 'offline', 'degraded']);
    }

    public function test_print_service_ticket_and_receipt_data(): void
    {
        $printService = app(PrintService::class);

        $voucher = Voucher::create([
            'uuid' => (string)Str::uuid(),
            'router_connection_id' => $this->router->id,
            'hotspot_profile_id' => $this->profile->id,
            'username' => 'printuser',
            'password_encrypted' => 'printpass',
            'commercial_status' => 'ready',
            'price_snapshot' => 3000,
        ]);

        $ticket = $printService->formatVoucherTicket($voucher);

        $this->assertEquals('printuser', $ticket['username']);
        $this->assertEquals('printpass', $ticket['password']);
        $this->assertStringContainsString('<svg', $ticket['qr_svg']);
    }

    public function test_f4_batch_sheet_formatting_matches_spec(): void
    {
        $printService = app(PrintService::class);

        $batch = VoucherBatch::create([
            'batch_code' => 'BATCH-F4-TEST',
            'router_connection_id' => $this->router->id,
            'hotspot_profile_id' => $this->profile->id,
            'quantity_requested' => 36,
            'quantity_created' => 36,
            'status' => 'completed',
        ]);

        for ($i = 1; $i <= 36; $i++) {
            Voucher::create([
                'uuid' => (string)Str::uuid(),
                'router_connection_id' => $this->router->id,
                'batch_id' => $batch->id,
                'hotspot_profile_id' => $this->profile->id,
                'username' => 'vc' . $i,
                'password_encrypted' => 'vc' . $i,
                'commercial_status' => 'ready',
                'price_snapshot' => 2000,
            ]);
        }

        $sheet = $printService->formatBatchSheet($batch, [
            'brand_name' => 'AgungWifi',
            'dns_host' => 'agungwifi.net',
        ]);

        $this->assertEquals(36, $sheet['total_count']);
        $this->assertEquals('AgungWifi', $sheet['brand_name']);
        $this->assertEquals('agungwifi.net', $sheet['dns_host']);
        $this->assertCount(36, $sheet['vouchers']);
        $this->assertEquals(1, $sheet['vouchers'][0]['index']);
        $this->assertEquals(36, $sheet['vouchers'][35]['index']);
        $this->assertEquals(2000, $sheet['vouchers'][0]['price']);
        $this->assertStringContainsString('agungwifi.net/login', $sheet['vouchers'][0]['direct_login_url']);
        $this->assertStringContainsString('<svg', $sheet['vouchers'][0]['qr_svg']);
    }
}
