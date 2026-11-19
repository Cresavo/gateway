// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { gateway } from "../src/server.js";
import { clientAddress, loadConfig } from "../src/config.js";
import { classify } from "../src/limits.js";

const serviceToken = randomBytes(32).toString("hex");
const salon = "https://salon.example.test";

async function listen(t, server) {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return "http://127.0.0.1:" + server.address().port;
}

test("configuration defaults to loopback and refuses partial remote setups", () => {
  assert.deepEqual(loadConfig({ SALON_ORIGIN: "http://127.0.0.1:3217" }).host, "127.0.0.1");
  const refused = [
    { SALON_ORIGIN: salon, GATEWAY_LISTEN_HOST: "0.0.0.0" },
    { SALON_ORIGIN: salon, GATEWAY_PUBLIC_ORIGIN: "https://gw.example.test" },
    { SALON_ORIGIN: salon, GATEWAY_ALLOW_REMOTE: "1", GATEWAY_LISTEN_HOST: "0.0.0.0", GATEWAY_TRUST_PROXY_HOPS: "1" },
    { SALON_ORIGIN: salon, GATEWAY_ALLOW_REMOTE: "1", GATEWAY_PUBLIC_ORIGIN: "http://gw.example.test", GATEWAY_TRUST_PROXY_HOPS: "1" },
    { SALON_ORIGIN: salon, GATEWAY_ALLOW_REMOTE: "1", GATEWAY_PUBLIC_ORIGIN: "https://gw.example.test" },
    { SALON_ORIGIN: "http://127.0.0.1:3217", GATEWAY_ALLOW_REMOTE: "1", GATEWAY_PUBLIC_ORIGIN: "https://gw.example.test", GATEWAY_TRUST_PROXY_HOPS: "1" },
    { SALON_ORIGIN: salon, GATEWAY_ALLOW_REMOTE: "yes" },
    { SALON_ORIGIN: salon, GATEWAY_ALLOW_REMOTE: "1", GATEWAY_LISTEN_HOST: "10.0.0.5", GATEWAY_PUBLIC_ORIGIN: "https://gw.example.test", GATEWAY_TRUST_PROXY_HOPS: "1" },
  ];
  for (const env of refused) assert.throws(() => loadConfig(env), undefined, JSON.stringify(env));
  const remote = loadConfig({ SALON_ORIGIN: salon, GATEWAY_ALLOW_REMOTE: "1", GATEWAY_LISTEN_HOST: "0.0.0.0",
    GATEWAY_PUBLIC_ORIGIN: "https://gw.example.test", GATEWAY_TRUST_PROXY_HOPS: "1" });
  assert.equal(remote.options.publicOrigin, "https://gw.example.test");
  assert.equal(remote.host, "0.0.0.0");
});

test("only the trusted proxy's X-Forwarded-For entry identifies the client", () => {
  const req = (xff) => ({ socket: { remoteAddress: "10.0.0.1" }, headers: xff ? { "x-forwarded-for": xff } : {} });
  assert.equal(clientAddress(req("203.0.113.9"), 0), "10.0.0.1");
  assert.equal(clientAddress(req("198.51.100.1, 203.0.113.9"), 1), "203.0.113.9");
  assert.equal(clientAddress(req(undefined), 1), "10.0.0.1");
});

test("create buckets are recognised for REST and MCP tool calls, including aliases", () => {
  const rpc = name => Buffer.from(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name } }));
  assert.deepEqual(classify("POST", "/api/v1/bookings"), ["read", "booking_create"]);
  assert.deepEqual(classify("POST", "/api/v1/proposals"), ["read", "proposal_create"]);
  assert.deepEqual(classify("POST", "/api/v1/mcp", rpc("usp_bookings_create")), ["read", "booking_create"]);
  assert.deepEqual(classify("POST", "/api/v1/mcp", rpc("create_proposal")), ["read", "proposal_create"]);
  assert.deepEqual(classify("POST", "/api/v1/mcp", rpc("list_services")), ["read"]);
});

test("limits answer 429 with Retry-After before the salon is contacted", async t => {
  let hits = 0;
  const provider = await listen(t, createServer((req, res) => {
    hits++;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ apiVersion: "v1", providerMode: "split", scopes: ["bookings:write"] }));
  }));
  let time = 0;
  const limits = { read: { limit: 2, windowMs: 60_000 }, proposal_create: { limit: 1, windowMs: 3_600_000 },
    booking_create: { limit: 1, windowMs: 3_600_000 } };
  const base = await listen(t, gateway(provider, serviceToken, { limits, now: () => time }));
  const book = () => fetch(base + "/api/v1/bookings", { method: "POST", headers: { authorization: "Bearer synthetic" }, body: "{}" });
  assert.equal((await book()).status, 200);
  const refused = await book();
  assert.equal(refused.status, 429);
  assert.equal(refused.headers.get("retry-after"), "3600");
  assert.equal((await refused.json()).error.code, "rate_limited");
  assert.equal(hits, 2, "refused create never reached the salon");
  assert.equal((await fetch(base + "/.well-known/usp")).status, 200);
  assert.equal((await fetch(base + "/.well-known/usp")).status, 429);
  time = 61_000;
  assert.equal((await fetch(base + "/.well-known/usp")).status, 200);
});

test("remote mode pins Host and Origin to the public origin and adds HSTS", async t => {
  const base = await listen(t, gateway("http://127.0.0.1:1", serviceToken,
    { publicOrigin: "https://gw.example.test", trustProxyHops: 1 }));
  assert.equal((await fetch(base + "/.well-known/usp")).status, 403);
  const { request } = await import("node:http");
  const get = (headers) => new Promise((resolve, reject) => {
    request(base + "/.well-known/usp", { headers }, res => {
      let data = ""; res.on("data", c => { data += c; }); res.on("end", () => resolve({ res, data }));
    }).on("error", reject).end();
  });
  const ok = await get({ host: "gw.example.test", "x-forwarded-for": "203.0.113.7" });
  assert.equal(ok.res.statusCode, 200);
  assert.match(ok.res.headers["strict-transport-security"], /max-age=/);
  assert.equal(JSON.parse(ok.data).usp.services["dev.usp-protocol.services"][1].endpoint, "https://gw.example.test/api/v1/mcp");
  assert.equal((await get({ host: "gw.example.test", origin: "https://evil.example.test" })).res.statusCode, 403);
});
