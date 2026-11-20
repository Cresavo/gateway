#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Provider conformance check: does a booking system implement the provider
// contract in docs/PROVIDER_CONTRACT.md well enough for the gateway to front it?
//
//   PROVIDER_ORIGIN=https://booking.example.test \
//   PROVIDER_BUSINESS=demo \
//   GATEWAY_SERVICE_TOKEN=... PROVIDER_AGENT_KEY=... \
//   npm run provider:check [-- --write]
//
// Read-only by default. Booking attempts are always ones the contract requires
// the provider to refuse. --write also creates one pending proposal, which needs
// customer approval before anything is booked. Credentials are read from the
// environment and never printed.
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { providerOrigin } from "../src/provider.js";

const TIMEOUT_MS = 10_000;
const day = offset => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

/**
 * @param {{ origin: string, serviceToken: string, agentKey: string, business: string, write?: boolean }} options
 * @returns {Promise<{ id: string, status: "pass" | "fail" | "warn" | "skip", detail: string }[]>}
 */
export async function checkProvider({ origin, serviceToken, agentKey, business, write = false }) {
  const base = providerOrigin(origin);
  const results = [];
  const record = (id, status, detail) => results.push({ id, status, detail });

  /** @param {string} method @param {string} path @param {{ gateway?: boolean, agent?: string, body?: object, key?: string }} [options] */
  async function call(method, path, { gateway = true, agent = agentKey, body = undefined, key = undefined } = {}) {
    const headers = { accept: "application/json" };
    if (gateway) headers["x-booking-gateway-token"] = serviceToken;
    if (agent) headers.authorization = "Bearer " + agent;
    if (key) headers["idempotency-key"] = key;
    if (body) headers["content-type"] = "application/json";
    const response = await fetch(new URL(path, base), { method, headers, redirect: "error",
      body: body && JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
    const json = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
    let payload;
    try { payload = json ? await response.json() : undefined; } catch { payload = undefined; }
    if (!json) await response.body?.cancel();
    return { status: response.status, json, payload };
  }
  const isEnvelope = p => p?.apiVersion === "v1" && typeof p?.error?.code === "string" && typeof p?.error?.message === "string";
  function expectError(id, result, status, code, why) {
    if (result.status === status && isEnvelope(result.payload) && result.payload.error.code === code) return record(id, "pass", why);
    const got = isEnvelope(result.payload) ? `${result.status} ${result.payload.error.code}` : `${result.status}${result.json ? " without the v1 error envelope" : " non-JSON"}`;
    record(id, "fail", `${why} Expected ${status} ${code} with {apiVersion:"v1",error:{code,message}}, got ${got}.`);
  }
  async function step(id, fn) {
    try { await fn(); } catch (error) {
      const reason = error?.name === "TimeoutError" ? "timed out" : error?.cause?.code ?? error?.message ?? "request failed";
      record(id, "fail", `Request failed (${reason}). Providers must answer within ${TIMEOUT_MS / 1000} s, over HTTPS, without redirects.`);
    }
  }

  await step("access_requires_gateway_identity", async () =>
    expectError("access_requires_gateway_identity", await call("GET", "/api/v1/access", { gateway: false }), 401, "unauthorized",
      "The access check must refuse a valid agent credential that arrives without the gateway's service token."));

  await step("access_rejects_unknown_agent", async () =>
    expectError("access_rejects_unknown_agent", await call("GET", "/api/v1/access", { agent: "provider-check-unknown-" + randomUUID() }),
      401, "unauthorized", "The access check must refuse an unknown agent credential."));

  let scopes = [];
  await step("access_confirms_split_mode", async () => {
    const result = await call("GET", "/api/v1/access");
    const p = result.payload;
    if (result.status === 200 && result.json && p?.apiVersion === "v1" && p?.providerMode === "split" && Array.isArray(p?.scopes)) {
      scopes = p.scopes;
      return record("access_confirms_split_mode", "pass", `Split mode confirmed with scopes: ${scopes.join(", ") || "none"}.`);
    }
    record("access_confirms_split_mode", "fail", `GET /api/v1/access must answer 200 application/json with {apiVersion:"v1", providerMode:"split", scopes:[...]}; got ${result.status}. The gateway refuses every operation until this passes.`);
  });
  for (const scope of ["services:read", "availability:read", "bookings:read", "bookings:write"])
    if (results.at(-1)?.id === "access_confirms_split_mode" && results.at(-1)?.status === "pass" && !scopes.includes(scope))
      record("scope_" + scope.replace(":", "_"), "warn", `The test credential lacks ${scope}; checks that need it may fail.`);

  await step("operations_require_gateway_identity", async () =>
    expectError("operations_require_gateway_identity", await call("GET", `/api/v1/services?business=${encodeURIComponent(business)}`, { gateway: false }),
      401, "unauthorized", "Operations must also refuse requests without the service token, so nothing bypasses the gateway."));

  let service, slot;
  await step("services_catalog", async () => {
    const result = await call("GET", `/api/v1/services?business=${encodeURIComponent(business)}`);
    const p = result.payload;
    const valid = s => typeof s?.id === "string" && Number.isInteger(s?.version) && Number.isInteger(s?.durationMinutes) &&
      Number.isInteger(s?.price?.amountMinor) && typeof s?.price?.currency === "string" && Array.isArray(s?.staff) &&
      s.staff.every(m => typeof m?.id === "string" && typeof m?.name === "string");
    if (result.status === 200 && p?.apiVersion === "v1" && typeof p?.business?.id === "string" && Array.isArray(p?.services) && p.services.every(valid)) {
      service = p.services[0];
      return record("services_catalog", p.services.length ? "pass" : "warn",
        p.services.length ? `${p.services.length} service(s) with id, version, duration, price in minor units and staff.` : "The catalog is valid but empty; availability and booking checks are skipped.");
    }
    record("services_catalog", "fail", `GET /api/v1/services must return {apiVersion:"v1", business:{id,...}, services:[{id, version, durationMinutes, price:{amountMinor,currency}, staff:[{id,name}]}]}; got ${result.status}.`);
  });

  if (service) await step("availability_slots", async () => {
    const result = await call("GET", `/api/v1/availability?business=${encodeURIComponent(business)}&service=${encodeURIComponent(service.id)}&from=${day(1)}&to=${day(13)}`);
    const p = result.payload;
    const valid = s => typeof s?.start === "string" && typeof s?.end === "string" && s?.serviceId === service.id &&
      Number.isInteger(s?.serviceVersion) && typeof s?.staff?.id === "string" && /[+-]\d{2}:\d{2}$|Z$/.test(s.start);
    if (result.status === 200 && p?.apiVersion === "v1" && Array.isArray(p?.slots) && p.slots.every(valid)) {
      slot = p.slots[0];
      return record("availability_slots", p.slots.length ? "pass" : "warn",
        p.slots.length ? `${p.slots.length} bookable start(s) in the next 13 days, with offset-aware times.` : "Valid but no free slots in the next 13 days; booking-shape checks use the first staff member.");
    }
    record("availability_slots", "fail", `GET /api/v1/availability must return {apiVersion:"v1", slots:[{start, end, serviceId, serviceVersion, staff:{id}}]} with offset-aware times; got ${result.status}.`);
  });
  else record("availability_slots", "skip", "No service to query.");

  if (service) await step("availability_range_limit", async () =>
    expectError("availability_range_limit", await call("GET", `/api/v1/availability?business=${encodeURIComponent(business)}&service=${encodeURIComponent(service.id)}&from=${day(1)}&to=${day(30)}`),
      400, "range_too_large", "Availability ranges are limited to 14 days."));

  const terms = service && {
    business, serviceId: service.id, serviceVersion: slot?.serviceVersion ?? service.version,
    staffId: slot?.staff?.id ?? service.staff[0]?.id ?? "none", start: slot?.start ?? `${day(2)}T09:00:00+00:00`,
  };
  const attempt = { ...terms, confirmed: true, customer: { name: "Provider Check", email: "provider-check@example.test" } };

  if (service) await step("booking_requires_idempotency_key", async () =>
    expectError("booking_requires_idempotency_key", await call("POST", "/api/v1/bookings", { body: attempt }),
      400, "idempotency_key_required", "Booking creation must require an Idempotency-Key so retries never double-book."));

  if (service) await step("booking_requires_customer_mandate", async () =>
    expectError("booking_requires_customer_mandate", await call("POST", "/api/v1/bookings", { body: attempt, key: "provider-check-" + randomUUID() }),
      400, "mandate_required", "A booking without a customer-approved mandate must be refused, even with confirmed=true."));

  if (service) await step("booking_rejects_unknown_mandate", async () =>
    expectError("booking_rejects_unknown_mandate", await call("POST", "/api/v1/bookings", { body: { ...attempt, mandateId: randomUUID() }, key: "provider-check-" + randomUUID() }),
      403, "mandate_denied", "An unknown or foreign mandate must be refused."));

  await step("unknown_booking_is_not_found", async () =>
    expectError("unknown_booking_is_not_found", await call("GET", "/api/v1/bookings/" + randomUUID()), 404, "booking_not_found",
      "Unknown or foreign bookings must look the same: 404 booking_not_found."));

  await step("unknown_proposal_is_not_found", async () =>
    expectError("unknown_proposal_is_not_found", await call("GET", "/api/v1/proposals/" + randomUUID()), 404, "booking_not_found",
      "Unknown or foreign proposals must look the same: 404 booking_not_found."));

  if (!write) record("proposal_created_pending", "skip", "Run with --write to create one pending proposal.");
  else if (!slot) record("proposal_created_pending", "skip", "No free slot to propose.");
  else await step("proposal_created_pending", async () => {
    const result = await call("POST", "/api/v1/proposals", { body: terms });
    const p = result.payload?.proposal;
    if (![200, 201].includes(result.status) || typeof p?.id !== "string" || p?.status !== "pending" || p?.mandateId)
      return record("proposal_created_pending", "fail", `POST /api/v1/proposals must return a pending proposal {proposal:{id, status:"pending"}} and no mandate; got ${result.status}.`);
    record("proposal_created_pending", "pass", `Pending proposal ${p.id} created; nothing is booked until the customer approves.`);
    const text = JSON.stringify(result.payload);
    record("approval_link_stays_with_customer", /approvalUrl|\/consent\/|token/i.test(text) ? "warn" : "pass",
      /approvalUrl|\/consent\/|token/i.test(text)
        ? "The response seems to give the agent an approval link or token. The contract expects the provider to deliver approval to the customer directly."
        : "The agent receives no approval link or token.");
  });

  return results;
}

async function main() {
  const env = process.env;
  const missing = ["PROVIDER_ORIGIN", "PROVIDER_BUSINESS", "GATEWAY_SERVICE_TOKEN", "PROVIDER_AGENT_KEY"].filter(name => !env[name]);
  if (missing.length) {
    console.error("Set " + missing.join(", ") + ". See docs/CONNECT_A_PROVIDER.md.");
    process.exitCode = 2;
    return;
  }
  const results = await checkProvider({ origin: env.PROVIDER_ORIGIN, business: env.PROVIDER_BUSINESS,
    serviceToken: env.GATEWAY_SERVICE_TOKEN, agentKey: env.PROVIDER_AGENT_KEY, write: process.argv.includes("--write") });
  const mark = { pass: "PASS", fail: "FAIL", warn: "WARN", skip: "SKIP" };
  for (const r of results) console.log(`${mark[r.status].padEnd(4)}  ${r.id}  ${r.detail}`);
  const failed = results.filter(r => r.status === "fail").length;
  console.log(failed ? `\n${failed} check(s) failed. The gateway cannot front this provider yet.` : "\nConformant. The gateway can front this provider.");
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
