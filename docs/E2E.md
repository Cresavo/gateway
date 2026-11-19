# End-to-end test

`npm run test:e2e` runs the whole agent path with fictional data:

```
MCP SDK client (@modelcontextprotocol/client) ──▶ gateway process (node src/server.js, loopback) ──▶ split-mode provider
```

## What it checks

| Scenario | Expected |
| --- | --- |
| Happy path | `create_proposal` → customer reads the simulated SMS code and approves on `/consent/[id]` → `get_proposal` shows `approved` and a `mandateId` → `create_booking` → same `Idempotency-Key` replays the same booking → the salon calendar contains exactly one booking with the exact ID returned over MCP. |
| Expired consent | Mandate past its expiry → `mandate_denied`. |
| Changed price | Price changed after approval, mandate hash no longer matches → `mandate_denied`. |
| Slot taken | Another customer takes the slot after approval → `slot_unavailable`. |
| Rate limit hit | Sixth proposal from one IP within an hour → HTTP 429 with `Retry-After`, error `rate_limited`, the SDK client gets an error, and the salon records no extra proposal. |

The gateway runs as a separate process with the production entry point. Credentials are generated per run, kept in memory and never printed.

## Provider used

The run uses `test/e2e/fixture-provider.js`: a **fictional in-memory provider** that follows the flow described for Cresavo (proposal, consent with simulated SMS code, mandate hash over service, staff, time, duration and price, re-check at booking). It is not Cresavo code. The proposal and consent wire shapes are the fixture's assumptions and must be checked against Cresavo.

## Against a real Cresavo provider

Still to do, and required before calling the path verified. It needs the Cresavo repository (`Cresavo/cresavo`, `docs/GATEWAY_SPLIT.md`) to:

1. start local Postgres and seed the fictional demo salon;
2. start the provider in split mode with the same `GATEWAY_SERVICE_TOKEN`;
3. issue a synthetic agent credential;
4. expose the simulated SMS code and calendar to the test (owner-side or test-only routes).

The harness keeps those four steps in the `owner(...)` and `approve(...)` helpers in `scripts/e2e.js`, so a Cresavo adapter only replaces those helpers and the provider start. The Cresavo repository already has a cross-repository acceptance suite (see `docs/GATEWAY_SPLIT.md` there) that checks the salon calendar for the exact MCP-created booking ID; the CI job `e2e` here covers the fixture run.

## Example output

```
[e2e] provider - fictional split-mode fixture on http://127.0.0.1:40521
[e2e] gateway - http://127.0.0.1:35375 (separate Node process, loopback)
[e2e] mcp - connected with SDK client; 12 tools: create_proposal, get_proposal, list_services, get_availability, create_booking, get_booking, cancel_booking, usp_services_list, usp_services_get, usp_availability_query, usp_bookings_create, usp_bookings_get
[e2e]   proposal - prp_Bv_crpB5n_f3EBj48JqEsQ status=pending_consent price=45000 öre
[e2e]   booking - bkg_KDzkJZ8VTjF5MiK_Rt7qPw 2027-03-02T09:00:00+01:00
[e2e]   calendar - salon calendar contains bkg_KDzkJZ8VTjF5MiK_Rt7qPw
[e2e] PASS - happy path: propose, customer approves, booking lands in the salon calendar with the exact ID
[e2e] PASS - expired consent: an approved mandate past its expiry cannot book
[e2e] PASS - changed price: the mandate hash no longer matches and booking is refused
[e2e] PASS - slot taken: another customer books the slot after approval
[e2e] PASS - rate limit hit: the sixth proposal in an hour gets 429 with Retry-After and never reaches the salon
[e2e] RESULT PASSED - 0 failing scenario(s)
```
