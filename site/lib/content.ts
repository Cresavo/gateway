/**
 * Every product claim on the site lives in this file so it can be audited
 * against the gateway repository (README.md, openapi.yaml, src/) and the
 * provider's docs/GATEWAY_SPLIT.md + docs/VERIFICATION.md.
 *
 * Rule: if the code and docs do not prove it, it is "experimental" or
 * "planned", never "verified".
 */

export type Maturity = "verified" | "experimental" | "planned";

export const maturityLabel: Record<Maturity, string> = {
  verified: "Verified locally",
  experimental: "Experimental",
  planned: "Planned",
};

export const LOCAL_GATEWAY = "http://127.0.0.1:3218";

/** The five commitments shown above the fold. `evidence` is for reviewers, not rendered. */
export const principles: {
  title: string;
  detail: string;
  maturity: Maturity;
  state: string;
  evidence: string;
}[] = [
  {
    title: "The customer approves every booking.",
    detail: "The agent proposes a booking. Nothing is booked until the customer says yes to that exact service, time and price.",
    maturity: "experimental",
    state: "Approval flow runs locally. Tying the yes to the right person is still open.",
    evidence: "booking-lab-se main: AgentProposal → AgentMandate; proof/customer-approval-boundary 2026-11-16 reports identity binding FAIL.",
  },
  {
    title: "The salon decides who may book.",
    detail: "Each agent gets its own revocable key with scopes and daily limits. The salon sees a log of every attempt.",
    maturity: "verified",
    state: "Keys, scopes, limits and audit log verified locally.",
    evidence: "main: AgentApiKey (agentName, ownerName, scopes, revokedAt), quotas 5/client/day, AgentAuditEvent + /api/admin/audit.",
  },
  {
    title: "One interface across booking systems.",
    detail: "Agents learn one contract. Adapters translate it for each booking system the salon already uses.",
    maturity: "experimental",
    state: "SimplyBook adapter runs locally. Nordic systems are next.",
    evidence: "Owner statement 2026-11-16. Not found in the pushed repositories; only the in-process mock partner adapter is on main.",
  },
  {
    title: "Payment stays separate from approval.",
    detail: "Saying yes to a time is not paying for it. Deposits run on their own track with their own consent.",
    maturity: "experimental",
    state: "Swish deposit track is simulated.",
    evidence: "Owner statement 2026-11-16. No Swish code in the pushed repositories.",
  },
  {
    title: "Rails behind the assistant, not another app.",
    detail: "Customers keep using ChatGPT, Claude or Grok. Booking Lab is the layer those assistants book through.",
    maturity: "experimental",
    state: "Tested locally with a real MCP client (Codex CLI). No assistant integration is certified.",
    evidence: "proof/native-codex-consent: real Codex CLI via HTTP-MCP. ChatGPT web/mobile, Claude and Grok as clients not tested.",
  },
];

/** Three audiences side by side (Stripe-style paths). */
export const sides = {
  customer: {
    eyebrow: "For customers",
    title: "Your assistant asks. You decide.",
    body: "The agent finds the time, but the booking is yours to approve. You see the salon, service, time and price before anything is booked, and you can say no.",
  },
  salon: {
    eyebrow: "For salons",
    title: "Agents book on your terms.",
    body: "Choose which agents may book and what they may do. Set daily limits, revoke a key at any time, and read back every attempt, including the ones that were refused.",
  },
  developer: {
    eyebrow: "For developers",
    title: "One small, strict contract.",
    body: "REST v1 and MCP over Streamable HTTP, with idempotent booking, documented errors and discovery files agents can read on their own.",
  },
};

export const restEndpoints: { method: "GET" | "POST"; path: string; summary: string; scope: string }[] = [
  { method: "GET", path: "/api/v1/services?business={id}", summary: "List active services, prices and staff", scope: "services:read" },
  { method: "GET", path: "/api/v1/availability?business={id}&service={id}", summary: "Bookable start times (date, or from/to, optional staff)", scope: "availability:read" },
  { method: "POST", path: "/api/v1/bookings", summary: "Book one slot (Idempotency-Key header required)", scope: "bookings:write" },
  { method: "GET", path: "/api/v1/bookings/{id}", summary: "Status of a booking owned by this client", scope: "bookings:read" },
  { method: "POST", path: "/api/v1/bookings/{id}/cancel", summary: "Cancel an owned booking (idempotent)", scope: "bookings:write" },
];

export const mcpTools: { name: string; summary: string; alias?: string; maturity: Maturity }[] = [
  { name: "list_services", summary: "List the authorised salon's services, prices and staff.", alias: "usp_services_list", maturity: "verified" },
  { name: "get_availability", summary: "Find bookable starts for a service, date and optional staff.", alias: "usp_availability_query", maturity: "verified" },
  { name: "create_booking", summary: "Book after explicit confirmation under a server-issued mandate.", alias: "usp_bookings_create", maturity: "verified" },
  { name: "get_booking", summary: "Read an owned booking.", alias: "usp_bookings_get", maturity: "verified" },
  { name: "cancel_booking", summary: "Cancel an owned booking.", maturity: "verified" },
  { name: "create_proposal", summary: "Prepare a synthetic booking for customer consent in supported labs.", maturity: "experimental" },
  { name: "get_proposal", summary: "Read an owned booking proposal.", maturity: "experimental" },
];

export const discoveryEndpoints: { path: string; summary: string; auth: boolean }[] = [
  { path: "/.well-known/usp", summary: "USP discovery profile (REST + MCP endpoints, capabilities)", auth: false },
  { path: "/llms.txt", summary: "Plain-text index for language models", auth: false },
  { path: "/api/v1/openapi", summary: "OpenAPI 3.1 contract (YAML)", auth: false },
  { path: "/api/v1/mcp/schema", summary: "Native MCP input schemas and USP name aliases", auth: true },
];

export const errorCodes = [
  "unauthorized", "forbidden_scope", "forbidden_business", "business_not_found", "service_not_found",
  "staff_not_found", "booking_not_found", "invalid_request", "range_too_large", "idempotency_key_required",
  "confirmation_required", "mandate_required", "mandate_denied", "synthetic_contact_required",
  "slot_unavailable", "stale_service", "idempotency_conflict", "rate_limited", "internal_error",
] as const;

export const gatewayErrors: { status: number; code: string; meaning: string }[] = [
  { status: 503, code: "provider_unavailable", meaning: "The provider could not be reached. Retry with the same Idempotency-Key." },
  { status: 503, code: "provider_configuration_invalid", meaning: "The provider didn't confirm split mode. The gateway stopped before forwarding the operation." },
  { status: 502, code: "provider_invalid_response", meaning: "The provider returned something other than the expected JSON." },
  { status: 403, code: "forbidden_origin", meaning: "Cross-origin browser request or wrong Host header." },
  { status: 413, code: "request_too_large", meaning: "Request body over 64 KiB." },
];

export const status: Record<Maturity, { heading: string; intro: string; items: string[] }> = {
  verified: {
    heading: "Working today",
    intro: "Implemented and verified locally with synthetic data, automated tests and CI.",
    items: [
      "REST v1 and MCP over Streamable HTTP: services, availability, booking, status, cancel",
      "Per-agent keys with scopes, revocation and daily limits",
      "Audit log of agent activity for the salon",
      "Idempotent booking: a retry returns the same booking, never a second one",
      "Conflicts handled: one winner, a clean 409 for the other",
      "No booking without a stored, single-use mandate",
      "Booking id confirmed in the salon's own calendar (acceptance proof, 10/10)",
    ],
  },
  experimental: {
    heading: "Experimental",
    intro: "Runs locally in lab configurations. Useful to try, not ready to rely on.",
    items: [
      "Customer approval flow: proposal, yes, then booking. Binding the yes to the right person is not solved.",
      "Third-party adapters: SimplyBook running locally, plus an in-process mock partner",
      "Payment and deposit track kept separate from approval (Swish, simulated)",
      "Tested with a real MCP client (Codex CLI) end to end",
      "USP discovery profile and MCP name aliases (not full USP conformance)",
    ],
  },
  planned: {
    heading: "Roadmap",
    intro: "Not built yet. Listed so nothing above reads as a promise.",
    items: [
      "Verified customer identity behind every yes",
      "Nordic booking systems beyond SimplyBook",
      "Real Swish deposits and payment providers",
      "Hosted, internet-facing gateway (loopback only today)",
      "Pilot with real salons and customers (not started)",
    ],
  },
};

/** Claims deliberately kept off the site because nothing in the repositories proves them. */
export const excludedClaims = [
  "Partner status or endorsement from SimplyBook, Swish, OpenAI, Anthropic or xAI (names only, no logos)",
  "That ChatGPT, Claude or Grok have been tested or certified as clients",
  "That the customer's yes is verified to come from the real customer",
  "A hosted, publicly reachable sandbox or production gateway",
  "Real customer identity verification or verified consent",
  "Certification or compatibility with specific AI assistants",
  "Full USP protocol conformance",
  "Customer logos, testimonials, usage numbers or uptime figures",
  "Pilot readiness",
];
