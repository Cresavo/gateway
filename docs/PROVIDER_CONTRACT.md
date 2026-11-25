# Provider contract v1

This is what a booking system (a *provider*) implements so the gateway can put AI assistants in front of it. The gateway owns the agent-facing side: MCP, REST for agents, discovery, tool schemas and per-IP limits. The provider owns everything that decides something: data, calendar, prices, agent credentials, customer approval, mandates, idempotency and scheduling.

[Cresavo](https://github.com/Cresavo/cresavo) is the first provider and the reference implementation. Nothing in this contract is specific to Cresavo.

The key words MUST, MUST NOT, SHOULD and MAY are used as in RFC 2119.

Check a running provider with `npm run provider:check`, and run the full agent scenarios against it with `npm run test:e2e -- --adapter <file>`. See [CONNECT_A_PROVIDER.md](CONNECT_A_PROVIDER.md).

## 1. Transport

- The provider MUST serve HTTPS. Plain HTTP is accepted only on loopback, for local development.
- Responses to every route in section 3 MUST be `application/json`.
- The provider MUST NOT redirect. The gateway treats any redirect as a failure, so credentials never reach another host.
- The provider SHOULD answer within 10 seconds. The gateway gives up after 15 seconds.
- A provider `5xx` reaches agents only as a static `503 provider_unavailable`. Put no detail in a 5xx that the agent would need.
- The provider MUST NOT set cookies on these routes. The gateway drops them anyway.

## 2. Authentication

Every request from the gateway carries two credentials, and the provider MUST check both.

| Header | Holds | Rule |
| --- | --- | --- |
| `x-booking-gateway-token` | The gateway's service token: 64 lowercase hex characters, one per environment, shared only by the two servers | Requests without the right value MUST get `401 unauthorized`, even when the agent credential is valid. Compare in constant time. |
| `Authorization: Bearer …` or `X-API-Key` | The agent's own credential, which the gateway passes through unchanged | The provider issues and verifies it. It decides the business, the scopes and which proposals and bookings the agent owns. |

The gateway never issues, stores or refreshes agent credentials. A provider that moves to OAuth 2.1 keeps this contract: the gateway forwards the bearer access token and passes `WWW-Authenticate` back unchanged.

## 3. Routes

All paths are under the provider's origin. `business` is the provider's business id.

| Method and path | Scope | Success |
| --- | --- | --- |
| `GET /api/v1/access` | any agent scope | `200 {"apiVersion":"v1","providerMode":"split","scopes":[…]}` |
| `GET /api/v1/services?business=` | `services:read` | `200 {"apiVersion":"v1","business":{"id","name","timeZone"},"services":[{"id","name","durationMinutes","price":{"amountMinor","currency"},"version","staff":[{"id","name"}]}]}` |
| `GET /api/v1/availability?business=&service=&date=` (or `from=` and `to=`, optional `staff=`) | `availability:read` | `200 {"apiVersion":"v1","service",…,"slots":[{"start","end","durationMinutes","serviceId","serviceVersion","staff":{"id","name"}}]}` |
| `POST /api/v1/proposals` | `bookings:write` | `201 {"proposal":{"id","status":"pending","expiresAt",…},"approvalRequired":true}` |
| `GET /api/v1/proposals/{id}` | `bookings:read` or `bookings:write` | `200 {"proposal":{…}}`, with `mandateId` once approved |
| `POST /api/v1/bookings` with `Idempotency-Key` | `bookings:write` | `201 {"apiVersion":"v1","booking":{…},"replayed":false}`, or `200` with `replayed: true` on a retry |
| `GET /api/v1/bookings/{id}` | `bookings:read` | `200 {"apiVersion":"v1","booking":{…}}` |

Rules for these routes:

- `GET /api/v1/access` MUST answer `providerMode: "split"` only after it has checked both credentials. The gateway calls it before every incoming request that reaches the provider, and refuses with `503 provider_configuration_invalid` when the answer is anything else.
- Times MUST be ISO 8601 with an offset. Prices MUST be integers in minor units (öre, cents).
- Availability ranges MUST be limited to 14 days (`400 range_too_large` beyond that).
- `POST /api/v1/bookings/{id}/cancel` exists in v1, but the gateway does not forward it. Cancellation will need its own customer approval.

The gateway sends only these routes. It never sends admin, owner, payment, export or bulk operations, and it never forwards browser sessions.

## 4. Customer approval and mandates

Third-party writes are propose and approve. This is the heart of the contract.

1. **Propose.** `POST /api/v1/proposals` records exact terms: service and version, staff, start, duration and price. It MUST NOT reserve the slot or create a mandate.
2. **Reach the customer.** The provider reaches the customer through its own channel (SMS, email, app). The response to the agent MUST NOT contain anything that approves by itself: no token and no link with a secret in it. A `consentUrl` without a secret is allowed, because the customer still proves who they are on the provider's page; Cresavo sends a one-time code to the address the customer types there. The gateway is never on the approval path.
3. **Approve.** When the customer approves, the provider creates a mandate bound to those exact terms. A hash over business, agent client, service, staff, location, start, duration and price is a good way to bind it.
4. **Book.** `POST /api/v1/bookings` carries the `mandateId`. The provider MUST check, at that moment:
   - the mandate exists, belongs to this agent and has not been used: otherwise `403 mandate_denied`
   - it has not expired: otherwise `403 mandate_denied`
   - the current terms still match what the customer approved: otherwise `403 mandate_denied`
   - the slot is still free, inside a transaction: otherwise `409 slot_unavailable`
   - the service version is current: otherwise `409 stale_service`
5. `confirmed: true` alone grants nothing. A booking without `mandateId` MUST be refused with `400 mandate_required`.

## 5. Idempotency

- `POST /api/v1/bookings` MUST require `Idempotency-Key` (`400 idempotency_key_required`), matching `^[A-Za-z0-9_-]{1,64}$`.
- The same key, agent and body MUST return the original booking (`200`, `replayed: true`) without using another mandate.
- The same key with a different body MUST return `409 idempotency_conflict`.
- Keys SHOULD be kept at least 24 hours.

## 6. Errors

Every error MUST use this shape:

```json
{"apiVersion":"v1","error":{"code":"mandate_denied","message":"Human-readable, no secrets"}}
```

| Status | Codes |
| --- | --- |
| 400 | `invalid_request`, `range_too_large`, `confirmation_required`, `mandate_required`, `idempotency_key_required`, `synthetic_contact_required` |
| 401 | `unauthorized` |
| 403 | `forbidden_scope`, `forbidden_business`, `mandate_denied` |
| 404 | `business_not_found`, `service_not_found`, `staff_not_found`, `booking_not_found` (also for unknown or foreign proposals, so their existence does not leak) |
| 409 | `slot_unavailable`, `stale_service`, `idempotency_conflict` |
| 429 | `rate_limited`, with `Retry-After` |

## 7. Limits

The gateway limits per client IP before anything reaches the provider. The provider sees all agent traffic as coming from the gateway, so it SHOULD limit per agent credential, per business and per customer contact, and answer `429 rate_limited` with `Retry-After`. The gateway passes `Retry-After` through.

## 8. Untrusted text

Customer-written text (notes, names, messages) is untrusted input for AI assistants. If a response includes such text, the provider MUST put it in a clearly delimited field, for example `untrustedCustomerText`. It must never be merged into fields that assistants treat as instructions. The gateway preserves JSON boundaries and never moves text between fields.

## 9. Versioning

`apiVersion: "v1"` and `providerMode: "split"` identify this contract. Additive fields are allowed within v1, and gateways ignore fields they do not know. A breaking change gets a new version, and the gateway and provider are upgraded together.
