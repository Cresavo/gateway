// SPDX-License-Identifier: AGPL-3.0-only
const DEMO_LOCATION_ID = "demo-location";
const ZONE = "Europe/Stockholm";
const USP_VERSION = "2026-08-20";
export function uspProfile(origin) {
  const version = USP_VERSION;
  return {
    usp: {
      version,
      services: { "dev.usp-protocol.services": [
        { version, transport: "rest", endpoint: `${origin}/api/v1`, spec: "https://usp-protocol.dev/specification",
          schema: `${origin}/api/v1/openapi` },
        { version, transport: "mcp", endpoint: `${origin}/api/v1/mcp`, spec: "https://usp-protocol.dev/transport/mcp/",
          schema: `${origin}/api/v1/mcp/schema` },
      ] },
      capabilities: {
        "dev.usp-protocol.services.catalog": [{ version }],
        "dev.usp-protocol.services.availability": [{ version, holds: false }],
        "dev.usp-protocol.services.bookings": [{ version }],
      },
      business: { name: "Salong Eko (synthetic demo)", timezone: ZONE, currency: "SEK" },
    },
    authorization: { privileged_operations_require_authentication: true, accepted_mechanisms: ["api_key"] },
    "x-booking-lab": {
      status: "synthetic-discovery-preview", wire_contract: "native-v1",
      compatibility: "USP profile discovery and MCP tool-name aliases only; canonical USP wire/negotiation and full lifecycle are not implemented.",
      location_id: DEMO_LOCATION_ID, human_mandate: "Server-issued synthetic operator grant required; buyer.consent is not authority.",
    },
  };
}
export function llmsText(origin) {
  return `# Booking Lab\n\nSynthetic booking gateway. No real customers, holds, checkout or payment.\n\n` +
    `- [USP discovery profile](${origin}/.well-known/usp)\n` +
    `- [REST OpenAPI](${origin}/api/v1/openapi)\n` +
    `- [Services API](${origin}/api/v1/services?business=demo)\n` +
    `- [HTTP MCP](${origin}/api/v1/mcp)\n` +
    `- [Native MCP input schema](${origin}/api/v1/mcp/schema)\n\n` +
    `Use configured API-key authentication. Never paste credentials or real contacts into chat.\n` +
    `USP aliases retain native Booking Lab inputs/results; full USP conformance is not claimed.\n` +
    `Creation needs mandateId from the trusted synthetic operator and a stable idempotency key.\n` +
    `Client JSON or buyer.consent cannot issue, replace or widen a stored mandate.\n`;
}
