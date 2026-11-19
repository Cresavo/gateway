# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Per-client-IP rate limits in the gateway before any salon call: 60 requests/min, 5 booking creates/hour, 5 proposal creates/hour. All answer 429 with `Retry-After`.
- Explicit remote mode behind HTTPS: `GATEWAY_ALLOW_REMOTE`, `GATEWAY_LISTEN_HOST`, `GATEWAY_PUBLIC_ORIGIN`, `GATEWAY_TRUST_PROXY_HOPS`. Loopback stays the default; partial setups refuse to start.
- MCP requests must carry one JSON-RPC message; batches get 400. The body is parsed once and re-serialised before rate limiting and dispatch.
- `GET /healthz` liveness endpoint without a salon call.
- HSTS in remote mode and `X-Content-Type-Options: nosniff` on all responses.
- `Dockerfile` for one instance behind a TLS proxy.
- End-to-end run with a real MCP SDK client and a fictional split-mode provider (`npm run test:e2e`).
- Threat model, hosting plan, publication audit, contributing guide, security policy, issue templates.
- CI: lint, typecheck, unit and end-to-end tests, full-history secret scan, dependency audit, actions pinned by SHA.

### Changed

- npm package name `booking-lab-gateway` → `cresavo-gateway` (not published to npm; no runtime effect).
- README rewritten for public use and points at `Cresavo/cresavo`.

### Unchanged on purpose

Wire names keep their v1 values: headers `x-booking-gateway-token` and `x-booking-lab-api`, discovery key `x-booking-lab`, MCP server name `booking-lab-gateway`, all routes and tool names.

## [0.1.0] - 2026-11-15

### Added

- Standalone REST v1 and Streamable HTTP MCP gateway for the salon provider, loopback only.
- Service token on every salon request; per-operation split-mode access check.
