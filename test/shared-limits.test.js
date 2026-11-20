// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { gateway } from "../src/server.js";
import { loadConfig } from "../src/config.js";
import { sharedRateLimiter } from "../src/shared-limits.js";

const serviceToken = randomBytes(32).toString("hex");
// CI installs redis-server; locally the store tests skip without it.
const hasRedis = spawnSync("redis-server", ["--version"]).status === 0;
if (!hasRedis && process.env.CI) throw new Error("redis-server is required in CI");

async function listen(t, server) {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return "http://127.0.0.1:" + server.address().port;
}

async function startRedis(t) {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const child = spawn("redis-server", ["--port", String(port), "--bind", "127.0.0.1", "--save", "", "--appendonly", "no"],
    { stdio: ["ignore", "pipe", "ignore"] });
  t.after(() => { child.kill(); });
  await new Promise((resolve, reject) => {
    child.stdout.on("data", chunk => { if (String(chunk).includes("Ready to accept connections")) resolve(); });
    child.once("exit", () => reject(new Error("redis-server exited")));
  });
  return "redis://127.0.0.1:" + port;
}

function salon(t, counter) {
  return listen(t, createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    if (req.url === "/api/v1/access")
      return res.end(JSON.stringify({ apiVersion: "v1", providerMode: "split", scopes: ["bookings:write"] }));
    counter.creates++;
    res.end(JSON.stringify({ apiVersion: "v1", proposal: { id: "p" } }));
  }));
}

test("two gateway instances share one set of limits through Redis", { skip: !hasRedis && "redis-server not installed" }, async t => {
  const url = await startRedis(t);
  const counter = { creates: 0 };
  const provider = await salon(t, counter);
  const limits = { read: { limit: 100, windowMs: 60_000 }, proposal_create: { limit: 3, windowMs: 3_600_000 },
    booking_create: { limit: 3, windowMs: 3_600_000 } };
  const takes = [sharedRateLimiter(url, { limits }), sharedRateLimiter(url, { limits })];
  t.after(() => Promise.all(takes.map(take => take.close())));
  const [a, b] = await Promise.all(takes.map(take => listen(t, gateway(provider, serviceToken, { take }))));
  const propose = base => fetch(base + "/api/v1/proposals", { method: "POST",
    headers: { authorization: "Bearer synthetic", "content-type": "application/json" }, body: "{}" });
  await new Promise(resolve => setTimeout(resolve, 100)); // let both clients connect
  assert.equal((await propose(a)).status, 200);
  assert.equal((await propose(b)).status, 200);
  assert.equal((await propose(a)).status, 200);
  const refused = await propose(b);
  assert.equal(refused.status, 429, "the fourth create is refused on the other instance");
  assert.ok(Number(refused.headers.get("retry-after")) > 3500);
  assert.equal(counter.creates, 3, "the refused create never reached the salon");
});

test("concurrent creates across instances never exceed the limit", { skip: !hasRedis && "redis-server not installed" }, async t => {
  const url = await startRedis(t);
  const limits = { read: { limit: 1000, windowMs: 60_000 }, proposal_create: { limit: 5, windowMs: 3_600_000 },
    booking_create: { limit: 5, windowMs: 3_600_000 } };
  const takes = [sharedRateLimiter(url, { limits }), sharedRateLimiter(url, { limits }), sharedRateLimiter(url, { limits })];
  t.after(() => Promise.all(takes.map(take => take.close())));
  await new Promise(resolve => setTimeout(resolve, 100));
  const results = await Promise.all(Array.from({ length: 30 }, (_, i) => takes[i % 3]("203.0.113.9", ["read", "booking_create"])));
  assert.equal(results.filter(r => r.ok).length, 5);
  assert.ok(results.filter(r => !r.ok).every(r => r.retryAfter > 0));
  const other = await takes[0]("203.0.113.10", ["read", "booking_create"]);
  assert.equal(other.ok, true, "another client has its own window");
});

test("when the store is down, reads fall back to local limits and creates are refused", async t => {
  const take = sharedRateLimiter("redis://127.0.0.1:1");
  t.after(() => take.close());
  assert.equal((await take("203.0.113.9", ["read"])).ok, true);
  const create = await take("203.0.113.9", ["read", "proposal_create"]);
  assert.equal(create.ok, false);
  assert.equal(create.retryAfter, 30);
});

test("shared limits are required on Vercel and the store URL is validated without echoing it", () => {
  const remote = { SALON_ORIGIN: "https://salon.example.test", GATEWAY_ALLOW_REMOTE: "1", GATEWAY_LISTEN_HOST: "0.0.0.0",
    GATEWAY_PUBLIC_ORIGIN: "https://gateway.example.test", GATEWAY_TRUST_PROXY_HOPS: "1" };
  assert.throws(() => loadConfig({ ...remote, VERCEL: "1" }), /GATEWAY_RATE_LIMIT_REDIS_URL/);
  assert.throws(() => loadConfig({ ...remote, GATEWAY_REQUIRE_SHARED_LIMITS: "1" }), /GATEWAY_RATE_LIMIT_REDIS_URL/);
  const secret = "s3cr3t-value";
  for (const value of [`redis://user:${secret}@cache.example.test:6379`, `http://user:${secret}@cache.example.test`, "not a url"]) {
    assert.throws(() => loadConfig({ ...remote, GATEWAY_RATE_LIMIT_REDIS_URL: value }), error => !String(error.message).includes(secret));
  }
  const ok = loadConfig({ ...remote, VERCEL: "1", GATEWAY_RATE_LIMIT_REDIS_URL: `rediss://default:${secret}@cache.example.test:6379` });
  assert.ok(ok.options.rateLimitStoreUrl.startsWith("rediss://"));
  assert.equal(loadConfig({ SALON_ORIGIN: "http://127.0.0.1:3217", GATEWAY_RATE_LIMIT_REDIS_URL: "redis://127.0.0.1:6379" })
    .options.rateLimitStoreUrl, "redis://127.0.0.1:6379");
  assert.deepEqual(loadConfig({ SALON_ORIGIN: "http://127.0.0.1:3217" }).options, {});
});

