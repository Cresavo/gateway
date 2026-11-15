import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { gateway } from "../src/server.js";
import { providerOrigin } from "../src/provider.js";

const serviceToken = randomBytes(32).toString("hex");

async function listen(t, server) {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return "http://127.0.0.1:" + server.address().port;
}

test("gateway refuses to start without a valid service credential", () => {
  for (const token of [undefined, "", "a".repeat(63), "g".repeat(64)]) {
    assert.throws(() => gateway("http://127.0.0.1:3217", token), /GATEWAY_SERVICE_TOKEN/);
  }
});

test("operator pins the origin; cleartext remote, credentials, paths and queries are rejected", () => {
  for (const url of ["http://example.test", "https://x:p@example.test", "https://example.test/a", "https://example.test/?x=1"])
    assert.throws(() => providerOrigin(url));
  assert.equal(providerOrigin("http://127.0.0.1:3217"), "http://127.0.0.1:3217");
});

test("only booking operations cross the boundary; admin cookies and spoofed identity stay out", async t => {
  const seen = [];
  const salon = await listen(t, createServer((req, res) => {
    seen.push({ path: req.url, method: req.method, headers: req.headers });
    res.writeHead(409, { "content-type": "application/json", "set-cookie": "private=value" });
    res.end(JSON.stringify({ error: { code: "slot_unavailable" } }));
  }));
  const base = await listen(t, gateway(salon, serviceToken));
  for (const path of ["/admin", "/api/admin/login", "/api/v1/access", "//example.test"])
    assert.ok((await fetch(base + path)).status >= 400);
  assert.equal((await fetch(base + "/api/v1/mcp")).status, 401);
  const body = await fetch(base + "/api/v1/bookings", { method: "POST", headers: {
    authorization: "Bearer synthetic-test", "idempotency-key": "test-key", cookie: "admin=fixture",
    "x-forwarded-for": "1.2.3.4", "x-booking-gateway-token": "client-supplied" }, body: "{}" });
  assert.equal(body.status, 409);
  assert.equal((await body.json()).error.code, "slot_unavailable");
  assert.equal(body.headers.get("set-cookie"), null);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].headers["idempotency-key"], "test-key");
  assert.ok(seen[0].headers["x-booking-gateway-token"] === serviceToken);
  assert.equal(body.headers.get("x-booking-gateway-token"), null);
  assert.equal(seen[0].headers.cookie, undefined);
  assert.equal(seen[0].headers["x-forwarded-for"], undefined);
});

test("cross-origin browser requests and oversized writes never reach the salon", async t => {
  const base = await listen(t, gateway("http://127.0.0.1:1", serviceToken));
  assert.equal((await fetch(base + "/api/v1/services", { headers: { origin: "https://unknown.example" } })).status, 403);
  assert.equal((await fetch(base + "/api/v1/bookings", { method: "POST", body: "x".repeat(70000) })).status, 413);
});

test("a provider outage yields a controlled retryable error", async t => {
  const base = await listen(t, gateway("http://127.0.0.1:1", serviceToken));
  const result = await fetch(base + "/api/v1/bookings", { method: "POST",
    headers: { authorization: "Bearer dummy", "idempotency-key": "retry" }, body: "{}" });
  assert.equal(result.status, 503);
  assert.equal((await result.json()).error.code, "provider_unavailable");
});

test("never forward agent credentials through a provider redirect", async t => {
  let received = 0;
  const dest = await listen(t, createServer((_req, res) => { received++; res.end(); }));
  const salon = await listen(t, createServer((_req, res) => { res.writeHead(307, { location: dest }); res.end(); }));
  const base = await listen(t, gateway(salon, serviceToken));
  assert.equal((await fetch(base + "/api/v1/services", { headers: { authorization: "Bearer dummy" } })).status, 503);
  assert.equal(received, 0);
});

test("MCP discovery requires client access and a restricted client cannot invoke a write", async t => {
  const seen = [];
  const salon = await listen(t, createServer((req, res) => {
    seen.push(req.url);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ apiVersion: "v1", scopes: ["services:read"] }));
  }));
  const base = await listen(t, gateway(salon, serviceToken));
  assert.equal((await fetch(base + "/api/v1/mcp/schema")).status, 401);
  const headers = { authorization: "Bearer dummy", "content-type": "application/json" };
  assert.equal((await fetch(base + "/api/v1/mcp/schema", { headers })).status, 200);
  const rpc = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "usp_bookings_create", arguments: {} } };
  assert.equal((await fetch(base + "/api/v1/mcp", { method: "POST", headers, body: JSON.stringify(rpc) })).status, 403);
  assert.deepEqual(seen, ["/api/v1/access", "/api/v1/access"]);
});
