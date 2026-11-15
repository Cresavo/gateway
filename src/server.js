import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { mcpResponse } from "./mcp.js";
import { nativeMcpSchema } from "./mcp-inputs.js";
import { uspProfile, llmsText } from "./discovery.js";
import { allowedRoute, connectProvider, errorReply } from "./provider.js";

export function gateway(salon, serviceToken) {
  const provider = connectProvider(salon, serviceToken);
  return createServer(async (req, res) => {
    async function send(response) {
      const bytes = Buffer.from(await response.arrayBuffer());
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(bytes);
    }
    try {
      const origin = "http://127.0.0.1:" + req.socket.localPort;
      // Bind to loopback and reject browser cross-origin or DNS-rebinding requests.
      if (req.headers.host !== new URL(origin).host || (req.headers.origin && req.headers.origin !== origin))
        return await send(errorReply(403, "forbidden_origin", "Origin refused."));
      if (!req.url.startsWith("/") || req.url.startsWith("//") || /[\\#]/.test(req.url))
        return await send(errorReply(400, "invalid_request", "Invalid request target."));
      const url = new URL(req.url, origin);
      if (req.method === "GET" && url.pathname === "/.well-known/usp")
        return await send(Response.json(uspProfile(origin)));
      if (req.method === "GET" && url.pathname === "/llms.txt")
        return await send(new Response(llmsText(origin), { headers: { "content-type": "text/plain; charset=utf-8" } }));
      if (req.method === "GET" && url.pathname === "/api/v1/openapi") {
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3218);
  const salon = process.env.SALON_ORIGIN;
  if (!salon || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Set SALON_ORIGIN and a valid PORT");
  gateway(salon, process.env.GATEWAY_SERVICE_TOKEN).listen(port, "127.0.0.1", () => console.log("GATEWAY_READY " + port));
}
