// SPDX-License-Identifier: AGPL-3.0-only
// Single-client, in-memory double of the native provider's separate-lab profile.
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { z } from "zod";
import { proposalSchema } from "../../src/mcp-inputs.js";

const business = { id: "demo", name: "Salong Eko (synthetic demo)", timeZone: "Europe/Stockholm", locationId: "demo-location" };
const staff = { id: "staff-demo", name: "Anna" };
const place = { locationId: business.locationId, scheduleId: "staff-schedule:" + staff.id };
const customer = { name: "Separat Demokund", email: "separate-customer@example.test" };
const scopes = ["services:read", "availability:read", "bookings:read", "bookings:write"];
const bookingSchema = proposalSchema.extend({
  confirmed: z.boolean(), mandateId: z.string().trim().min(1).max(128).optional(),
  customer: z.object({ name: z.string().trim().min(2).max(80), email: z.email().max(254) }).strict(),
});
const errors = {
  unauthorized: [401, "A valid API key is required."],
  invalid_request: [400, "Check the request parameters."],
  range_too_large: [400, "The date range may cover at most 14 days."],
  forbidden_business: [403, "This API key is not authorised for that business."],
  service_not_found: [404, "Service not found."],
  staff_not_found: [404, "Staff member not found for this service."],
  stale_service: [409, "The service has changed. Fetch services again and resend serviceVersion."],
  booking_not_found: [404, "Booking not found."],
  slot_unavailable: [409, "That time is no longer available. Fetch availability again."],
  mandate_denied: [403, "The booking is outside the authorised mandate."],
  mandate_required: [400, "A server-issued synthetic booking mandate is required."],
  confirmation_required: [400, "Set confirmed: true only after the person has approved this exact booking."],
  idempotency_key_required: [400, "Send an Idempotency-Key header (1-64 characters A-Z a-z 0-9 _ -)."],
  idempotency_conflict: [409, "This Idempotency-Key was already used with different booking details."],
  synthetic_contact_required: [400, "The sandbox only accepts synthetic customer emails ending in @example.test."],
};
const json = (res, status, data) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(data));
};
async function read(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}
export async function start({ serviceToken, day }) {
  const clientId = randomUUID(), agentKey = "blk_" + randomBytes(6).toString("hex") + "_" + randomBytes(32).toString("base64url");
  const service = { id: "massage", name: "Massage", durationMinutes: 30, bufferMinutes: 0,
    price: { amountMinor: 45000, currency: "SEK" }, version: 1, staff: [staff] };
  const offset = new Intl.DateTimeFormat("en", { timeZone: business.timeZone, timeZoneName: "longOffset" })
    .formatToParts(new Date(day + "T12:00:00Z")).find(p => p.type === "timeZoneName").value.slice(3);
  const starts = [9, 10, 11, 13, 14, 15].map(h => day + "T" + String(h).padStart(2, "0") + ":00:00" + offset);
  const local = ms => new Date(ms + Number(offset.slice(0, 3)) * 3600000).toISOString().slice(0, 19) + offset;
  const proposals = new Map(), bookings = new Map(), mandates = new Map(), retries = new Map(), taken = new Set();
  const hash = p => createHash("sha256").update(JSON.stringify(["booking-proposal-v1", business.id, clientId,
    p.serviceId, p.staff.id, p.locationId, p.scheduleId, p.start, p.durationMinutes, p.price.amountMinor, "SEK"])).digest("hex");
  const snapshot = start => ({ serviceId: service.id, serviceVersion: service.version, serviceName: service.name, staff,
    ...place, salon: "Salong Eko (syntetisk demo)", start: new Date(start).toISOString(),
    durationMinutes: service.durationMinutes, price: { ...service.price } });
  const view = p => p.status === "pending" && Date.parse(p.expiresAt) <= Date.now() ? { ...p, status: "expired" } : p;
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://fixture.invalid");
    const path = url.pathname;
    const ok = (body, status = 200) => json(res, status, body);
    const fail = code => {
      const [status, message] = errors[code];
      json(res, status, { apiVersion: "v1", error: { code, message } });
    };
    const consent = path.match(/^\/consent\/([\w-]+)\/decision$/);
    try {
      if (consent) {
        const entry = proposals.get(consent[1]);
        const input = await read(req);
        const deny = () => ok({ error: "consent_denied" }, 403);
        if (req.method !== "POST" || req.headers.origin !== salon || req.headers.authorization || req.headers["x-api-key"] ||
          !req.headers["content-type"]?.startsWith("application/json") || !entry || input.token !== entry.token ||
          view(entry.proposal).status !== "pending") return deny();
        const p = entry.proposal;
        if (input.decision === "view") return ok({ proposal: p, proposalHash: hash(p), customer: customer.name + " · " + customer.email });
        if (input.proposalHash !== hash(p) || !["yes", "no"].includes(input.decision)) return deny();
        p.status = input.decision === "yes" ? "approved" : "declined";
        if (p.status === "approved") {
          p.mandateId = randomUUID();
          mandates.set(p.mandateId, { hash: hash(p), expiresAt: Date.parse(p.expiresAt), used: false });
        }
        return ok({ status: p.status });
      }
      res.setHeader("x-booking-lab-api", "v1");
      const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      const key = req.headers["x-api-key"];
      if (req.headers["x-booking-gateway-token"] !== serviceToken || (bearer ?? key) !== agentKey || (key && key !== agentKey))
        return fail("unauthorized");
      if (req.method === "GET") {
        if (path === "/api/v1/access") return ok({ apiVersion: "v1", providerMode: "split", scopes });
        if (path.startsWith("/api/v1/proposals/")) {
          const entry = proposals.get(path.split("/").pop());
          return entry ? ok({ proposal: view(entry.proposal) }) : fail("booking_not_found");
        }
        if (path.startsWith("/api/v1/bookings/")) {
          const booking = bookings.get(path.split("/").pop());
          return booking ? ok({ apiVersion: "v1", booking }) : fail("booking_not_found");
        }
        if (!url.searchParams.get("business")) return fail("invalid_request");
        if (url.searchParams.get("business") !== business.id) return fail("forbidden_business");
        if (path === "/api/v1/services") return ok({ apiVersion: "v1", business, services: [service] });
        if (path !== "/api/v1/availability") return fail("invalid_request");
        if (!url.searchParams.get("service")) return fail("invalid_request");
        if (url.searchParams.get("service") !== service.id) return fail("service_not_found");
        if (url.searchParams.get("staff") && url.searchParams.get("staff") !== staff.id) return fail("staff_not_found");
        const date = url.searchParams.get("date"), from = url.searchParams.get("from"), to = url.searchParams.get("to");
        const first = date ?? from, last = date ?? to ?? from;
        const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
          new Date(value).toISOString().startsWith(value);
        if ((date && (from || to)) || !validDay(first) || !validDay(last) || last < first) return fail("invalid_request");
        if (Date.parse(last) - Date.parse(first) >= 14 * 86400000) return fail("range_too_large");
        const slots = starts.filter(s => first <= day && day <= last && !taken.has(Date.parse(s))).map(start => ({ start,
          end: local(Date.parse(start) + service.durationMinutes * 60000), durationMinutes: service.durationMinutes,
          serviceId: service.id, serviceVersion: service.version, staff, ...place }));
        return ok({ apiVersion: "v1", business, service, range: { from: first, to: last, timeZone: business.timeZone }, slots });
      }
      const proposal = path === "/api/v1/proposals";
      if (req.method !== "POST" || (!proposal && path !== "/api/v1/bookings")) return fail("invalid_request");
      const data = (proposal ? proposalSchema : bookingSchema).safeParse(await read(req));
      if (!data.success) return fail("invalid_request");
      const p = data.data;
      if (p.business !== business.id) return fail("forbidden_business");
      if (p.serviceId !== service.id) return fail("service_not_found");
      if (p.serviceVersion !== service.version) return fail("stale_service");
      if (p.staffId !== staff.id) return fail("staff_not_found");
      const at = Date.parse(p.start), terms = snapshot(p.start);
      if (proposal) {
        if (at <= Date.now()) return fail("invalid_request");
        const id = randomUUID();
        const row = { id, status: "pending", ...terms, expiresAt: new Date(Math.min(at, Date.now() + 600000)).toISOString() };
        proposals.set(id, { token: randomBytes(32).toString("base64url"), proposal: row });
        return ok({ proposal: row, approvalRequired: true, approvalDelivery: "separate-synthetic-customer" }, 201);
      }
      // The booking route parsed bookingSchema above.
      const b = /** @type {z.infer<typeof bookingSchema>} */ (p);
      const idempotencyKey = req.headers["idempotency-key"];
      if (typeof idempotencyKey !== "string" || !/^[\w-]{1,64}$/.test(idempotencyKey)) return fail("idempotency_key_required");
      if (!b.confirmed) return fail("confirmation_required");
      if (!b.customer.email.toLowerCase().endsWith("@example.test")) return fail("synthetic_contact_required");
      if (!b.mandateId) return fail("mandate_required");
      const previous = retries.get(idempotencyKey);
      if (previous) return previous.request === JSON.stringify(b) ? ok({ apiVersion: "v1", booking: previous.booking, replayed: true }) : fail("idempotency_conflict");
      const m = mandates.get(b.mandateId);
      if (!m || m.used || m.hash !== hash(terms) || m.expiresAt <= Date.now() ||
          b.customer.name !== customer.name || b.customer.email !== customer.email) return fail("mandate_denied");
      if (taken.has(at) || !starts.some(s => Date.parse(s) === at)) return fail("slot_unavailable");
      const booking = { id: randomUUID(), status: "confirmed", start: local(at), end: local(at + service.durationMinutes * 60000),
        durationMinutes: service.durationMinutes, serviceId: service.id, serviceName: service.name, staff, ...place, version: 1,
        createdAt: local(Date.now()) };
      bookings.set(booking.id, booking);
      retries.set(idempotencyKey, { request: JSON.stringify(b), booking });
      m.used = true;
      taken.add(at);
      return ok({ apiVersion: "v1", booking, replayed: false }, 201);
    } catch { return consent ? ok({ error: "consent_denied" }, 403) : fail("invalid_request"); }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const salon = "http://127.0.0.1:" + /** @type {import("node:net").AddressInfo} */ (server.address()).port;
  async function approve(p, expired = false) {
    const decision = body => fetch(salon + "/consent/" + p.id + "/decision", { method: "POST", redirect: "error",
      headers: { origin: salon, "content-type": "application/json" }, body: JSON.stringify(body) });
    const { token } = proposals.get(p.id);
    const viewed = await decision({ token, decision: "view" });
    if (expired) {
      assert.equal(viewed.status, 403);
      assert.deepEqual(await viewed.json(), { error: "consent_denied" });
      return;
    }
    assert.equal(viewed.status, 200);
    const { proposalHash } = await viewed.json();
    const approved = await decision({ token, decision: "yes", proposalHash });
    assert.equal(approved.status, 200);
    assert.equal((await approved.json()).status, "approved");
  }
  async function owner(action, input = {}) {
    switch (action) {
      case "stats": return { stats: { proposalsCreated: proposals.size, bookingsCreated: bookings.size } };
      case "calendar": return { bookings: [...bookings.values()] };
      case "occupy": taken.add(Date.parse(input.start)); return;
      case "expireProposal": proposals.get(input.proposalId).proposal.expiresAt = new Date(Date.now() - 1000).toISOString(); return;
      case "expire": mandates.get(input.mandateId).expiresAt = Date.now() - 1000; return;
      case "price": service.price.amountMinor = input.amountMinor; return;
      default: throw new Error("Unknown test action");
    }
  }
  return { salon, agentKey, approve, owner, close: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
