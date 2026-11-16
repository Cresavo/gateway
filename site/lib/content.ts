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
      "REST v1 and MCP over Streamable HTTP: services, availability, booking, status and cancellation",
      "Per-agent keys with scopes, revocation and daily limits",
      "An audit log of agent activity, including refused requests",
      "Idempotent booking: a retry returns the same booking, never a second one",
      "Conflict handling: one request wins the slot, the other gets a clear 409",
      "No booking without a stored, single-use mandate",
      "The booking id checked in the salon's own calendar by a two-process acceptance proof",
    ],
  },
  experimental: {
    heading: "Experimental",
    intro: "Runs locally in lab configurations. Useful to explore, not ready to rely on.",
    items: [
      "Customer approval: proposal, then the customer's yes, then booking. In the newest lab profile the approval request goes to a synthetic customer instead of the agent. A real customer's identity is not verified.",
      "A provider adapter interface, exercised by a synthetic in-process mock partner. A SimplyBook adapter is being tried on a developer machine and isn't in the tested repositories yet.",
      "A simulated deposit step, kept separate from approval. It is a local simulation only, and no payment is collected.",
      "A real MCP client (Codex CLI) booking end to end on a local machine",
      "USP discovery profile and MCP name aliases, without full USP conformance",
    ],
  },
  planned: {
    heading: "Not built yet",
    intro: "Listed so that nothing above reads as a promise.",
    items: [
      "Verified customer identity behind every approval",
      "Support for more booking providers",
      "Real deposits and payment providers",
      "A hosted, internet-facing gateway (it runs on loopback only today)",
      "Searching and comparing many bookable businesses (the demo's salon list is illustrative)",
      "A pilot with real businesses and customers",
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
