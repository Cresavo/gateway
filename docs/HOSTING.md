# Hosting plan

Goal: run the gateway beyond loopback, behind HTTPS, against the public Cresavo demo provider. Loopback stays the default.

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

## Decision (original, before Vercel)

**A small container host running exactly one instance**, with TLS terminated by the host's proxy. It runs the same entry point as local development, keeps in-memory per-IP limits correct, and supports every MCP transport mode. Serverless functions would need an external rate-limit store and a request adapter, which adds moving parts for no gain at demo scale.

Any host that runs a Docker image, gives HTTPS on a custom domain, and can pin the instance count to one, works. The repository does not depend on a particular vendor.

## Vercel (container runtime)

The owner chose to run the demo as its own project in the same Vercel team as the Cresavo site. The same `Dockerfile` serves every host; `vercel.json` only selects the container preset. Vercel may run several instances, so shared rate limits are mandatory there:

- Set `GATEWAY_RATE_LIMIT_REDIS_URL` to a `rediss://` URL (any Redis-protocol store: Redis, Valkey, a Vercel Marketplace Redis integration). It is a secret.
- Set `GATEWAY_REQUIRE_SHARED_LIMITS=1`. The process also requires the store when it sees Vercel's `VERCEL` variable, but the explicit flag does not depend on that.
- Set the remote flags below, with `GATEWAY_PUBLIC_ORIGIN=https://gateway.cresavo.com` and `GATEWAY_TRUST_PROXY_HOPS=1` (Vercel sends the client address in `X-Forwarded-For`).
- Host pinning refuses Vercel's own `*.vercel.app` deployment URLs. Only the custom domain serves requests, plus `/healthz`.

### The hosted demo as configured

| Setting | Value |
| --- | --- |
| Project | `cresavo-gateway` in team `niclasvestlund-3367s-projects` (Pro), production branch `main` |
| Framework preset and region | Container, `fra1` (Frankfurt), the same region as the store |
| Public origin | `https://gateway.cresavo.com`. The `cresavo.com` zone is on Vercel DNS, and a wildcard record covers the name, so no manual record was needed. HTTP redirects to HTTPS. |
| Deployment protection | Vercel Authentication on all deployments except custom domains. Unauthenticated requests to `*.vercel.app` stop at Vercel's login and never reach the gateway. |
| Port | Vercel sets `PORT` (80) at run time, which overrides the image's 3218 |
| Provider | `SALON_ORIGIN=https://sandbox.cresavo.com`. No project owns that name yet. The connection fails before reaching any application (observed: booking tools answer `503 provider_unavailable`). Attach the name only to the sandbox project, because whoever serves it receives the service token. |
| Rate-limit store | Redis Cloud, Free plan (30 MB, 100 operations per second, 30 connections, no persistence), Frankfurt, `rediss://` |
| Spend | Team budget plus a project budget with **Pause production** |

Rules for the environment variables:

- Set `GATEWAY_SERVICE_TOKEN` and `GATEWAY_RATE_LIMIT_REDIS_URL` as **Sensitive** and for **Production only**. Preview deployments build any pushed branch; they must not receive the production service identity or store.
- When the sandbox goes live, generate one new service token and set it in both projects in the same change, then redeploy both.

### Instances, connections and limits

Vercel scales the container per request load. Early logs suggest one new instance for each concurrent request: six simultaneous requests produced five `GATEWAY_READY` lines. Each instance opens its own connection to the store. Consequences on the Free store plan:

- Above about 30 concurrent instances, new instances cannot connect. They still serve reads with per-instance counters and refuse creates with 429, so limits never loosen and nothing is billed. A burst can, however, make the demo refuse bookings for a while.
- Counters are lost if the store restarts (no persistence on Free), which at worst lets a client start a new window early.

Ways to reduce this, to be tried in this order:

1. Enable **Fluid compute** for the project, so one instance serves many concurrent requests. Vercel documents it for functions; check that it applies to the container runtime before relying on it, and watch whether the number of `GATEWAY_READY` lines drops.
2. If connections stay a problem, use a store reached over HTTPS without long-lived connections (for example Upstash's REST interface, which also has a free plan with TLS). That needs a small adapter in `src/shared-limits.js`.

Vercel documents a fixed instance count only for daemons (background workers), not for request-serving containers.

### Cost safety

The demo must never cost more than the plan already paid for. When a quota runs out it stops working; nothing is billed beyond it.

- Use only Marketplace plans that are free and need no payment method, for Redis and for any provider database.
- Give the gateway project a Vercel per-project budget with **pause production** enabled.
- Out-of-quota behaviour is safe by design. If the store stops answering, reads continue on per-instance counters and creates are refused with 429. If the provider stops answering, the gateway answers `503 provider_unavailable` and never invents a booking result.

The limiter checks and counts every bucket in one atomic Lua script, so instances never admit more than the limit together. If the store does not answer within 500 ms, reads fall back to the instance's own counters and creates (bookings and proposals) are refused with 429. A store outage never lifts the write limits.

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
