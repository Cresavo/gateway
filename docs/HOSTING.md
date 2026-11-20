# Hosting plan

Goal: run the gateway beyond loopback, behind HTTPS, against the public Cresavo demo provider. Loopback stays the default.

## Prerequisite: a public split-mode provider

The gateway needs a provider in split mode that answers `GET /api/v1/access` with `providerMode: "split"`. For the hosted demo this is the Cresavo **sandbox**: the Cresavo engine with its own PostgreSQL and Redis, fictional data only, a nightly reset, and a private demo phone for customer consent. It is built in Cresavo pull requests 90–93 and described in Cresavo's `docs/DEPLOY_SANDBOX.md`. Until it is deployed, no public split-mode provider exists.

`https://demo.cresavo.com` is not a provider. It serves the browser-only concept demo (`/studio`, `/boka/salong-eko`) without a database. Pointing `SALON_ORIGIN` at it fails closed: without a successful split confirmation from `GET /api/v1/access`, no operation is forwarded. Clients get an error (502 `provider_invalid_response`, 503 `provider_configuration_invalid` or the provider's own 4xx), never a booking result.

## Options

| | Serverless functions (e.g. Vercel) | Small container host (one instance) | Self-managed VM |
| --- | --- | --- | --- |
| Fit with the code | Vercel's container runtime builds the same `Dockerfile` (`vercel.json`: `"framework": "container"`) | Runs `node src/server.js` unchanged | Unchanged |
| Rate limits | Need the shared Redis store (`GATEWAY_RATE_LIMIT_REDIS_URL`): instances scale out | In memory with one instance, or the shared store | Works |
| Streamable HTTP MCP | JSON responses work; long-lived GET/SSE streams hit function time limits | Works | Works |
| Cold starts on every access check chain | Yes, adds latency to each MCP call (access check + operation) | No | No |
| TLS and HTTPS | Built in | Built in on most hosts | Operator runs a proxy and certificates |
| Operations effort | Lowest | Low | Highest |
| Cost for a demo | Free tier possible | Low fixed cost | Low fixed cost, more time |

## Decision (original)

**A small container host running exactly one instance**, with TLS terminated by the host's proxy. It runs the same entry point as local development, keeps in-memory per-IP limits correct, and supports every MCP transport mode. Serverless functions would need an external rate-limit store and a request adapter, which adds moving parts for no gain at demo scale.

Any host that runs a Docker image, gives HTTPS on a custom domain, and can pin the instance count to one, works. The repository does not depend on a particular vendor.

## Vercel (container runtime)

The owner chose to run the demo as its own project in the same Vercel team as the Cresavo site. The same `Dockerfile` serves every host; `vercel.json` only selects the container preset. Vercel may run several instances, so shared rate limits are mandatory there:

- Set `GATEWAY_RATE_LIMIT_REDIS_URL` to a `rediss://` URL (any Redis-protocol store: Redis, Valkey, a Vercel Marketplace Redis integration). It is a secret.
- Set `GATEWAY_REQUIRE_SHARED_LIMITS=1`. The process also requires the store when it sees Vercel's `VERCEL` variable, but the explicit flag does not depend on that.
- Set the remote flags below, with `GATEWAY_PUBLIC_ORIGIN=https://gateway.cresavo.com` and `GATEWAY_TRUST_PROXY_HOPS=1` (Vercel sends the client address in `X-Forwarded-For`).
- Host pinning refuses Vercel's own `*.vercel.app` deployment URLs. Only the custom domain serves requests, plus `/healthz`.

### Cost safety

The demo must never cost more than the plan already paid for. When a quota runs out it stops working; nothing is billed beyond it.

- Use only Marketplace plans that are free and need no payment method, for Redis and for any provider database.
- Give the gateway project a Vercel per-project budget with **pause production** enabled.
- Out-of-quota behaviour is safe by design. If the store stops answering, reads continue on per-instance counters and creates are refused with 429. If the provider stops answering, the gateway answers `503 provider_unavailable` and never invents a booking result.

The limiter checks and counts every bucket in one atomic Lua script, so instances never admit more than the limit together. If the store does not answer within 500 ms, reads fall back to the instance's own counters and creates (bookings and proposals) are refused with 429. A store outage never lifts the write limits.

### Demo topology

```
assistant ──HTTPS──▶ gateway.cresavo.com    (Vercel project 1: this Dockerfile, container preset)
                          │ HTTPS, x-booking-gateway-token + agent key
                          │                   └─ shared Redis (free plan): gateway rate limits
                          ▼
                     sandbox provider        (Vercel project 2: Cresavo engine, split mode)
                          │                   ├─ PostgreSQL (free plan): fictional data, nightly reset
                          │                   └─ Redis (free plan): sandbox caps
                          ▼
                     demo phone              (consent page on the sandbox origin, never via the gateway)
```

- Two projects in the same Vercel team, each with its own budget and **pause production**, and separate custom domains. The gateway's Host/Origin pinning and the sandbox's consent origin never overlap.
- One service token, used only by this pair. It lives in both projects' production environment variables and nowhere else. Rotation means updating both and redeploying both.
- The gateway's Redis and the sandbox's Redis are separate stores, so one quota running out cannot lift the other's limits.
- The gateway does not forward the agent's address to the provider. It applies its own per-IP limits and calls the sandbox from Vercel's egress addresses. That matches the sandbox design (Cresavo pull requests 91–93): the per-IP cap (3 pairings per UTC day, keyed on Vercel's `x-real-ip`) applies only to browser pairing at the sandbox. Pairing refuses requests that carry `x-booking-gateway-token` or an agent credential. Traffic through the gateway is limited per sandbox session (20 bookings, 256 calls; each gateway operation costs two calls because of the access check). Do not put another proxy, such as a CDN, in front of the sandbox: `x-real-ip` would then be that proxy's address.

## Configuration

All flags are explicit. Without them the gateway binds to `127.0.0.1` and refuses any other host.

| Variable | Loopback (default) | Remote |
| --- | --- | --- |
| `SALON_ORIGIN` | `http://127.0.0.1:3217` | `https://<demo provider origin>` (HTTPS required) |
| `GATEWAY_SERVICE_TOKEN` | secret | secret, from the host's secret store |
| `PORT` | `3218` | the port the host routes to |
| `GATEWAY_ALLOW_REMOTE` | unset or `0` | `1` |
| `GATEWAY_LISTEN_HOST` | `127.0.0.1` | `0.0.0.0` (inside the container) |
| `GATEWAY_PUBLIC_ORIGIN` | must be unset | `https://<gateway domain>` |
| `GATEWAY_TRUST_PROXY_HOPS` | must be unset or `0` | `1` for one proxy in front |
| `GATEWAY_RATE_LIMIT_REDIS_URL` | optional, `redis://` on loopback | `rediss://…`, required with more than one instance. Secret. |
| `GATEWAY_REQUIRE_SHARED_LIMITS` | unset | `1` where the host may run several instances |

Locally, use `127.0.0.1`, not `localhost`: the Host check accepts only the exact origin.

The process refuses to start on a partial remote setup (for example a public bind without `GATEWAY_PUBLIC_ORIGIN`, or HTTP salon origin in remote mode). See `src/config.js` and `test/hosting.test.js`.

## Container

`Dockerfile` builds a production image: Node 24 slim, production dependencies only, non-root user, no secrets in the image. It sets the remote flags except `GATEWAY_PUBLIC_ORIGIN`, `SALON_ORIGIN` and `GATEWAY_SERVICE_TOKEN`, which come from the host at run time. Health check: `GET /healthz` (no salon call).

```sh
docker build -t cresavo-gateway .
docker run --rm -p 3218:3218 \
  -e SALON_ORIGIN=https://demo-salon.example.test \
  -e GATEWAY_PUBLIC_ORIGIN=https://gateway.example.test \
  -e GATEWAY_SERVICE_TOKEN \
  cresavo-gateway
```

`-e GATEWAY_SERVICE_TOKEN` without a value takes it from your shell, so it never appears in shell history or the command line.

## Host requirements

1. HTTPS only, HTTP redirected to HTTPS by the host.
2. Instance count pinned to 1, unless `GATEWAY_RATE_LIMIT_REDIS_URL` points at a shared store.
3. The proxy forwards the original `Host` header (lowercase, no trailing dot) and appends exactly one `X-Forwarded-For` entry. The container port is reachable only by the proxy, never published to the internet.
4. Request logging without headers and bodies.
5. The service token stored in the host's secret store, distinct from every other environment.
6. A per-IP connection or request limit at the proxy, if the host offers one, as an extra layer.
