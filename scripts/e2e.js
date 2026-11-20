#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// End-to-end run: real MCP SDK client -> gateway process (src/server.js) -> split-mode provider.
// The provider adapter owns customer approval and salon-side test controls.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { start as startFixture } from "../test/e2e/fixture-provider.js";
import { providerOrigin } from "../src/provider.js";

// Defaults for the fixture and Cresavo's separate lab; an adapter may supply its own.
const defaultCustomer = { name: "Separat Demokund", email: "separate-customer@example.test" };
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
  const { values } = parseArgs({ options: { real: { type: "boolean" }, adapter: { type: "string" }, gateway: { type: "string" } } });
  const { real, gateway } = values;
  const hosted = gateway !== undefined;
  const adapterPath = values.adapter ?? (real ? process.env.E2E_OPERATOR : undefined);
  if (hosted && (!adapterPath || real)) throw new Error("--gateway requires --adapter and cannot be used with --real");
  const adapter = adapterPath ? await import(pathToFileURL(resolvePath(adapterPath)).href) : { start: startFixture };
  const port = hosted ? undefined : await freePort();
  const gatewayOrigin = hosted ? providerOrigin(gateway) : "http://127.0.0.1:" + port;
  const serviceToken = hosted ? undefined : randomBytes(32).toString("hex");
  const provider = hosted
    ? await adapter.startHosted({ day, gatewayOrigin })
    : await adapter.start({ serviceToken, day, salonPort: await freePort(), gatewayOrigin });
  const { salon, agentKey, owner, approve } = provider;
  const business = provider.business ?? "demo";
  const customer = provider.customer ?? defaultCustomer;
  log("provider", hosted ? "deployed gateway / ordinary agent" : real ? "Cresavo / PostgreSQL / separate synthetic customer channel" : adapterPath ? "provider adapter" : "fictional separate-channel fixture");

  const child = hosted ? undefined : spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))], {
    env: { PATH: process.env.PATH, PORT: String(port), SALON_ORIGIN: salon, GATEWAY_SERVICE_TOKEN: serviceToken },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const exited = child && new Promise(resolve => {
    child.once("close", resolve);
  });
  const client = new Client({ name: "cresavo-gateway-e2e", version: "1.0.0" });
  try {
    if (child) await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Gateway readiness timed out")), 15000);
      child.stdout.on("data", chunk => { if (String(chunk).includes("GATEWAY_READY")) { clearTimeout(timer); resolve(undefined); } });
      child.once("exit", () => { clearTimeout(timer); reject(new Error("Gateway exited")); });
      child.once("error", error => { clearTimeout(timer); reject(error); });
    });
    await client.connect(new StreamableHTTPClientTransport(new URL(gatewayOrigin + "/api/v1/mcp"),
      { requestInit: { redirect: "error", headers: { authorization: "Bearer " + agentKey } } }));
    const call = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      return { isError: Boolean(result.isError),
        body: result.structuredContent ?? JSON.parse(/** @type {{ text: string }} */ (result.content[0]).text),
        wire: JSON.stringify([result.structuredContent, result.content]) };
    };
    const tools = (await client.listTools()).tools.map(t => t.name);
    log("mcp", `connected with SDK client; ${tools.length} tools`);

    const catalog = (await call("list_services", { business })).body;
    const service = catalog.services[0];
    async function freeStarts() {
      const { body } = await call("get_availability", { business, service: service.id, date: day, staff: service.staff[0].id });
      return body.slots.map(slot => slot.start);
    }
    async function propose(start, version = service.version) {
      const { isError, body, wire } = await call("create_proposal", { business, serviceId: service.id,
        serviceVersion: version, staffId: service.staff[0].id, start });
      if (isError && ["invalid_request", "mandate_denied", "forbidden_scope", "stale_service",
        "service_not_found", "staff_not_found", "provider_unavailable"].includes(body.error?.code))
        log("proposal refused", body.error.code);
      assert.equal(isError, false);
      assert.equal(body.approvalRequired, true);
      // The provider delivers approval to the customer; the agent never holds a link or token.
      assertPrivateDelivery(wire);
      assert.equal(body.proposal.status, "pending");
      assert.ok(!("mandateId" in body.proposal));
      return body.proposal;
    }
    function assertPrivateDelivery(wire) {
      assert.ok(!/approvalUrl|\/consent\/|\/sandbox\/phone|token/i.test(wire), "no approval link reaches the agent");
    }
    async function readProposal(proposalId) {
      const response = await call("get_proposal", { proposalId });
      assert.equal(response.isError, false);
      assertPrivateDelivery(response.wire);
      return response.body.proposal;
    }
    const book = (start, mandateId, idempotencyKey = randomUUID()) => call("create_booking", {
      idempotencyKey, business, serviceId: service.id, serviceVersion: service.version,
      staffId: service.staff[0].id, start, customer, confirmed: true, mandateId,
    });

    await scenario("happy path: propose, customer approves, booking lands in the salon calendar with the exact ID", async () => {
      const [start] = await freeStarts();
      const proposal = await propose(start);
      const pending = await readProposal(proposal.id);
      assert.equal(pending.status, "pending");
      assert.ok(!("mandateId" in pending));
      if (hosted) {
        const refused = await book(start, undefined);
        assert.equal(refused.isError, true);
        assert.equal(refused.body.error.code, "mandate_required");
        assert.ok((await freeStarts()).includes(start), "a pending proposal does not hold the slot");
      } else {
        assert.equal((await owner("stats")).stats.bookingsCreated, 0);
      }
      await approve(proposal);
      const approved = await readProposal(proposal.id);
      assert.equal(approved.status, "approved");
      const key = randomUUID();
      const created = await book(start, approved.mandateId, key);
      assert.equal(created.isError, false);
      const bookingId = created.body.booking.id;
      const replay = await book(start, approved.mandateId, key);
      assert.equal(replay.body.replayed, true);
      assert.equal(replay.body.booking.id, bookingId, "idempotent retry returns the same booking");
      const status = await call("get_booking", { bookingId });
      assert.equal(status.body.booking.id, bookingId);
      const calendar = await (hosted ? provider.calendar({ bookingId, start }) : owner("calendar", { bookingId, start }));
      const matches = calendar.bookings.filter(b => b.id === bookingId);
      assert.equal(matches.length, 1, "exactly one calendar entry with the MCP-created booking ID");
    });

    if (hosted) {
      await scenario("ordinary agents cannot book with an unknown mandate or read an unknown booking", async () => {
        const [start] = await freeStarts();
        const refusal = await book(start, randomUUID());
        assert.equal(refusal.isError, true);
        assert.equal(refusal.body.error.code, "mandate_denied");
        const status = await call("get_booking", { bookingId: randomUUID() });
        assert.equal(status.isError, true);
        assert.equal(status.body.error.code, "booking_not_found");
      });
    } else {
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

      let lastProposal;
      await scenario("rate limit hit: the sixth proposal in an hour gets 429 with Retry-After and never reaches the salon", async () => {
        const starts = await freeStarts();
        lastProposal = await propose(starts[0]); // fifth proposal from this IP in the window
        const before = (await owner("stats")).stats.proposalsCreated;
        const rpc = { jsonrpc: "2.0", id: 99, method: "tools/call", params: { name: "create_proposal", arguments: {
          business, serviceId: service.id, serviceVersion: service.version, staffId: service.staff[0].id, start: starts[1] } } };
        const response = await fetch(gatewayOrigin + "/api/v1/mcp", { method: "POST", body: JSON.stringify(rpc), headers: {
          authorization: "Bearer " + agentKey, "content-type": "application/json", accept: "application/json, text/event-stream",
          "mcp-protocol-version": "2025-06-18" } });
        assert.equal(response.status, 429);
        assert.ok(Number(response.headers.get("retry-after")) > 0, "Retry-After present");
        assert.equal((await response.json()).error.code, "rate_limited");
        await assert.rejects(client.callTool({ name: "create_proposal", arguments: rpc.params.arguments }), /429|rate|Too many/i);
        assert.equal((await owner("stats")).stats.proposalsCreated, before, "salon saw no extra proposal");
      });

      await scenario("expired pending consent: customer is denied and no mandate is issued", async () => {
        await owner("expireProposal", { proposalId: lastProposal.id });
        await approve(lastProposal, true);
        const result = await call("get_proposal", { proposalId: lastProposal.id });
        assert.equal(result.isError, false);
        assert.equal(result.body.proposal.status, "expired");
        assert.ok(!("mandateId" in result.body.proposal));
        assert.equal((await owner("stats")).stats.bookingsCreated, 1);
      });
    }
  } finally {
    await client.close().catch(() => {});
    if (child) {
      child.kill();
      await exited;
    }
    await provider.close();
  }
  log(failures ? "RESULT FAILED" : "RESULT PASSED", `${failures} failing scenario(s)`);
  process.exitCode = failures ? 1 : 0;
}

// Assertion details, SDK errors and browser URLs may contain credentials.
await run().catch(error => { log("FAIL", "test setup or teardown (" + location(error) + ")"); process.exitCode = 1; });
