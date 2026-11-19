// SPDX-License-Identifier: AGPL-3.0-only
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { mcpResponse } from "./mcp.js";
import { nativeMcpSchema } from "./mcp-inputs.js";
import { uspProfile, llmsText } from "./discovery.js";
import { allowedRoute, connectProvider, errorReply } from "./provider.js";
import { classify, defaultLimits, rateLimiter } from "./limits.js";
import { clientAddress, loadConfig } from "./config.js";

// options.publicOrigin: the https origin clients use (remote mode only).
// options.trustProxyHops: proxies in front of the gateway that append X-Forwarded-For.
// options.limits / options.now: test seams for the rate limiter.
export function gateway(salon, serviceToken, options = {}) {
  const provider = connectProvider(salon, serviceToken);
  const take = rateLimiter(options.limits ?? defaultLimits, options.now);
  const hops = options.trustProxyHops ?? 0;
  return createServer(async (req, res) => {
    async function send(response) {
      const bytes = Buffer.from(await response.arrayBuffer());
      const headers = Object.fromEntries(response.headers);
      if (options.publicOrigin) headers["strict-transport-security"] = "max-age=31536000";
      headers["x-content-type-options"] = "nosniff";
      res.writeHead(response.status, headers);
      res.end(bytes);
    }
    try {
      // Liveness only: no salon call and no data, so it is answered before the Host check
      // for the container health probe.
      if (req.method === "GET" && req.url === "/healthz")
        return await send(Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } }));
      const origin = options.publicOrigin ?? "http://127.0.0.1:" + req.socket.localPort;
      // Accept only our own Host and Origin: refuses browser cross-origin and DNS-rebinding requests.
      if (req.headers.host !== new URL(origin).host || (req.headers.origin && req.headers.origin !== origin))
        return await send(errorReply(403, "forbidden_origin", "Origin refused."));
      if (!req.url.startsWith("/") || req.url.startsWith("//") || /[\\#]/.test(req.url))
        return await send(errorReply(400, "invalid_request", "Invalid request target."));
      const url = new URL(req.url, origin);
      const ip = clientAddress(req, hops);
      if (req.method === "GET" && ["/.well-known/usp", "/llms.txt", "/api/v1/openapi"].includes(url.pathname)) {
        const verdict = take(ip, ["read"]);
        if (!verdict.ok) return await send(limited(verdict.retryAfter));
        if (url.pathname === "/.well-known/usp") return await send(Response.json(uspProfile(origin)));
        if (url.pathname === "/llms.txt")
          return await send(new Response(llmsText(origin), { headers: { "content-type": "text/plain; charset=utf-8" } }));
        const spec = await readFile(new URL("../openapi.yaml", import.meta.url));
        return await send(new Response(spec, { headers: { "content-type": "application/yaml" } }));
      }
      const mcp = url.pathname === "/api/v1/mcp" && ["POST", "GET", "DELETE"].includes(req.method);
      const schema = req.method === "GET" && url.pathname === "/api/v1/mcp/schema";
      if (!mcp && !schema && !allowedRoute(req.method, url.pathname))
        return await send(errorReply(404, "not_found", "Unknown gateway operation."));
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) return await send(errorReply(413, "request_too_large", "Request too large."));
        chunks.push(chunk);
      }
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const verdict = take(ip, classify(req.method, url.pathname, body));
      if (!verdict.ok) return await send(limited(verdict.retryAfter));
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) if (typeof value === "string") headers.set(name, value);
      const call = provider.bind(null, headers);
      if (schema) {
        const auth = await call("GET", "/api/v1/access");
        return await send(auth.ok ? Response.json(nativeMcpSchema()) : auth);
      }
      if (mcp) return await send(await mcpResponse(new Request(url, { method: req.method, headers, body }), call));
      return await send(await call(req.method, url.pathname, url.search, body, headers.get("idempotency-key")));
    } catch {
      if (!res.headersSent) return await send(errorReply(500, "internal_error", "Gateway request failed."));
      res.end();
    }
  });
}

function limited(retryAfter) {
  const reply = errorReply(429, "rate_limited", "Too many requests. Retry later.");
  reply.headers.set("retry-after", String(retryAfter));
  return reply;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = loadConfig();
  gateway(config.salon, config.serviceToken, config.options)
    .listen(config.port, config.host, () => console.log("GATEWAY_READY " + config.port));
}
