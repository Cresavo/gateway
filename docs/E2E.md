# End-to-end tests

Both commands run the same scenarios in `scripts/e2e.js` through the MCP SDK and a separate gateway process. Only the provider startup, owner controls and customer approval adapter change.

```sh
npm ci
npm run test:e2e
npm run test:e2e:real
```

The real run needs Node 24, Bash, Git, OpenSSL, a local PostgreSQL installation (`initdb`, `pg_ctl`, `createdb`, `dropdb`) and network access for the pinned public source, npm and Chromium. Run as an ordinary OS user. On Linux, install Playwright's Chromium system dependencies. To reuse a local source checkout, set `CRESAVO_CHECKOUT` to its path. The runner extracts the pinned Git tree into a temporary directory, regardless of local edits, and installs from its lockfile.

Locally the runner starts a private loopback PostgreSQL cluster with a random password. CI supplies a disposable PostgreSQL service bound to the runner's loopback interface. Each run creates its own randomly named `_test` database, migrates it, seeds Salong Eko and builds the provider. The two servers share a fresh service token. The gateway process receives its port, salon origin, PATH and service token. The test operator holds the database connection and manages the separate customer inbox. The runner removes the inbox, database and temporary checkout at exit.

## Shared scenarios

| Scenario | Evidence |
| --- | --- |
| Proposal and booking | The agent gets a pending proposal without customer credentials. Approval on the salon creates a mandate. MCP creates a booking, replays it with the original key, and reads it back. In the real run an independent owner session opens the exact ID from the authenticated calendar in Chromium. |
| Expiry | The operator expires the approved mandate in the disposable database. A fresh booking attempt receives `mandate_denied`. A separate check expires a pending proposal, opens the customer link and verifies 403, expired status and absence of a mandate. |
| Price change | The operator lowers the current price while keeping the service version fixed. The price still fits the cap, so refusal exercises the exact approved terms. An ordinary version change would instead return `stale_service`. |
| Slot taken | Another fictional visitor books the approved start through the salon domain. The agent receives `slot_unavailable`. |
| Rate limit | The first five proposals reach the salon. The sixth receives HTTP 429 with a positive `Retry-After`. The SDK also observes the refusal and the salon's proposal count stays unchanged. |

The fixture has one client, one treatment and a fixed inventory of slots on the chosen future weekday. It models the separate-channel wire exchange in memory. The real run exercises the provider's authentication, database locks, grants, booking rules and calendar. Both use the server-owned contact for this channel.

## Consent delivery

The real runner pins Cresavo `3943580a001b8f4b5b76a43ec410e1adee264cf6`. The agent receives a `consentUrl` with no secret. The customer browser opens `/consent/[id]`, reads the terms, types the synthetic customer address and asks for a code. The salon writes the newest code for that proposal to the operator's private temporary directory, the adapter reads it there and the customer approves with it. The booking must use the address that returned the code. The SDK client never receives the code or the directory. All actors in this test are controlled by one trusted local test coordinator.
