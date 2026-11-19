#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// End-to-end run: real MCP SDK client -> gateway process (src/server.js) -> split-mode provider.
// The provider adapter owns customer approval and salon-side test controls.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { start as startFixture } from "../test/e2e/fixture-provider.js";

const serviceToken = randomBytes(32).toString("hex");
const customer = { name: "Separat Demokund", email: "separate-customer@example.test" };
const future = new Date(Date.now() + 3 * 86400000);
while ([0, 6].includes(future.getUTCDay())) future.setUTCDate(future.getUTCDate() + 1);
const day = future.toISOString().slice(0, 10);

async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = /** @type {import("node:net").AddressInfo} */ (server.address()).port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

const log = (step, detail = "") => console.log(`[e2e] ${step}${detail ? " - " + detail : ""}`);
// Report only a local source location, even if a browser error contains a bearer link.
function location(error) {
  return String(error?.stack).match(/(?:e2e\.js|gateway-test-operator\.mjs|salon-calendar\.mts):\d+:\d+/)?.[0] ?? "provider setup";
}
let failures = 0;
async function scenario(name, fn) {
  try { await fn(); log("PASS", name); } catch (error) { failures++; log("FAIL", name + " (" + location(error) + ")"); }
}

async function run() {
  const real = process.argv.includes("--real");
  const startProvider = real ? (await import(pathToFileURL(process.env.E2E_OPERATOR).href)).start : startFixture;
  const port = await freePort();
  const gatewayOrigin = "http://127.0.0.1:" + port;
  const provider = await startProvider({ serviceToken, day, salonPort: await freePort(), gatewayOrigin });
  const { salon, agentKey, owner, approve } = provider;
  log("provider", real ? "Cresavo / PostgreSQL / separate synthetic customer channel" : "fictional separate-channel fixture");

  const child = spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))], {
    env: { PATH: process.env.PATH, PORT: String(port), SALON_ORIGIN: salon, GATEWAY_SERVICE_TOKEN: serviceToken },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const exited = new Promise(resolve => child.once("exit", resolve));
  const client = new Client({ name: "cresavo-gateway-e2e", version: "1.0.0" });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Gateway readiness timed out")), 15000);
      child.stdout.on("data", chunk => { if (String(chunk).includes("GATEWAY_READY")) { clearTimeout(timer); resolve(undefined); } });
      child.once("exit", () => { clearTimeout(timer); reject(new Error("Gateway exited")); });
      child.once("error", reject);
    });
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
      const { body } = await call("get_availability", { business: "demo", service: service.id, date: day, staff: service.staff[0].id });
      return body.slots.map(slot => slot.start);
    }
    async function propose(start, version = service.version) {
      const { isError, body } = await call("create_proposal", { business: "demo", serviceId: service.id,
        serviceVersion: version, staffId: service.staff[0].id, start });
      if (isError && ["invalid_request", "mandate_denied", "forbidden_scope", "stale_service",
        "service_not_found", "staff_not_found", "provider_unavailable"].includes(body.error?.code))
        log("proposal refused", body.error.code);
      assert.equal(isError, false);
      assert.deepEqual(Object.keys(body).sort(), ["approvalDelivery", "approvalRequired", "proposal"]);
      assert.equal(body.approvalRequired, true);
      assert.equal(body.approvalDelivery, "separate-synthetic-customer");
      assert.equal(body.proposal.status, "pending");
      assert.ok(!("mandateId" in body.proposal));
      return body.proposal;
    }
    const book = (start, mandateId, idempotencyKey = randomUUID()) => call("create_booking", {
      idempotencyKey, business: "demo", serviceId: service.id, serviceVersion: service.version,
      staffId: service.staff[0].id, start, customer, confirmed: true, mandateId,
    });

    await scenario("happy path: propose, customer approves, booking lands in the salon calendar with the exact ID", async () => {
      const [start] = await freeStarts();
      const proposal = await propose(start);
      log("  proposal", `${proposal.id} status=${proposal.status} price=${proposal.price.amountMinor} öre`);
      assert.equal((await owner("stats")).stats.bookingsCreated, 0);
      await approve(proposal);
      const approved = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
      assert.equal(approved.status, "approved");
      const key = randomUUID();
      const created = await book(start, approved.mandateId, key);
      assert.equal(created.isError, false);
      const bookingId = created.body.booking.id;
      log("  booking", `${bookingId} ${created.body.booking.start}`);
      const replay = await book(start, approved.mandateId, key);
      assert.equal(replay.body.replayed, true);
      assert.equal(replay.body.booking.id, bookingId, "idempotent retry returns the same booking");
      const status = await call("get_booking", { bookingId });
      assert.equal(status.body.booking.id, bookingId);
      const calendar = await owner("calendar", { bookingId, start });
      const matches = calendar.bookings.filter(b => b.id === bookingId);
      assert.equal(matches.length, 1, "exactly one calendar entry with the MCP-created booking ID");
      log("  calendar", `salon calendar contains ${bookingId}`);
    });

    await scenario("expired consent: an approved mandate past its expiry cannot book", async () => {
      const [start] = await freeStarts();
      const proposal = await propose(start);
      await approve(proposal);
      const { mandateId } = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
      assert.ok(mandateId);
      await owner("expire", { mandateId });
      const result = await book(start, mandateId);
      assert.equal(result.isError, true);
      assert.equal(result.body.error.code, "mandate_denied");
    });

    await scenario("changed price: the mandate hash no longer matches and booking is refused", async () => {
      const [start] = await freeStarts();
      const proposal = await propose(start);
      await approve(proposal);
      const { mandateId } = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
      await owner("price", { serviceId: service.id, amountMinor: service.price.amountMinor - 5000 });
      const result = await book(start, mandateId);
      assert.equal(result.body.error.code, "mandate_denied");
      await owner("price", { serviceId: service.id, amountMinor: service.price.amountMinor });
    });

    await scenario("slot taken: another customer books the slot after approval", async () => {
      const [start] = await freeStarts();
      const proposal = await propose(start);
      await approve(proposal);
      const { mandateId } = (await call("get_proposal", { proposalId: proposal.id })).body.proposal;
      await owner("occupy", { serviceId: service.id, staffId: service.staff[0].id, start });
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

  } finally {
    await client.close().catch(() => {});
    child.kill();
    await exited;
    await provider.close();
  }
  log(failures ? "RESULT FAILED" : "RESULT PASSED", `${failures} failing scenario(s)`);
  process.exitCode = failures ? 1 : 0;
}

// Assertion details, SDK errors and browser URLs may contain credentials.
run().catch(error => { log("FAIL", "test setup or teardown (" + location(error) + ")"); process.exitCode = 1; });
