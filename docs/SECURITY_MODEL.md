# Security model and threat model

This document applies the accepted Cresavo security model (Cresavo repository, `docs/design/ARCHITECTURE_DECISIONS.md`) to the gateway. If the two disagree, the Cresavo document wins and this file must be fixed.

## 1. What the gateway is

```
AI assistant ──HTTPS──▶ gateway (REST v1 + Streamable HTTP MCP) ──HTTPS──▶ Cresavo salon provider (split mode)
                                 no database, no customer store            owns data, auth, mandates, bookings
```

The gateway translates requests and enforces transport rules. It **decides nothing about bookings**. The salon owns the database, calendar, prices, authentication of agent credentials, mandates, booking ownership, idempotency and scheduling.

## 2. Assets and trust boundaries

| Asset | Where it lives | Gateway exposure |
| --- | --- | --- |
| `GATEWAY_SERVICE_TOKEN` (gateway → salon identity) | Gateway and salon environments only | Sent to the salon on each request. Never to clients, never in URLs or logs. |
| Agent credentials (bearer or `X-API-Key`) | Issued and verified by the salon | Passed through to the salon unchanged. Never stored or logged. |
| Customer data (name, email, phone, notes) | Salon database | Passes through in request and response bodies only. Never stored, cached or logged. |
| Mandates (customer consent) | Salon database | Referenced by opaque `mandateId`. The gateway cannot issue, extend or widen one. |
| Browser sessions, admin cookies | Salon only | Never cross the boundary in either direction (inbound `cookie` dropped, upstream `set-cookie` dropped). |

Trust boundaries: (1) internet → gateway, (2) gateway → salon, (3) customer browser → salon consent page. The gateway is never on boundary 3.

## 3. Data classes

- **Public, no auth** (salon decides; the gateway forwards): salon profile, services, prices, free slots, creating a booking, viewing or cancelling it with an unguessable token.
- **Customer data is never public.** No gateway route returns customer data without an agent credential the salon accepts for that business and booking.
- The gateway publishes discovery (`/.well-known/usp`, `/llms.txt`, `/api/v1/openapi`) without a provider. These contain no salon or customer data.

## 4. Authentication

### 4.1 Gateway → salon (service token)

- 32 random bytes as 64 lowercase hex characters. The gateway refuses to start with anything else.
- One token per environment. Never shared between demo, staging and production.
- Sent as `x-booking-gateway-token` on every salon request. A client-supplied header of the same name is overwritten.
- **Rotation:** today one token is valid at a time, so rotation means restarting both processes with the new value. Short downtime is accepted for the demo. Before production, the salon should accept two tokens (current and next) so that rotation has no downtime.
- Compromise: rotate at once. The token alone books nothing; it only proves the caller is the gateway. Every operation still needs an agent credential and, for writes, a customer mandate.

### 4.2 Agents → salon (agent credentials)

- The salon authenticates every agent credential. The gateway only checks that one is present (`authorization` or `x-api-key`) and forwards it.
- Before each operation the gateway calls authenticated `GET /api/v1/access`. The answer must contain `apiVersion: "v1"`, `providerMode: "split"` and a `scopes` array. Anything else gives 503 `provider_configuration_invalid` and the operation is not sent.
- MCP tool calls are refused with 403 `forbidden_scope` when none of the tool's scopes are in the answer. The salon checks scopes again.
- **Target model (accepted):** OAuth 2.1 with PKCE, 15-minute access tokens, rotating refresh tokens with reuse detection, separate read and write scopes. No third-party owner API keys.
- **Current state (gap):** the v1 contract still advertises provider-issued agent keys (`blk_<prefix>_<secret>`, `accepted_mechanisms: ["api_key"]`). These are per-agent keys issued by the salon for the synthetic demo, not owner API keys. Moving to OAuth 2.1 is a salon change; the gateway then only forwards bearer access tokens and must:
  - publish the salon's authorization server metadata in discovery, not run its own authorization server;
  - forward only `Authorization: Bearer`; never see, store or refresh refresh tokens;
  - on 401 with `WWW-Authenticate`, pass the header through unchanged so the client can refresh.
- Refresh-token rotation and reuse detection are implemented by the salon. A replayed refresh token must revoke the whole token family.

### 4.3 Writes and consent

- Third-party writes are **propose-and-approve**: `create_proposal` → customer opens `/consent/[id]` and enters the simulated SMS code → salon stores a mandate locked by a hash over service, staff, start time, duration and price → `create_booking` with `mandateId` → salon re-checks hash, expiry, single use and slot.
- `confirmed: true` grants nothing. No API or MCP tool issues mandates.
- **Never direct, in any form:** payments, data export, bulk delete. The gateway has no route for them, and `allowedRoute` refuses unknown paths before the salon is contacted.

## 5. Rate limits and idempotency

| Limit | Value | Enforced by |
| --- | --- | --- |
| Public reads | 60/min per IP | Gateway (per client IP) and salon |
| Public reads | 600/min per salon | Salon |
| Booking creates | 5/hour per IP | Gateway (per client IP) and salon |
| Proposal creates | 5/hour per IP (gateway, separate bucket) | Gateway |
| Booking creates | 30/hour per salon | Salon |

- All limits answer **429 with `Retry-After`**. A salon 429 and its `Retry-After` are passed through unchanged.
- **Why the gateway enforces per-IP limits:** in split mode the salon sees every agent request coming from the gateway's address, so per-IP limits at the salon would apply to all agents together. The gateway applies per-IP limits before any salon call and does not forward client IPs (a client-supplied `x-forwarded-for` is dropped).
- Proposals have their own bucket because each proposal sends a (simulated) SMS: this caps SMS pumping.
- Client IP: the socket address on loopback; behind a proxy, the entry `GATEWAY_TRUST_PROXY_HOPS` positions from the right of `X-Forwarded-For`. Entries further left are client-controlled and ignored.
- Counters are in memory, per process. Run exactly one gateway instance per provider, or move counters to a shared store before scaling out.
- Idempotency: booking creation requires `Idempotency-Key`; the salon stores the result. On timeout or 503 the client must retry with the **same** key. Retries count against the gateway's create limit; 5/hour leaves room for normal retries.

## 6. Untrusted text

Customer-written text (booking notes) is untrusted input for AI tools. The salon must return it only inside a clearly delimited untrusted field. The gateway must never merge such text into tool descriptions, error messages or other trusted fields. Today the gateway returns the salon JSON verbatim as MCP `structuredContent` and as JSON text, so a delimited salon field stays delimited.

## 7. What the gateway must never do

1. **Invent a booking result.** On timeout, network error or invalid salon reply it answers 502/503 and tells the client to retry with the same idempotency key. It never answers "booked" without a salon response.
2. **Cache access.** The split-mode and scope check is repeated for every operation, including status and cancel, and is never reused across requests or after a salon restart. Responses carry `cache-control: no-store`.
3. **Forward browser sessions.** Inbound cookies are not forwarded; upstream `set-cookie` is not returned. The gateway never handles the consent page.
4. Follow redirects from the salon (requests use `redirect: "error"`, so credentials never reach a redirect target).
5. Accept a salon origin with credentials, path, query or fragment, or plain HTTP to anything but loopback.
6. Log request bodies, headers, tokens or customer data. It logs only the ready line.
7. Store anything. It has no database and no disk writes.
8. Send webhooks. If the gateway ever sends them: HTTPS only, block private, loopback, link-local and cloud metadata ranges after DNS resolution, no redirects, HMAC-SHA256 signature over timestamp and body.

## 8. Threats and controls

| Threat | Control |
| --- | --- |
| Stolen agent credential used through the gateway | Salon verifies credential, scopes and business; writes still need a customer mandate; per-IP limits. Short-lived OAuth tokens once implemented. |
| Gateway impersonation towards the salon | Service token checked by the salon; salon reports `providerMode: "split"` only after checking both credentials. |
| Salon in wrong mode after restart | Per-operation access check, no caching. |
| Agent changes price, staff or time after consent | Mandate hash re-checked at booking; mismatch is `mandate_denied`. |
| Double booking through retries | Salon idempotency keys and transactional scheduling; gateway passes the key through. |
| SMS pumping through proposals | Proposal bucket 5/hour per IP; salon per-salon limits. |
| Browser CSRF or DNS rebinding against the gateway | Host and Origin must equal the gateway's own origin. |
| Credential leak through redirects | `redirect: "error"`. |
| Request smuggling of other salon routes | Allow-list of paths and methods; `//`, `\` and `#` refused. |
| Oversized bodies | 64 KiB limit on gateway and MCP handler. |
| Prompt injection via customer text | Delimited untrusted field (salon), passed through unchanged (section 6). |
| Spoofed client IP to dodge limits | Only the trusted proxy hop of `X-Forwarded-For` is used. |

## 9. Leaving loopback

Default is loopback only. Remote mode needs all of these, or the process refuses to start:

- `GATEWAY_ALLOW_REMOTE=1`
- `GATEWAY_PUBLIC_ORIGIN=https://…` (bare origin). Host and Origin are pinned to it; discovery advertises it; HSTS is sent.
- `GATEWAY_TRUST_PROXY_HOPS` ≥ 1: TLS ends at a proxy the operator controls.
- `SALON_ORIGIN` over HTTPS.
- `GATEWAY_LISTEN_HOST` set to `0.0.0.0` or `::` only if the proxy reaches the process over a private network.

What changes in the threat picture:

- The gateway is reachable by anyone. Per-IP limits and the proxy's own limits become the first defense; the salon's per-salon limits are the backstop.
- The service token crosses the internet to the salon. HTTPS is mandatory and redirects stay refused.
- Logs on the hosting platform must not record `Authorization`, `X-API-Key` or request bodies. Disable request-body logging on the proxy.
- Run one instance (in-memory counters). Restarting resets counters; the salon's limits still apply.
- Errors stay generic (`internal_error`); stack traces are never returned.

## 10. Known gaps before production

1. OAuth 2.1 (PKCE, 15-minute tokens, rotating refresh tokens) is not yet the salon's agent auth; v1 uses provider-issued demo keys.
2. Single service token; zero-downtime rotation needs the salon to accept two.
3. Rate-limit counters are per process.
4. Proposal and consent routes are implemented but not yet in `openapi.yaml`.
5. The end-to-end run in this repository uses a fictional fixture provider. A run against a real Cresavo provider in split mode is still needed (see `docs/E2E.md`).
