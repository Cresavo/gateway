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

export const flowSteps: {
  n: number;
  title: string;
  body: string;
  surface: string[];
  maturity: Maturity;
  note?: string;
}[] = [
  {
    n: 1,
    title: "Discover availability",
    body: "The agent reads the authorised catalog and asks for bookable start times. At most 14 days per request, up to 60 days ahead.",
    surface: ["list_services", "get_availability", "GET /api/v1/availability"],
    maturity: "verified",
  },
  {
    n: 2,
    title: "Create a booking proposal",
    body: "The agent can prepare a booking for the customer to review. The gateway exposes the operation, but only lab configurations of the provider support it.",
    surface: ["create_proposal", "get_proposal"],
    maturity: "experimental",
  },
  {
    n: 3,
    title: "Obtain customer approval",
    body: "Booking requires a mandateId that the provider has already stored. The provider checks it against the client, service, staff member, time slot, price cap, expiry and single use. The agent's confirmed: true flag grants nothing on its own.",
    surface: ["mandateId", "confirmed: true"],
    maturity: "experimental",
    note: "Today mandates are synthetic and issued by a trusted operator. Collecting real customer approval through an authorised channel is planned.",
  },
  {
    n: 4,
    title: "Confirm the booking",
    body: "The provider books the slot in one transaction. Each attempt carries an Idempotency-Key. When two agents ask for the same slot, one succeeds and the other gets 409 slot_unavailable.",
    surface: ["create_booking", "POST /api/v1/bookings"],
    maturity: "verified",
  },
  {
    n: 5,
    title: "Return a verifiable result",
    body: "The agent gets a booking id and status it can read back. The cross-repository acceptance proof checks that exact id appears in the salon's own authenticated calendar.",
    surface: ["get_booking", "GET /api/v1/bookings/{id}"],
    maturity: "verified",
  },
];

export const problems: {
  title: string;
  problem: string;
  answer: string;
  maturity: Maturity;
  href: string;
}[] = [
  {
    title: "Fragmented booking integrations",
    problem: "Every booking system has its own API, auth and quirks, so agents end up hard-coding one vendor at a time.",
    answer: "The agent talks to one versioned contract (REST v1 and MCP). Each booking system sits behind a provider boundary. Today there is one provider: Booking Lab's own synthetic salon.",
    maturity: "experimental",
    href: "/docs#architecture",
  },
  {
    title: "Duplicate integration work",
    problem: "Teams rebuild the same discovery, schemas and error handling for REST clients and for MCP tool-calling agents.",
    answer: "REST and MCP share the same operations and input schemas. Discovery is published at /.well-known/usp, /llms.txt, the OpenAPI document and the MCP schema.",
    maturity: "verified",
    href: "/docs#discovery",
  },
  {
    title: "Booking conflicts",
    problem: "Two agents, or an agent and the front desk, can both claim the same slot.",
    answer: "The provider owns scheduling and books in a single transaction. In the acceptance proof, two transports race for one slot: one wins, the other gets a controlled 409.",
    maturity: "verified",
    href: "/docs#errors",
  },
  {
    title: "Lost responses and retries",
    problem: "A timeout leaves the agent unsure whether the booking happened. Retrying blindly creates duplicates.",
    answer: "Creation requires an Idempotency-Key. Retrying with the same key and body returns the original booking (200, replayed: true). If the provider is unreachable, the gateway returns 503 and never invents a result.",
    maturity: "verified",
    href: "/docs#idempotency",
  },
  {
    title: "Customer authorisation and approval",
    problem: "An agent saying “the user confirmed” is not proof that the customer agreed to this booking.",
    answer: "Agent keys are scoped and issued by the provider. Booking also needs a mandate the provider has stored. The provider checks it every time it is used. The mandates are synthetic today, not verified consent from real customers.",
    maturity: "experimental",
    href: "/docs#authorization",
  },
  {
    title: "Consistent agent behaviour",
    problem: "Loose schemas and vague errors leave every model to improvise differently.",
    answer: "Inputs are strict and unknown fields are rejected. Error codes are documented. Before every operation the gateway checks that the provider is running in the expected mode, and refuses the call (503) if it is not.",
    maturity: "verified",
    href: "/docs#errors",
  },
];

export const devFeatures: { title: string; body: string }[] = [
  { title: "REST v1", body: "Services, availability, booking creation, status and cancellation, described by an OpenAPI 3.1 contract." },
  { title: "MCP over Streamable HTTP", body: "The same operations as MCP tools at /api/v1/mcp, using the same agent key." },
  { title: "Discovery", body: "A USP discovery profile at /.well-known/usp and an llms.txt index. Agents can find the endpoints without custom setup." },
  { title: "Schemas", body: "Strict Zod input schemas, published as JSON Schema at /api/v1/mcp/schema." },
  { title: "Agent authorisation", body: "Each request needs a provider-issued key with scopes, checked before the call is forwarded. Booking also requires a mandate the provider has stored." },
  { title: "Idempotent booking", body: "A required Idempotency-Key makes retries safe. Replays don't consume another mandate or booking quota." },
];

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

export const useCases: { title: string; who: string; body: string; today: string; maturity: Maturity }[] = [
  {
    title: "AI receptionist for a salon",
    who: "Teams building AI receptionists",
    body: "An assistant answers a booking request, reads the salon's services and open times, and books under a stored mandate. The booking appears in the salon's own calendar.",
    today: "Demonstrated end to end against Booking Lab's synthetic salon in the local two-process acceptance proof.",
    maturity: "verified",
  },
  {
    title: "Personal assistant requesting an appointment",
    who: "Developers of agentic apps",
    body: "A user's own assistant connects over MCP, finds a time that suits them and asks for the booking, without knowing which software the business runs.",
    today: "Proven locally with an MCP SDK client over Streamable HTTP. A real end-user assistant connecting to a hosted gateway has not been verified.",
    maturity: "experimental",
  },
  {
    title: "Booking platform via a provider adapter",
    who: "Booking platforms",
    body: "A platform supplies an adapter and its own authorisation integration. Agents keep the same contract. The gateway doesn't change for each vendor.",
    today: "Not built. No third-party platform is connected and no partner compatibility is implied.",
    maturity: "planned",
  },
];

export const status: Record<Maturity, { heading: string; intro: string; items: string[] }> = {
  verified: {
    heading: "Working today",
    intro: "Implemented, and verified locally with synthetic data, automated tests and CI.",
    items: [
      "REST v1: services, availability, create, status, cancel",
      "Streamable HTTP MCP exposing the same operations",
      "Idempotent creation and replay with Idempotency-Key",
      "Controlled conflicts: one winner, 409 slot_unavailable for the other",
      "Booking refused without a provider-stored mandate",
      "Per-operation provider check that fails closed",
      "Cross-repository acceptance proof: 10/10 PASS, booking id found in the salon calendar",
      "Gateway test suite (10/10) green in CI on main",
    ],
  },
  experimental: {
    heading: "Experimental",
    intro: "Present in code, but limited in scope or only available in lab configurations.",
    items: [
      "USP discovery profile and MCP name aliases (not full USP wire conformance)",
      "Booking proposals, supported only by lab provider configurations",
      "Mandates issued by a synthetic operator rather than by real customers",
      "Mock partner adapter inside the provider's lab (in-process, loopback only)",
    ],
  },
  planned: {
    heading: "Roadmap",
    intro: "Not built yet. Listed here so nothing above reads as a promise.",
    items: [
      "Integrations with third-party booking platforms",
      "Real customer approval delivery and identity verification",
      "Hosted, internet-facing gateway (it listens on loopback only today)",
      "Holds, payments and rescheduling (outside v1)",
      "Pilot with real businesses and customers (not started)",
    ],
  },
};

/** Claims deliberately kept off the site because nothing in the repositories proves them. */
export const excludedClaims = [
  "Integrations with named booking platforms or any partner compatibility",
  "A hosted, publicly reachable sandbox or production gateway",
  "Real customer identity verification or verified consent",
  "Certification or compatibility with specific AI assistants",
  "Full USP protocol conformance",
  "Customer logos, testimonials, usage numbers or uptime figures",
  "Pilot readiness",
];
