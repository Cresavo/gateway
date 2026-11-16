/**
 * Code examples follow openapi.yaml (BookingRequest/BookingResponse) and
 * src/mcp-inputs.js exactly. Values are the contract's own synthetic examples.
 * Identifiers the server generates are shown as <placeholders>, not invented.
 */

/** Backslash and newline, kept out of source text so the file has no escape sequences. */
export const BS = String.fromCharCode(92);
const NL = String.fromCharCode(10);

export type Example = { id: string; label: string; caption: string; code: string };

export const bookingBody = `{
  "business": "demo",
  "serviceId": "fotvard",
  "serviceVersion": 1,
  "staffId": "staff-demo",
  "start": "2026-11-24T09:00:00+01:00",
  "customer": {
    "name": "Test Person",
    "email": "person@example.test"
  },
  "confirmed": true,
  "mandateId": "<operator-issued-mandate-id>"
}`;

export const examples: Example[] = [
  {
    id: "rest",
    label: "REST",
    caption: "Create a booking against a local gateway. The key comes from your environment, never the URL.",
    code: `curl -sS http://127.0.0.1:3218/api/v1/bookings ${BS}
  -H "Authorization: Bearer $BOOKING_LAB_AGENT_KEY" ${BS}
  -H "Idempotency-Key: salon-demo-0924-0900" ${BS}
  -H "Content-Type: application/json" ${BS}
  -d '${bookingBody.split(NL).join(NL + "  ")}'`,
  },
  {
    id: "mcp",
    label: "MCP",
    caption: "The same booking as an MCP tools/call, sent to POST /api/v1/mcp with the same key.",
    code: `{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "create_booking",
    "arguments": {
      "idempotencyKey": "salon-demo-0924-0900",
      "business": "demo",
      "serviceId": "fotvard",
      "serviceVersion": 1,
      "staffId": "staff-demo",
      "start": "2026-11-24T09:00:00+01:00",
      "customer": {
        "name": "Test Person",
        "email": "person@example.test"
      },
      "confirmed": true,
      "mandateId": "<operator-issued-mandate-id>"
    }
  }
}`,
  },
  {
    id: "response",
    label: "Response",
    caption: "201 on creation. A retry with the same key and body returns 200 with replayed: true and the same booking.",
    code: `{
  "apiVersion": "v1",
  "replayed": false,
  "booking": {
    "id": "<booking-id>",
    "status": "confirmed",
    "start": "2026-11-24T09:00:00+01:00",
    "end": "2026-11-24T10:00:00+01:00",
    "durationMinutes": 60,
    "serviceId": "fotvard",
    "serviceName": "<service-name>",
    "staff": { "id": "staff-demo", "name": "<staff-name>" },
    "version": 1,
    "createdAt": "<timestamp>"
  }
}`,
  },
];
