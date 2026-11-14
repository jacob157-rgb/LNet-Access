<?php

namespace App\Services\RouterOs\Contracts;

use App\Models\RouterConnection;

interface RouterOsTransportInterface
{
    /**
     * Establish connection and authenticate with the router.
     *
     * @throws \Exception on connection or authentication failure
     */
    public function connect(RouterConnection $connection): void;

    /**
     * Terminate the connection.
     */
    public function disconnect(): void;

    /**
     * Execute a read query (e.g., endpoint "/ip/hotspot/user/profile/print" or "/ip/hotspot/user")
     *
     * @param string $endpoint The command path or menu (e.g. "/ip/hotspot/user" or "/system/resource/print")
     * @param array<string, mixed> $criteria Filter criteria or attributes
     * @return array<int, array<string, string>> Array of records
     */
    public function query(string $endpoint, array $criteria = []): array;

    /**
     * Execute a write command (add or set)
     *
     * @param string $command The command (e.g. "/ip/hotspot/user/add" or "/ip/hotspot/user/set")
     * @param array<string, mixed> $data Key-value attributes
     * @return array<string, mixed> Result data (e.g. ['ret' => '*12'])
     */
    public function write(string $command, array $data = []): array;

    /**
     * Remove a record by its RouterOS internal ID
     *
     * @param string $endpoint The base endpoint (e.g. "/ip/hotspot/user")
     * @param string $id The RouterOS internal .id (e.g. "*12")
     * @return bool Success
     */
    public function remove(string $endpoint, string $id): bool;

    /**
     * Test reachability and basic ping/check
     */
    public function isConnected(): bool;

    /**
     * Detect full capabilities, resource, identity, and available menus.
     *
     * @return array<string, mixed>
     */
    public function detectCapabilities(): array;
}
