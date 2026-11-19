// SPDX-License-Identifier: AGPL-3.0-only
// A fictional, in-memory split-mode salon provider used only by the end-to-end
// harness. It models the agent flow described for the Cresavo provider
// (proposal -> consent page with a simulated SMS code -> mandate locked by a
// hash over service, staff, time, duration and price -> re-check at booking).
// It is NOT the Cresavo implementation and does not prove compatibility with it:
// the wire shapes of the proposal and consent steps are this fixture's
// assumptions. Run the same harness against a real Cresavo provider with
// E2E_SALON_ORIGIN (see docs/E2E.md) to verify the real contract.
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const BUSINESS = { id: "demo", name: "Salong Eko (fictional)", timeZone: "Europe/Stockholm", locationId: "demo-location" };
const STAFF = { id: "staff-alva", name: "Alva Exempel (fictional)" };
const DAY = "2027-03-02";
const STARTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"].map(t => `${DAY}T${t}:00+01:00`);
const PROPOSAL_TTL_MS = 10 * 60_000;
const MANDATE_TTL_MS = 15 * 60_000;

const id = () => randomBytes(16).toString("base64url");
const equal = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function fixtureProvider({ serviceToken, agentKey, ownerToken }) {
  let clock = Date.parse("2027-03-01T12:00:00+01:00");
  const services = new Map([["klippning", {
    id: "klippning", name: "Klippning", durationMinutes: 45, bufferMinutes: 15,
    price: { amountMinor: 45000, currency: "SEK" }, version: 1, staff: [STAFF],
  }]]);
  const proposals = new Map();
  const mandates = new Map();
  const bookings = new Map();
  const idempotency = new Map();
  const sms = new Map();
  const taken = new Set();
  const stats = { proposalsCreated: 0, bookingAttempts: 0 };

  const json = (res, status, body) => {
    res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify({ apiVersion: "v1", ...body }));
  };
  const fail = (res, status, code, message) => json(res, status, { error: { code, message } });
  const terms = (service, staffId, start) => ({
    serviceId: service.id, serviceVersion: service.version, staffId, start,
    durationMinutes: service.durationMinutes, priceMinor: service.price.amountMinor,
  });
  const termsHash = t => createHash("sha256")
    .update([t.serviceId, t.staffId, t.start, t.durationMinutes, t.priceMinor].join("|")).digest("hex");
  const slotKey = (staffId, start) => staffId + "@" + start;
  const publicProposal = p => ({
    id: p.id, status: p.status, consentUrl: p.consentUrl, expiresAt: new Date(p.expiresAt).toISOString(),
    terms: p.terms, ...(p.mandateId ? { mandateId: p.mandateId } : {}),
  });

  async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8");
  }

  function agentAuthorised(req) {
    const gatewayToken = req.headers["x-booking-gateway-token"];
    const auth = req.headers.authorization ?? "";
    return typeof gatewayToken === "string" && equal(gatewayToken, serviceToken) && equal(auth, "Bearer " + agentKey);
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://fixture.invalid");
      const path = url.pathname;

      // Fixture controls: stand-ins for the salon owner, the customer's phone and the clock.
      if (path.startsWith("/__fixture/")) {
        if (!equal(String(req.headers["x-fixture-owner"] ?? ""), ownerToken)) return fail(res, 401, "unauthorized", "Owner only.");
        const body = req.method === "POST" ? JSON.parse(await readBody(req) || "{}") : {};
        if (path.startsWith("/__fixture/sms/")) {
          const code = sms.get(path.slice("/__fixture/sms/".length));
          return code ? json(res, 200, { code }) : fail(res, 404, "not_found", "No message.");
        }
        if (path === "/__fixture/calendar")
          return json(res, 200, { bookings: [...bookings.values()].filter(b => b.status === "confirmed") });
        if (path === "/__fixture/price") {
          const service = services.get(body.serviceId);
          service.price = { ...service.price, amountMinor: body.amountMinor };
          return json(res, 200, { service });
        }
        if (path === "/__fixture/clock") { clock += body.advanceMs; return json(res, 200, { now: new Date(clock).toISOString() }); }
        if (path === "/__fixture/occupy") { taken.add(slotKey(body.staffId, body.start)); return json(res, 200, {}); }
        if (path === "/__fixture/stats") return json(res, 200, { stats });
        return fail(res, 404, "not_found", "Unknown fixture control.");
      }

      // Consent page: the customer's own browser, never the agent or the gateway.
      const consent = path.match(/^\/consent\/([\w-]{1,128})$/);
      if (consent) {
        const proposal = proposals.get(consent[1]);
        if (!proposal) return fail(res, 404, "not_found", "Unknown proposal.");
        if (req.method === "GET") {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          return res.end(`<!doctype html><title>Confirm booking</title><form method="post">` +
            `<p>Klippning ${proposal.terms.start}, ${proposal.terms.priceMinor / 100} SEK</p>` +
            `<label>SMS code <input name="code"></label><button>Approve</button></form>`);
        }
        const code = new URLSearchParams(await readBody(req)).get("code") ?? "";
        if (proposal.expiresAt <= clock) return fail(res, 410, "proposal_expired", "Proposal expired.");
        if (!equal(code, sms.get(proposal.id) ?? "")) return fail(res, 403, "consent_code_invalid", "Wrong code.");
        const mandate = { id: "mdt_" + id(), hash: termsHash(proposal.terms), expiresAt: clock + MANDATE_TTL_MS, used: false };
        mandates.set(mandate.id, mandate);
        proposal.status = "approved";
        proposal.mandateId = mandate.id;
        return json(res, 200, { proposal: publicProposal(proposal) });
      }

      if (!agentAuthorised(req)) return fail(res, 401, "unauthorized", "Agent credential and gateway token required.");
      if (req.method === "GET" && path === "/api/v1/access")
        return json(res, 200, { providerMode: "split", scopes: ["services:read", "availability:read", "bookings:read", "bookings:write"] });

      if (req.method === "GET" && path === "/api/v1/services")
        return json(res, 200, { business: BUSINESS, services: [...services.values()] });

      if (req.method === "GET" && path === "/api/v1/availability") {
        const service = services.get(url.searchParams.get("service") ?? "");
        if (!service) return fail(res, 404, "service_not_found", "Service not found.");
        const slots = STARTS.filter(start => !taken.has(slotKey(STAFF.id, start))).map(start => ({
          start, end: new Date(Date.parse(start) + service.durationMinutes * 60_000).toISOString(),
          durationMinutes: service.durationMinutes, serviceId: service.id, serviceVersion: service.version, staff: STAFF,
        }));
        return json(res, 200, { business: BUSINESS, service, range: { from: DAY, to: DAY, timeZone: BUSINESS.timeZone }, slots });
      }

      if (req.method === "POST" && path === "/api/v1/proposals") {
        const input = JSON.parse(await readBody(req));
        const service = services.get(input.serviceId);
        if (!service || input.serviceVersion !== service.version) return fail(res, 409, "stale_service", "Service changed.");
        if (!STARTS.includes(input.start) || taken.has(slotKey(input.staffId, input.start)))
          return fail(res, 409, "slot_unavailable", "Slot unavailable.");
        stats.proposalsCreated++;
        const proposal = { id: "prp_" + id(), status: "pending_consent", expiresAt: clock + PROPOSAL_TTL_MS,
          terms: terms(service, input.staffId, input.start) };
        proposal.consentUrl = `http://${req.headers.host}/consent/${proposal.id}`;
        proposals.set(proposal.id, proposal);
        sms.set(proposal.id, String(randomInt(100000, 1000000)));
        return json(res, 201, { proposal: publicProposal(proposal) });
      }

      const readProposal = path.match(/^\/api\/v1\/proposals\/([\w-]{1,128})$/);
      if (req.method === "GET" && readProposal) {
        const proposal = proposals.get(readProposal[1]);
        return proposal ? json(res, 200, { proposal: publicProposal(proposal) }) : fail(res, 404, "not_found", "Unknown proposal.");
      }

      if (req.method === "POST" && path === "/api/v1/bookings") {
        stats.bookingAttempts++;
        const key = req.headers["idempotency-key"];
        if (typeof key !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(key))
          return fail(res, 400, "idempotency_key_required", "Idempotency-Key required.");
        const raw = await readBody(req);
        const previous = idempotency.get(key);
        if (previous) return previous.raw === raw ? json(res, 200, { replayed: true, booking: bookings.get(previous.bookingId) })
          : fail(res, 409, "idempotency_conflict", "Key reused with another payload.");
        const input = JSON.parse(raw);
        if (input.confirmed !== true) return fail(res, 400, "confirmation_required", "Explicit confirmation required.");
        const mandate = mandates.get(input.mandateId ?? "");
        if (!mandate) return fail(res, 403, "mandate_required", "A customer-approved mandate is required.");
        const service = services.get(input.serviceId);
        if (!service) return fail(res, 404, "service_not_found", "Service not found.");
        // Re-check at the point of use: the current terms must hash to what the customer approved.
        if (mandate.used || mandate.expiresAt <= clock || termsHash(terms(service, input.staffId, input.start)) !== mandate.hash)
          return fail(res, 403, "mandate_denied", "Mandate expired, used, or terms changed since approval.");
        if (taken.has(slotKey(input.staffId, input.start))) return fail(res, 409, "slot_unavailable", "Slot unavailable.");
        if (!input.customer?.email?.endsWith("@example.test")) return fail(res, 400, "synthetic_contact_required", "Fictional contacts only.");
        mandate.used = true;
        taken.add(slotKey(input.staffId, input.start));
        const booking = { id: "bkg_" + id(), status: "confirmed", start: input.start,
          end: new Date(Date.parse(input.start) + service.durationMinutes * 60_000).toISOString(),
          durationMinutes: service.durationMinutes, serviceId: service.id, serviceName: service.name, staff: STAFF,
          version: service.version, createdAt: new Date(clock).toISOString() };
        bookings.set(booking.id, booking);
        idempotency.set(key, { raw, bookingId: booking.id });
        return json(res, 201, { replayed: false, booking });
      }

      const readBooking = path.match(/^\/api\/v1\/bookings\/([\w-]{1,128})$/);
      if (req.method === "GET" && readBooking) {
        const booking = bookings.get(readBooking[1]);
        return booking ? json(res, 200, { booking }) : fail(res, 404, "booking_not_found", "Unknown booking.");
      }
      return fail(res, 404, "not_found", "Unknown operation.");
    } catch {
      if (!res.headersSent) fail(res, 500, "internal_error", "Fixture failure.");
    }
  });
  return { server, stats };
}
