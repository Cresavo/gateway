# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `GATEWAY_LOOPBACK_TEST_LIMITS=1` raises per-IP limits for local cross-repository proofs and is refused when hosted or using a shared store.
- Landing page for developers of AI assistants at `/`, served by the gateway itself. It is static and script-free, and sends a strict Content-Security-Policy. It advertises the configured public origin.
- Provider contract v1 (`docs/PROVIDER_CONTRACT.md`) and a guide for connecting any booking system (`docs/CONNECT_A_PROVIDER.md`).
- `npm run provider:check`: a conformance check against a running provider. It is read-only by default; `--write` also creates one pending proposal. It never books anything and prints no credentials.
- `npm run test:e2e -- --adapter <file>` runs the shared agent scenarios against any provider. The scenarios no longer assume Cresavo's business id, customer or delivery profile.
- Optional shared rate limits through any Redis-protocol store (`GATEWAY_RATE_LIMIT_REDIS_URL`), atomic across instances. Creates fail closed when the store is unreachable. Required with `GATEWAY_REQUIRE_SHARED_LIMITS=1` and on Vercel.
- `vercel.json` selects Vercel's container runtime for the existing `Dockerfile`.

- Per-client-IP rate limits in the gateway before any salon call: 60 requests/min, 5 booking creates/hour, 5 proposal creates/hour. All answer 429 with `Retry-After`.
- Explicit remote mode behind HTTPS: `GATEWAY_ALLOW_REMOTE`, `GATEWAY_LISTEN_HOST`, `GATEWAY_PUBLIC_ORIGIN`, `GATEWAY_TRUST_PROXY_HOPS`. Loopback stays the default; partial setups refuse to start.
- MCP requests must carry one JSON-RPC message; batches get 400. The body is parsed once and re-serialised before rate limiting and dispatch.
- `GET /healthz` liveness endpoint without a salon call.
- HSTS in remote mode and `X-Content-Type-Options: nosniff` on all responses.
- `Dockerfile` for one instance behind a TLS proxy.
- End-to-end run with a real MCP SDK client and a fictional split-mode provider (`npm run test:e2e`).
- Threat model, hosting plan, publication audit, contributing guide, security policy, issue templates.
- CI: lint, typecheck, unit and end-to-end tests, full-history secret scan, dependency audit, actions pinned by SHA.

- `npm run test:e2e:real` exercises the shared SDK scenarios against a pinned Cresavo salon, PostgreSQL and authenticated Chromium calendar. The tested approval profile is `separate-lab`.

### Changed

- Start page at `/` reworked again: clearer hero with an assistant chat and approval card, assistants that speak MCP, three-step explainer, audiences, status and FAQ. Redesigned the start page at `/` (still static, script-free and under the same Content-Security-Policy); the advertised endpoints are unchanged.
- npm package name `booking-lab-gateway` → `cresavo-gateway` (not published to npm; no runtime effect).
- The published OpenAPI includes both proposal operations. The fixture now uses `pending` in place of `pending_consent`, `proposal.serviceId`, `serviceVersion`, `start` and `durationMinutes` move out of `proposal.terms`. Its `staffId` becomes `proposal.staff.id`, and its `priceMinor` becomes `proposal.price.amountMinor`. The former fixture-only `proposal.consentUrl` is removed. Legacy Cresavo uses top-level `approvalUrl`; separate delivery returns `approvalRequired` and `approvalDelivery`. Consent decisions use JSON at `/consent/{id}/decision` in place of the fixture's form POST at `/consent/{id}`.
- The proposal read uses `booking_not_found` in place of the fixture's `not_found`. The customer decision route uses `consent_denied` in place of `proposal_expired` and `consent_code_invalid`. Missing mandates return 400 `mandate_required`. Unknown mandates return 403 `mandate_denied`. The fixture-only `/__fixture/*` routes and `x-fixture-owner` header were removed. Customer approval and operator controls are local test adapter functions.
- A single MCP request shares its access check. Provider 5xx responses return static 503 `provider_unavailable`. Malformed successful operation replies return 502. MCP tool errors carry `{error}`. Direct cancellation via either transport returns a denial until the provider supports approved cancellation proposals.
- README rewritten for public use and points at `Cresavo/cresavo`.

### Unchanged on purpose

Wire names keep their v1 values: headers `x-booking-gateway-token` and `x-booking-lab-api`, discovery key `x-booking-lab`, MCP server name `booking-lab-gateway`, all routes and tool names.

## [0.1.0] - 2026-11-15

### Added

- Standalone REST v1 and Streamable HTTP MCP gateway for the salon provider, loopback only.
- Service token on every salon request; per-operation split-mode access check.
