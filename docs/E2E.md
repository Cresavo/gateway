# End-to-end tests

Both commands run the same scenarios in `scripts/e2e.js` through the MCP SDK and a separate gateway process. Only the provider startup, owner controls and customer approval adapter change.

```sh
npm ci
npm run test:e2e
npm run test:e2e:real
```

The real run needs Node 24, Bash, Git, OpenSSL, a local PostgreSQL installation (`initdb`, `pg_ctl`, `createdb`, `dropdb`) and network access for the pinned public source, npm and Chromium. Run as an ordinary OS user. On Linux, install Playwright's Chromium system dependencies. To reuse a local source checkout, set `CRESAVO_CHECKOUT` to its path.

The runner clears the environment before it starts. It passes through only its own inputs, plus these network transport settings when they are set: `HTTPS_PROXY`, `NO_PROXY` (either case), `NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE` and `PLAYWRIGHT_BROWSERS_PATH`. They let the run work behind an egress proxy or with preinstalled browsers. They cannot choose the salon, mode or database. The private PostgreSQL cluster uses the `C` locale with UTF-8 encoding, so hosts without `en_US.UTF-8` work too. The runner extracts the pinned Git tree into a temporary directory, regardless of local edits, and installs from its lockfile.

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

## Consent delivery and the SMS gap

The real runner pins Cresavo `ffbfc48e2299bb4854eba71698468f9745d61b99`. In `separate-lab` the salon writes a single-use customer receipt to a private temporary directory. The customer browser opens `/consent/[id]`, reads the terms and approves. The browser sends the token and proposal hash to the same-origin decision endpoint. The SDK client receives neither the bearer link nor the decision credentials. All actors in this test are controlled by one trusted local test coordinator.

The optional legacy simulated SMS lab at this revision accepts only the prefix `+46700`. Sweden's reserved fictional mobile numbers use `+46701740605` through `+46701740699`. The OTP exists only in the salon process's simulated sender. The separate customer channel expressly forbids the SMS flag. SMS acceptance with reserved data remains blocked upstream. [Provider SMS validation](https://github.com/Cresavo/cresavo/blob/ffbfc48e2299bb4854eba71698468f9745d61b99/src/lib/agent-api/sms-otp.ts) · [PTS fictional number ranges](https://www.pts.se/internet-och-telefoni/telefonnummer-och-adressering/telefonnummer-till-bocker-och-filmer/)
