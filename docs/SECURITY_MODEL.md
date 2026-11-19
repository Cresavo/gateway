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
| Customer data (name, email, phone, notes) | Salon database | Booking creation carries fictional name and email. Only the optional legacy OTP lab takes a phone. Agent booking responses omit contact details and notes. Never stored, cached or logged. |
| Mandates (customer consent) | Salon database | Referenced by opaque `mandateId`. The gateway cannot issue, extend or widen one. |
| Browser sessions, admin cookies | Salon only | Never cross the boundary in either direction (inbound `cookie` dropped, upstream `set-cookie` dropped). |

Trust boundaries: (1) internet → gateway, (2) gateway → salon, (3) customer browser → salon consent page. The gateway is never on boundary 3.

## 3. Data classes

Discovery, OpenAPI and liveness are public. Services, availability, proposal and booking operations and the MCP schema all require an agent credential in split v1. The planned publishable site keys, CORS allow-list and public booking tokens belong to a separate website API.

## 4. Authentication

### 4.1 Gateway → salon (service token)

- 32 random bytes as 64 lowercase hex characters. The gateway refuses to start with anything else.
- One token per environment. Never shared between demo, staging and production.
- Sent as `x-booking-gateway-token` on every salon request. A client-supplied header of the same name is overwritten.
- **Rotation:** today one token is valid at a time, so rotation means restarting both processes with the new value. Short downtime is accepted for the demo. Before production, the salon should accept two tokens (current and next) so that rotation has no downtime.
- Compromise: rotate at once. The token alone books nothing; it only proves the caller is the gateway. Every operation still needs an agent credential and, for writes, a customer mandate.

### 4.2 Agents → salon (agent credentials)

- The salon authenticates every agent credential. The gateway only checks that one is present (`authorization` or `x-api-key`) and forwards it.
- The gateway calls authenticated `GET /api/v1/access` once per incoming HTTP request that reaches salon authentication. All steps in that request share the result. The next request gets a fresh check. A successful access response must contain `apiVersion: "v1"`, `providerMode: "split"` and a `scopes` array. An invalid confirmation stops dispatch with 503 `provider_configuration_invalid`.
- MCP tool calls are refused with 403 `forbidden_scope` when none of the tool's scopes are in the answer. The salon checks scopes again.
- **Target model (accepted):** OAuth 2.1 with PKCE, 15-minute access tokens, rotating refresh tokens with reuse detection, separate read and write scopes. No third-party owner API keys.
- **Current state (gap):** the v1 contract still advertises provider-issued agent keys (`blk_<prefix>_<secret>`, `accepted_mechanisms: ["api_key"]`). These are per-agent keys issued by the salon for the synthetic demo, not owner API keys. Moving to OAuth 2.1 is a salon change; the gateway then only forwards bearer access tokens and must:
  - publish the salon's authorization server metadata in discovery, not run its own authorization server;
  - forward only `Authorization: Bearer`; never see, store or refresh refresh tokens;
  - on 401 with `WWW-Authenticate`, pass the header through unchanged so the client can refresh.
- The existing loopback OAuth lab supports S256 and five-minute access tokens. Production refresh-token rotation, reuse detection and revoking the token family are salon-side work.

### 4.3 Writes and consent

The agent creates a proposal with `business`, `serviceId`, positive `serviceVersion`, `staffId` and an offset-aware `start`. The response is 201 with a top-level `proposal`. The agent reads it using `get_proposal` or `GET /api/v1/proposals/{id}`. Neither response includes an `apiVersion` field. Creation validates the service and staff. The proposal reserves no slot.

- Separate customer channel. The create response adds `approvalRequired: true` and `approvalDelivery: "separate-synthetic-customer"`. The salon privately delivers the fragment-bearing approval URL to a fixed synthetic customer. The server rejects `customerPhone`. On booking it verifies the bound name and email.
- Legacy lab. Creation adds a top-level `approvalUrl`. Possession of that link allows the view and decision flow. The optional local OTP profile additionally requires a six-digit code and a lab-format phone. Codes expire after 600 seconds by default. Five failed attempts exhaust a code and resend defaults to a 60-second cooldown. Neither lab establishes real customer identity.
- Consent. The browser clears the fragment and posts JSON to `/consent/{id}/decision` on the salon. `view` takes the token and returns `proposal`, `proposalHash` and `customer`. A decision sends the token, hash, `yes` or `no` and the code where required. The handler enforces same origin, verified loopback and absence of agent credentials. Its 403 body is `{"error":"consent_denied"}`. Approval returns `{"status":"approved"}`. Only the agent's fresh read of an approved proposal includes `mandateId`.
- Mandate. The salon takes lowercase hexadecimal SHA-256 of UTF-8 JSON encoding the ordered array `["booking-proposal-v1", businessId, clientId, serviceId, staffId, locationId, scheduleId, start.toISOString(), duration, priceOre, "SEK"]`. Service version is checked separately. Expiry is the earlier of the proposed start and proposal creation plus TTL (default 600 s, range 1–900 s). The mandate inherits that expiry. Booking checks the approved proposal linkage, principal, whole time interval, price, expiry, revocation, single use and slot in the salon transaction.
- Creation requires `confirmed: true`, an existing mandate and a stable idempotency key. The trusted salon operator can separately issue bounded synthetic grants outside REST/MCP. Owner-reviewed studio changes and their scoped OAuth grants are a different interface.
- Direct cancellation. Salon v1 accepts a write-scoped owner of the booking without a cancellation proposal. Both gateway transports deny that operation after access. REST returns 403 `mandate_denied`; MCP returns a tool error. Payments, export and bulk delete have no gateway route.

## 5. Rate limits and idempotency

| Budget | Enforcer |
| --- | --- |
| 60 requests/minute per IP, including writes and discovery | Gateway |
| 5 booking creates/hour and separately 5 proposal creates/hour per IP | Gateway |
| 300 authenticated agent API calls/15 minutes per stable client | Salon, memory or PostgreSQL. An access check plus an operation costs two calls. |
| Native booking attempts, 30/15 minutes per booking channel key | Salon booking engine |
| 5 bookings per stable client and 3 per normalized contact per business per Stockholm creation day | Salon booking engine |

The accepted website API design specifies 60 reads/minute per IP, 600/minute per salon, 5 creates/hour per IP, 30/hour per salon and three active bookings per contact. Owner-token targets are 120/minute and 10,000/day, and export is limited to two/day. Those salon-wide, active-contact, owner and export targets describe different interfaces. The split v1 engine applies the budgets above. An upstream 429 retains its `Retry-After` over REST. Gateway admission failures use HTTP 429 on both transports; a tool-level provider error in an MCP result has no HTTP retry header.

- Client IP: the socket address on loopback; behind a proxy, the entry `GATEWAY_TRUST_PROXY_HOPS` positions from the right of `X-Forwarded-For`. Entries further left are client-controlled and ignored.
- MCP requests carry exactly one JSON-RPC message. Batches (JSON arrays) and unparsable bodies get 400 before any limit or salon call. The gateway parses the body once (a leading BOM is removed) and forwards the re-serialised message, so the limiter, the scope check and the MCP handler always see the same call.
- IPv4-mapped IPv6 addresses are unmapped and IPv6 clients are keyed per /64. An invalid `X-Forwarded-For` entry falls back to the socket address.
- The counter table is capped at 100 000 live keys. When it is full of live windows, new clients get 429 (fail closed) instead of memory growing.
- Counters are in memory, per process. Run exactly one gateway instance per provider, or move counters to a shared store before scaling out.
- Idempotency: booking creation requires `Idempotency-Key`; the salon stores the result. On timeout or 503 the client must retry with the **same** key. Retries count against the gateway's create limit; 5/hour leaves room for normal retries.

## 6. Untrusted text

The strict split-v1 booking input has no note field. Its response projection omits customer names, emails, booking notes and journal text. There is no v1 note delimiter on this wire. The separate paired-owner MCP nests quoted customer names, service labels and Inbox messages inside `untrustedCustomerText`. Assistant replies belong in `untrustedAssistantText.reply`. The platform plan requires delimiter protection if notes become available to AI tools. The gateway preserves JSON field boundaries in text and structured MCP results. Tool descriptions are static.

## 7. What the gateway must never do

1. **Invent a booking result.** On timeout, network error or invalid salon reply it answers 502/503 and tells the client to retry with the same idempotency key. It never answers "booked" without a salon response.
2. **Reuse access across requests.** The access result belongs to one incoming request, including when MCP checks a tool's scope and then dispatches it. The salon independently checks the service identity, agent credential and required scope on the forwarded operation. Authenticated gateway responses carry `cache-control: no-store`.
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
| Salon in wrong mode after restart | Each incoming request gets a fresh access check. If the salon restarts in standalone mode between that check and dispatch, it rejects the gateway-marked operation. |
| Agent changes price, staff or time after consent | Mandate hash re-checked at booking; mismatch is `mandate_denied`. |
| Double booking through retries | Salon idempotency keys and transactional scheduling; gateway passes the key through. |
| SMS pumping through proposals | Proposal bucket 5/hour per IP; salon stable-client budget. |
| Browser CSRF or DNS rebinding against the gateway | Host and Origin must equal the gateway's own origin. |
| Credential leak through redirects | `redirect: "error"`. |
| Request smuggling of other salon routes | Allow-list of paths and methods; `//`, `\` and `#` refused. |
| Oversized bodies | 64 KiB limit on gateway and MCP handler. |
| Rate-limit bypass through JSON-RPC batches or parser differences | One message per request; parsed once and re-serialised before limiting and dispatch. |
| Prompt injection via customer text | Split v1 omits notes and contact details from booking results (section 6). |
| Spoofed client IP to dodge limits | Only the trusted proxy hop of `X-Forwarded-For` is used. |

## 9. Leaving loopback

Default is loopback only. Remote mode needs all of these, or the process refuses to start:

- `GATEWAY_ALLOW_REMOTE=1`
- `GATEWAY_PUBLIC_ORIGIN=https://…` (bare origin). Host and Origin are pinned to it; discovery advertises it; HSTS is sent.
- `GATEWAY_TRUST_PROXY_HOPS` ≥ 1: TLS ends at a proxy the operator controls.
- `SALON_ORIGIN` over HTTPS.
- `GATEWAY_LISTEN_HOST` set to `0.0.0.0` or `::` only if the proxy reaches the process over a private network.
- **The process must be reachable only through the proxy.** If clients can reach the port directly, they can write their own `X-Forwarded-For` and pick their rate-limit key.

What changes in the threat picture:

- The gateway is reachable by anyone. Per-IP limits and the proxy's own limits become the first defense; the salon independently enforces stable-client and contact budgets.
- The service token crosses the internet to the salon. HTTPS is mandatory and redirects stay refused.
- Logs on the hosting platform must not record `Authorization`, `X-API-Key` or request bodies. Disable request-body logging on the proxy.
- Run one instance (in-memory counters). Restarting resets counters; the salon's limits still apply.
- Errors stay generic (`internal_error`); stack traces are never returned.

## 10. Known gaps before production

1. OAuth 2.1 (PKCE, 15-minute tokens, rotating refresh tokens) is not yet the salon's agent auth; v1 uses provider-issued demo keys.
2. Single service token; zero-downtime rotation needs the salon to accept two.
3. Rate-limit counters are per process. The gateway does not verify that the peer is the proxy; that relies on network isolation (an allow-list of proxy addresses is a possible addition).
4. Real SMS delivery and customer identification remain open. The pinned local SMS lab cannot accept a PTS-reserved fictional mobile number. See [the end-to-end evidence](E2E.md).
5. Direct cancellation remains disabled until a salon cancellation proposal can carry approval.

## Split v1 route and scope reference

| Gateway operation | Salon request | Scope and result |
| --- | --- | --- |
| MCP initialize, list, schema | Internal `GET /api/v1/access` | Any of the four agent scopes. Returns `apiVersion`, `providerMode`, `scopes` to the gateway. |
| `list_services`, `usp_services_list`, `usp_services_get` | `GET /api/v1/services?business=…` | `services:read`. Returns `business` and `services`. The single-service alias selects the matching catalog row and returns `service`. |
| `get_availability`, `usp_availability_query` | `GET /api/v1/availability` | `availability:read`. Requires business and service. Accepts optional staff and either date or an inclusive from/to range of up to 14 days. Each slot identifies staff, service version, start, end, duration, location and schedule. |
| `create_proposal` | `POST /api/v1/proposals` | `bookings:write`. Result and customer delivery are described in section 4.3. |
| `get_proposal` with `proposalId` | `GET /api/v1/proposals/{id}` | Either `bookings:read` or `bookings:write`, restricted to the stable client and business. Returns only `proposal`. |
| `create_booking`, `usp_bookings_create` | `POST /api/v1/bookings` | `bookings:write`. MCP's `idempotencyKey` becomes the REST header. Body carries business, service ID/version, staff ID, start, fictional customer name/email, confirmed and mandate ID. Returns `apiVersion`, `booking`, `replayed` (201 new, 200 replay). |
| `get_booking`, `usp_bookings_get` with `bookingId` | `GET /api/v1/bookings/{id}` | `bookings:read` plus stable-client ownership. Returns `apiVersion` and `booking`. |
| `cancel_booking`, REST `POST /api/v1/bookings/{id}/cancel` | Access check only | Salon v1's native write would return `apiVersion`, `booking`, `alreadyCancelled`. The gateway denies direct cancellation. |

The gateway hosts `/api/v1/mcp` and its schema. The salon disables its embedded versions in split mode. The salon hosts the consent page and decision endpoint, authenticated calendar, operator key/mandate issuance and audit trail. The optional mock partner and payment interface are internal provider code. Owner pairing at `/mcp/owner` has separate OAuth scopes for booking proposals, customers, Inbox, catalog, staff and finance. Its studio Inbox decides owner proposals. None of those owner-only operations or grants is part of the customer gateway.

REST errors carry `apiVersion` and `error: {code, message}`. Tool execution errors carry `isError: true` and JSON text with `error`. Transport and access errors can precede tool dispatch. The salon's 400 codes are `invalid_request`, `range_too_large`, `confirmation_required`, `mandate_required`, `idempotency_key_required` and `synthetic_contact_required`. It uses 401 `unauthorized`, 403 `forbidden_scope`, `forbidden_business` or `mandate_denied`, and 404 `business_not_found`, `service_not_found`, `staff_not_found` or `booking_not_found` (also used for missing or foreign proposals). The 409 codes are `slot_unavailable`, `stale_service` and `idempotency_conflict`. A budget refusal is 429 `rate_limited`. The gateway replaces upstream 5xx, including salon `internal_error` and restart-time `provider_configuration_invalid`, with static 503 `provider_unavailable`. Invalid successful access confirmation produces gateway 503 `provider_configuration_invalid`. An invalid operation document produces 502 `provider_invalid_response`. Additional gateway transport codes are `forbidden_origin`, `not_found`, `request_too_large` and `internal_error`.

Sources at the pinned provider revision: [split contract](https://github.com/Cresavo/cresavo/blob/ffbfc48e2299bb4854eba71698468f9745d61b99/docs/GATEWAY_SPLIT.md), [assistant interfaces](https://github.com/Cresavo/cresavo/blob/ffbfc48e2299bb4854eba71698468f9745d61b99/docs/CONNECT_AI_ASSISTANT.md), [agent implementation](https://github.com/Cresavo/cresavo/tree/ffbfc48e2299bb4854eba71698468f9745d61b99/src/lib/agent-api), [API platform](https://github.com/Cresavo/cresavo/blob/ffbfc48e2299bb4854eba71698468f9745d61b99/docs/design/API_PLATFORM.md), [accepted decisions](https://github.com/Cresavo/cresavo/blob/ffbfc48e2299bb4854eba71698468f9745d61b99/docs/design/ARCHITECTURE_DECISIONS.md).
