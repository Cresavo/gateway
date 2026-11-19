#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// End-to-end run: real MCP SDK client -> gateway process (src/server.js) -> split-mode provider.
// Uses the fictional fixture provider in test/e2e/fixture-provider.js. All credentials
// are generated per run, held in memory and never printed.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { fixtureProvider } from "../test/e2e/fixture-provider.js";

const serviceToken = randomBytes(32).toString("hex");
const agentKey = "blk_e2e_" + randomBytes(24).toString("hex");
const ownerToken = randomBytes(24).toString("hex");
const customer = { name: "Tova Testsson (fictional)", email: "tova@example.test" };
const customerPhone = "+46701740605"; // Swedish number range reserved for fiction.

const log = (step, detail = "") => console.log(`[e2e] ${step}${detail ? " - " + detail : ""}`);
let failures = 0;
async function scenario(name, fn) {
  try { await fn(); log("PASS", name); } catch (error) { failures++; log("FAIL", `${name}: ${error.message}`); }
}

const { server: salonServer } = fixtureProvider({ serviceToken, agentKey, ownerToken });
salonServer.listen(0, "127.0.0.1");
await once(salonServer, "listening");
const salon = "http://127.0.0.1:" + /** @type {import("node:net").AddressInfo} */ (salonServer.address()).port;
log("provider", `fictional split-mode fixture on ${salon}`);

const port = String(20000 + Math.floor(Math.random() * 20000));
const child = spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))], {
  env: { PATH: process.env.PATH, PORT: port, SALON_ORIGIN: salon, GATEWAY_SERVICE_TOKEN: serviceToken },
  stdio: ["ignore", "pipe", "pipe"],
});
// The MCP server SDK warns once per request in JSON response mode; show everything else.
child.stderr.on("data", chunk => {
  const lines = String(chunk).split("\n").filter(line => line && !line.includes("drops mid-call notifications"));
  if (lines.length) process.stderr.write(lines.join("\n") + "\n");
});
const gatewayOrigin = await new Promise((resolve, reject) => {
  child.once("exit", code => reject(new Error("gateway exited " + code)));
  child.stdout.on("data", chunk => { if (String(chunk).includes("GATEWAY_READY")) resolve("http://127.0.0.1:" + port); });
});
log("gateway", `${gatewayOrigin} (separate Node process, loopback)`);

const owner = async (path, body) => {
  const response = await fetch(salon + "/__fixture/" + path, {
    method: body ? "POST" : "GET", headers: { "x-fixture-owner": ownerToken, "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response.json();
};
// The customer's side: read the simulated SMS and approve on the consent page.
async function approve(proposal) {
  const { code } = await owner("sms/" + proposal.id);
  const response = await fetch(proposal.consentUrl, { method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code }) });
  return { status: response.status, body: await response.json() };
}

const client = new Client({ name: "cresavo-gateway-e2e", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(gatewayOrigin + "/api/v1/mcp"),
  { requestInit: { headers: { authorization: "Bearer " + agentKey } } }));
const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  return { isError: Boolean(result.isError), body: result.structuredContent ?? JSON.parse(/** @type {{ text: string }} */ (result.content[0]).text) };
};
const tools = (await client.listTools()).tools.map(t => t.name);
log("mcp", `connected with SDK client; ${tools.length} tools: ${tools.join(", ")}`);

const catalog = (await call("list_services", { business: "demo" })).body;
const service = catalog.services[0];
async function freeStarts() {
  const { body } = await call("get_availability", { business: "demo", service: service.id, date: "2027-03-02" });
  return body.slots.map(slot => slot.start);
}
async function propose(start, version = service.version) {
  const { isError, body } = await call("create_proposal", { business: "demo", serviceId: service.id,
    serviceVersion: version, staffId: service.staff[0].id, start, customerPhone });
  assert.equal(isError, false, JSON.stringify(body));
  return body.proposal;
}
const book = (start, mandateId, idempotencyKey = randomUUID()) => call("create_booking", {
  idempotencyKey, business: "demo", serviceId: service.id, serviceVersion: service.version,
  staffId: service.staff[0].id, start, customer, confirmed: true, mandateId,
});

await scenario("happy path: propose, customer approves, booking lands in the salon calendar with the exact ID", async () => {
  const [start] = await freeStarts();
  const proposal = await propose(start);
  log("  proposal", `${proposal.id} status=${proposal.status} price=${proposal.terms.priceMinor} öre`);
  const consent = await approve(proposal);
  assert.equal(consent.status, 200);
  const approved = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
  assert.equal(approved.status, "approved");
  const key = randomUUID();
  const created = await book(start, approved.mandateId, key);
  assert.equal(created.isError, false, JSON.stringify(created.body));
  const bookingId = created.body.booking.id;
  log("  booking", `${bookingId} ${created.body.booking.start}`);
  const replay = await book(start, approved.mandateId, key);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.booking.id, bookingId, "idempotent retry returns the same booking");
  const status = await call("get_booking", { bookingId });
  assert.equal(status.body.booking.id, bookingId);
  const calendar = await owner("calendar");
  const matches = calendar.bookings.filter(b => b.id === bookingId);
  assert.equal(matches.length, 1, "exactly one calendar entry with the MCP-created booking ID");
  log("  calendar", `salon calendar contains ${bookingId}`);
});

await scenario("expired consent: an approved mandate past its expiry cannot book", async () => {
  const [start] = await freeStarts();
  const proposal = await propose(start);
  await approve(proposal);
  const { mandateId } = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
  await owner("clock", { advanceMs: 16 * 60_000 });
  const result = await book(start, mandateId);
  assert.equal(result.isError, true);
  assert.equal(result.body.error.code, "mandate_denied");
});

await scenario("changed price: the mandate hash no longer matches and booking is refused", async () => {
  const [start] = await freeStarts();
  const proposal = await propose(start);
  await approve(proposal);
  const { mandateId } = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
  await owner("price", { serviceId: service.id, amountMinor: service.price.amountMinor + 5000 });
  const result = await book(start, mandateId);
  assert.equal(result.body.error.code, "mandate_denied");
  await owner("price", { serviceId: service.id, amountMinor: service.price.amountMinor });
});

await scenario("slot taken: another customer books the slot after approval", async () => {
  const [start] = await freeStarts();
  const proposal = await propose(start);
  await approve(proposal);
  const { mandateId } = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
  await owner("occupy", { staffId: service.staff[0].id, start });
  const result = await book(start, mandateId);
  assert.equal(result.body.error.code, "slot_unavailable");
});

await scenario("rate limit hit: the sixth proposal in an hour gets 429 with Retry-After and never reaches the salon", async () => {
  const starts = await freeStarts();
  await propose(starts[0]); // fifth proposal from this IP in the window
  const before = (await owner("stats")).stats.proposalsCreated;
  const rpc = { jsonrpc: "2.0", id: 99, method: "tools/call", params: { name: "create_proposal", arguments: {
    business: "demo", serviceId: service.id, serviceVersion: service.version, staffId: service.staff[0].id, start: starts[1] } } };
  const response = await fetch(gatewayOrigin + "/api/v1/mcp", { method: "POST", body: JSON.stringify(rpc), headers: {
    authorization: "Bearer " + agentKey, "content-type": "application/json", accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2025-06-18" } });
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0, "Retry-After present");
  assert.equal((await response.json()).error.code, "rate_limited");
  await assert.rejects(client.callTool({ name: "create_proposal", arguments: rpc.params.arguments }), /429|rate|Too many/i);
  assert.equal((await owner("stats")).stats.proposalsCreated, before, "salon saw no extra proposal");
});

await client.close().catch(() => {});
child.kill();
salonServer.close();
salonServer.closeAllConnections();
log(failures ? "RESULT FAILED" : "RESULT PASSED", `${failures} failing scenario(s)`);
process.exitCode = failures ? 1 : 0;
