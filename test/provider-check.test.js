// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { checkProvider } from "../scripts/provider-check.js";
import { start } from "./e2e/fixture-provider.js";

const serviceToken = randomBytes(32).toString("hex");
const future = new Date(Date.now() + 3 * 86400000);
while ([0, 6].includes(future.getUTCDay())) future.setUTCDate(future.getUTCDate() + 1);

test("the reference fixture passes every conformance check, including --write", async t => {
  const provider = await start({ serviceToken, day: future.toISOString().slice(0, 10) });
  t.after(() => provider.close());
  const results = await checkProvider({ origin: provider.salon, serviceToken, agentKey: provider.agentKey, business: "demo", write: true });
  const failed = results.filter(r => r.status === "fail");
  assert.deepEqual(failed, []);
  for (const id of ["access_confirms_split_mode", "services_catalog", "availability_slots", "booking_requires_customer_mandate",
    "proposal_created_pending", "approval_link_stays_with_customer"])
    assert.equal(results.find(r => r.id === id)?.status, "pass", id);
  assert.equal((await provider.owner("stats")).stats.bookingsCreated, 0, "the check never books");
  const printed = JSON.stringify(results);
  assert.ok(!printed.includes(serviceToken) && !printed.includes(provider.agentKey), "credentials never appear in results");
});

test("a provider that skips the service token and split confirmation fails with actionable messages", async t => {
  const server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(req.url === "/api/v1/access" ? { apiVersion: "v1", scopes: [] } : { ok: true }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const origin = "http://127.0.0.1:" + /** @type {import("node:net").AddressInfo} */ (server.address()).port;
  const results = await checkProvider({ origin, serviceToken, agentKey: "agent-key", business: "demo" });
  const status = id => results.find(r => r.id === id)?.status;
  assert.equal(status("access_requires_gateway_identity"), "fail");
  assert.equal(status("operations_require_gateway_identity"), "fail");
  assert.equal(status("access_confirms_split_mode"), "fail");
  assert.match(results.find(r => r.id === "access_confirms_split_mode").detail, /providerMode:"split"/);
});

test("the check refuses plain HTTP to anything but loopback", async () => {
  await assert.rejects(checkProvider({ origin: "http://booking.example.test", serviceToken, agentKey: "k", business: "demo" }));
});
