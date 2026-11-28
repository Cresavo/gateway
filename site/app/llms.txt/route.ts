import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# Booking Lab

> Booking rails for AI assistants. Agents discover availability, propose a booking,
> wait for the customer's explicit yes, then book through one REST v1 / MCP contract.

Status: local proof of concept with synthetic data. There is no hosted gateway yet;
the gateway runs on loopback (default http://127.0.0.1:3218). Do not use real people's
contact details. Never put credentials in URLs or chat.

## Rules an agent must follow
- Book only after the customer has approved this exact service, time and price.
  A client-side "confirmed: true" is not approval; the provider requires a stored mandate.
- Retry a booking with the same Idempotency-Key. The gateway never invents a result.
- Payment and deposits are separate from booking approval.

## Documentation
- [Overview and docs](${site.url}/docs)
- [Run the local sandbox](${site.url}/docs#sandbox)
- [OpenAPI contract (YAML)](${site.url}/openapi.yaml)
- [MCP tools](${site.url}/docs#mcp)

## On a running gateway
- /.well-known/usp: USP discovery profile
- /llms.txt: the gateway's own index
- /api/v1/mcp: MCP over Streamable HTTP
- /api/v1/openapi: OpenAPI contract
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
