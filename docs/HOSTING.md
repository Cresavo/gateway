# Hosting plan

Goal: run the gateway beyond loopback, behind HTTPS, against the public Cresavo demo provider. Loopback stays the default.

## Options

| | Serverless functions (e.g. Vercel) | Small container host (one instance) | Self-managed VM |
| --- | --- | --- | --- |
| Fit with the code | Needs an adapter from `node:http` to a fetch handler | Runs `node src/server.js` unchanged | Unchanged |
| In-memory rate limits | Broken: each invocation may be a new instance, so per-IP limits stop working without an external store | Works with one instance | Works |
| Streamable HTTP MCP | JSON responses work; long-lived GET/SSE streams hit function time limits | Works | Works |
| Cold starts on every access check chain | Yes, adds latency to each MCP call (access check + operation) | No | No |
| TLS and HTTPS | Built in | Built in on most hosts | Operator runs a proxy and certificates |
| Operations effort | Lowest | Low | Highest |
| Cost for a demo | Free tier possible | Low fixed cost | Low fixed cost, more time |

## Decision

**A small container host running exactly one instance**, with TLS terminated by the host's proxy. It runs the same entry point as local development, keeps in-memory per-IP limits correct, and supports every MCP transport mode. Serverless functions would need an external rate-limit store and a request adapter, which adds moving parts for no gain at demo scale.

Any host that runs a Docker image, gives HTTPS on a custom domain, and can pin the instance count to one, works. The repository does not depend on a particular vendor.

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
2. Instance count pinned to 1; no autoscaling.
3. The proxy forwards the original `Host` header (lowercase, no trailing dot) and appends exactly one `X-Forwarded-For` entry. The container port is reachable only by the proxy, never published to the internet.
4. Request logging without headers and bodies.
5. The service token stored in the host's secret store, distinct from every other environment.
6. A per-IP connection or request limit at the proxy, if the host offers one, as an extra layer.
