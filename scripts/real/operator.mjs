// SPDX-License-Identifier: AGPL-3.0-only
// Loaded from the disposable salon checkout by the test coordinator only.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, realpath, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { db } from "./src/lib/db.ts";
import { createBooking } from "./src/lib/domain.ts";
import { createAgentApiKey } from "./src/lib/agent-api/keys.ts";
import { checkSalonCalendar } from "./scripts/agentprov/salon-calendar.mts";
import { assertTestDatabase } from "./scripts/test-db-guard.mjs";

// The synthetic customer proves this address with the one-time code on the consent page.
const customer = { name: "Syntetisk Kodkund", email: "gateway-customer@example.test" };

export async function start({ serviceToken, salonPort, gatewayOrigin }) {
  assertTestDatabase();
  const salon = "http://127.0.0.1:" + salonPort;
  const inbox = await mkdtemp(join(await realpath(tmpdir()), "booking-consent-inbox-"));
  const agent = await createAgentApiKey({ businessId: "demo", agentName: "Fictional assistant",
    ownerName: "Demo operator", ownerContact: "operator@example.test" }, db);
  const child = spawn(process.execPath, ["scripts/server.mjs"], { stdio: ["ignore", "pipe", "ignore"],
    env: { PATH: process.env.PATH, TMPDIR: tmpdir(), DATABASE_URL: process.env.DATABASE_URL, SESSION_SECRET: process.env.SESSION_SECRET,
      PORT: String(salonPort), GATEWAY_SERVICE_TOKEN: serviceToken, BOOKING_RUNTIME: "local",
      BOOKING_SERVICE_ROLE: "salon", BOOKING_PUBLIC_ORIGIN: salon, BOOKING_CONSENT_LAB: "1",
      BOOKING_CONSENT_INBOX_DIR: inbox,
      RATE_LIMIT_STORE: "postgres", NEXT_TELEMETRY_DISABLED: "1" } });
  const exited = new Promise(resolve => child.once("exit", resolve));
  let browser;
  async function close() {
    await browser?.close();
    child.kill();
    await exited;
    await db.$disconnect();
    await rm(inbox, { recursive: true, force: true });
  }
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Salon readiness timed out")), 60000);
      child.stdout.on("data", chunk => {
        if (String(chunk).includes("BOOKING_SERVER_READY")) { clearTimeout(timeout); resolve(); }
      });
      child.once("exit", () => { clearTimeout(timeout); reject(new Error("Salon exited")); });
      child.once("error", reject);
    });
    browser = await chromium.launch();
  } catch (error) { await close(); throw error; }

  // The customer opens the consent link (it carries no secret), types their own address and
  // approves with the code from their inbox: the operator's private directory.
  async function approve(proposal, expired = false) {
    const url = new URL("/consent/" + proposal.id, salon);
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    try {
      const viewResponse = page.waitForResponse(r => r.url() === salon + url.pathname + "/decision" && r.request().method() === "POST");
      await page.goto(url.href);
      const response = await viewResponse;
      if (expired) {
        assert.equal(response.status(), 403);
        // The UI discards unsuccessful response bodies. Verify the wire body independently.
        const denied = await page.request.post(salon + url.pathname + "/decision", {
          headers: { origin: salon }, data: { decision: "view" }, maxRedirects: 0, timeout: 10000,
        });
        assert.equal(denied.status(), 403);
        assert.deepEqual(await denied.json(), { error: "consent_denied" });
        await page.getByText("Länken är ogiltig, använd eller utgången.", { exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Ja, godkänn denna bokning" }).count(), 0);
        return;
      }
      assert.equal(response.status(), 200);
      await page.getByLabel("Din e-postadress").fill(customer.email);
      await page.getByRole("button", { name: "Skicka kod", exact: true }).click();
      await page.getByLabel("Sexsiffrig engångskod").waitFor();
      const path = join(inbox, proposal.id + ".json");
      const receipt = JSON.parse(await readFile(path, "utf8"));
      await unlink(path);
      assert.ok(receipt.proposalId === proposal.id && /^[0-9]{6}$/.test(receipt.code));
      await page.getByLabel("Sexsiffrig engångskod").fill(receipt.code);
      await page.getByRole("button", { name: "Ja, godkänn denna bokning", exact: true }).click();
      await page.getByText("Godkänt. Agenten kan nu slutföra exakt denna bokning.", { exact: false }).waitFor();
    } finally { await page.close(); }
  }
  async function owner(action, input = {}) {
    const clientId = agent.record.clientId;
    switch (action) {
      case "calendar":
        await checkSalonCalendar(salon, new URL(gatewayOrigin), input.bookingId, input.start, agent.key);
        return { bookings: await db.booking.findMany({ where: { businessId: "demo", id: input.bookingId }, select: { id: true } }) };
      case "expireProposal":
        await db.agentProposal.update({ where: { id: input.proposalId, clientId }, data: { expiresAt: new Date(Date.now() - 1000) } });
        return;
      case "expire":
        await db.agentMandate.update({ where: { id: input.mandateId, clientId }, data: { expiresAt: new Date(Date.now() - 1000) } });
        return;
      case "price":
        await db.service.update({ where: { id: input.serviceId, businessId: "demo" }, data: { priceOre: input.amountMinor } });
        return;
      case "occupy":
        await createBooking({ serviceId: input.serviceId, staffId: input.staffId, start: input.start,
          customerName: "Demo visitor", customerEmail: "visitor@example.test" });
        return;
      case "stats":
        return { stats: { proposalsCreated: await db.agentProposal.count({ where: { clientId } }),
          bookingsCreated: await db.agentBooking.count({ where: { clientId } }) } };
      default: throw new Error("Unknown test action");
    }
  }
  return { salon, agentKey: agent.key, customer, owner, approve, close };
}
