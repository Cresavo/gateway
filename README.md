# Booking Lab Gateway

Private development repository for the agent-facing REST v1 and Streamable HTTP MCP service.
The gateway runs as its own Node process. It targets the configured `SALON_ORIGIN` and authenticates that hop with a separate service credential.
It has no database driver, salon checkout, admin cookie or service-wide booking credential.

## Run locally

Use Node 24 and an independently running Booking Lab salon provider in split mode. Generate 32 cryptographically random bytes, encoded as 64 lowercase hex characters. Supply the same value as `GATEWAY_SERVICE_TOKEN` to the two server processes only. Use a dedicated token per environment and restart both services when rotating it. Keep it out of clients, URLs, logs, and Git. Use loopback locally and HTTPS for remote transport. In PowerShell:

```powershell
npm ci
npm test
$env:SALON_ORIGIN = 'http://127.0.0.1:3217'
$env:PORT = '3218'
npm start
```

Discovery: `http://127.0.0.1:3218/.well-known/usp`. OpenAPI: `/api/v1/openapi`.
Use provider-issued, synthetic agent credentials via an authorization header for booking REST and MCP.
Never pass secrets in URLs. The listener is restricted to IPv4 loopback; this release has no internet hosting configuration.

## Ownership and trust

This repository owns the gateway listener, MCP server, native tool schemas, aliases, discovery,
and the client-facing HTTP adapter. The salon owns its database, calendar, staff, pricing,
authentication of provider-issued agent keys, stored customer mandates, booking ownership,
idempotency and transactional scheduling. The gateway asks the salon for active scopes before
MCP dispatch. The salon independently checks the presented credential and performs its mandate,
ownership and conflict checks at the point of use. Browser sessions never cross this boundary.
Before forwarding any agent operation, the gateway calls authenticated `GET /api/v1/access`.
A successful response must contain `apiVersion: "v1"`, `providerMode: "split"` and
a scopes array. The salon sets the mode only after checking both credentials.
An absent or standalone mode yields 503 `provider_configuration_invalid` before
the requested operation is sent. An authentication failure retains its 401/403.
This check is repeated for each operation, including status and cancellation.
It is never cached across requests or a provider restart. Both server processes
must be upgraded together. Discovery documents remain available without a provider.

One MCP call can result in multiple access checks and an operation against the
provider's rate budget. The confirmation describes the configured provider's
mode at the access check. Loopback or HTTPS transport is still required.

The initial adapter targets the Booking Lab salon v1 contract. An independent vendor would supply
an adapter and its own authorisation integration. No partner compatibility or external assistant certification is implied.
If an operation times out, retry with the **same** Idempotency-Key. The gateway never invents a booking result.

## Cross-repository acceptance

In the private [salon repository](https://github.com/niclasvestlund-YT/booking-lab-se/tree/refactor/gateway-provider-split),
follow `docs/GATEWAY_SPLIT.md`. The suite uses a real HTTP MCP SDK client and a standalone REST client.
It checks that an authenticated salon calendar contains the precise MCP-created booking ID.
The gateway uses local HTTP as a transport; no gateway process receives a database URL.

## Source and licensing

AGPL-3.0-only, as in the original project. MCP input schemas, discovery and the v1 OpenAPI
contract were adapted from booking-lab-se at `6f5d143e096d42ff98e3714dee5ccc402a40e01b`.
Runtime packages are pinned in the lockfile. The MCP server and core packages use Apache-2.0,
and Zod uses MIT. Their original license files are distributed in the npm packages.
No salon source tree, database dump or private Git history was imported.
