// SPDX-License-Identifier: AGPL-3.0-only
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { mcpInputs, uspAliases } from "./mcp-inputs.js";
import { errorReply } from "./provider.js";

const scopes = {
  list_services: ["services:read"], get_service: ["services:read"],
  get_availability: ["availability:read"], create_booking: ["bookings:write"],
  get_booking: ["bookings:read"], cancel_booking: ["bookings:write"],
  create_proposal: ["bookings:write"], get_proposal: ["bookings:read", "bookings:write"],
};
const descriptions = {
  list_services: "List the authorised salon's services, prices and staff.",
  get_service: "Read one service from the authorised catalog.",
  get_availability: "Find bookable starts for a service, date and optional staff.",
  create_booking: "Book after explicit confirmation under a server-issued mandate. Reuse the same idempotencyKey on retry. Synthetic contacts only.",
  get_booking: "Read an owned booking.", cancel_booking: "Cancel an owned booking.",
  create_proposal: "Prepare a synthetic booking for customer consent in supported labs.",
  get_proposal: "Read an owned booking proposal.",
};
const safeId = s => /^[\w-]{1,128}$/.test(s);

async function operation(name, args, call) {
  if (name === "list_services" || name === "get_service" || name === "get_availability") {
    const { service, ...rest } = args;
    const availability = name === "get_availability";
    const query = new URLSearchParams(availability ? args : rest);
    const result = await call("GET", availability ? "/api/v1/availability" : "/api/v1/services", query.toString());
    if (name !== "get_service" || !result.ok) return result;
    const catalog = await result.json();
    const row = catalog.services.find(s => s.id === service);
    return row ? Response.json({ apiVersion: catalog.apiVersion, business: catalog.business, service: row })
      : errorReply(404, "service_not_found", "Service not found.");
  }
  if (name === "create_booking") {
    const { idempotencyKey, ...body } = args;
    return call("POST", "/api/v1/bookings", "", JSON.stringify(body), idempotencyKey);
  }
  if (name === "create_proposal") return call("POST", "/api/v1/proposals", "", JSON.stringify(args));
  const id = args.bookingId ?? args.proposalId;
  if (!safeId(id)) return errorReply(400, "invalid_request", "Invalid identifier.");
  if (name === "get_proposal") return call("GET", "/api/v1/proposals/" + id);
  const path = "/api/v1/bookings/" + id;
  return name === "cancel_booking" ? call("POST", path + "/cancel") : call("GET", path);
}

export async function mcpResponse(request, call) {
  const auth = await call("GET", "/api/v1/access");
  if (!auth.ok) return auth;
  const access = await auth.json();
  if (access.apiVersion !== "v1" || !Array.isArray(access.scopes))
    return errorReply(502, "provider_invalid_response", "Invalid salon authorisation response.");
  if (request.method === "POST") {
    let rpc;
    try { rpc = await request.clone().json(); } catch { return errorReply(400, "invalid_request", "Invalid JSON."); }
    const name = rpc?.method === "tools/call" ? rpc.params?.name : undefined;
    if (typeof name === "string") {
      const canonical = Object.hasOwn(uspAliases, name) ? uspAliases[name] : name;
      if (Object.hasOwn(scopes, canonical) && !scopes[canonical].some(s => access.scopes.includes(s)))
        return errorReply(403, "forbidden_scope", "Insufficient scope.");
    }
  }
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "booking-lab-gateway", version: "0.1.0" });
    const tools = Object.keys(mcpInputs).filter(key => key !== "get_service").map(key => [key, key]);
    for (const [alias, name] of [...tools, ...Object.entries(uspAliases)]) {
      server.registerTool(alias, { description: descriptions[name], inputSchema: mcpInputs[name] },
        async args => {
          const response = await operation(name, args, call);
          const body = await response.json();
          const content = [{ type: /** @type {const} */ ("text"), text: JSON.stringify(body) }];
          return response.ok ? { content, structuredContent: body } : { isError: true, content };
        });
    }
    return server;
  }, { responseMode: "json", maxRequestBodySize: 65536 });
  try { return await handler.fetch(request); } finally { await handler.close(); }
}
