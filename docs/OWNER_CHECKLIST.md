# Owner checklist: the public gateway

Only the repository owner, or a Cresavo organisation owner, can do these steps. Nothing here has been done by automation. The repository is already public as `Cresavo/gateway`. Items marked *done* are confirmed; check the rest.

## 1. History and branches

- [x] *Done:* finding 1 in [`PUBLICATION_AUDIT.md`](PUBLICATION_AUDIT.md) is settled as option A, because the repository went public. Do not rewrite history now.
- [ ] In your GitHub email settings, turn on "Keep my email addresses private" and "Block command line pushes that expose my email". Do this before merging anything else in the web UI.
- [ ] Move the landing-page work (pull requests 1 and 6, branches `site/*` and `feat/landing-page`) to the website's repository, or confirm it can be dropped.
- [ ] Close Dependabot pull request 3 (Node 26). Review and merge pull requests 4 and 5 if wanted.
- [ ] Delete merged and superseded branches: `chore/prepare-public-release`, `docs/public-readiness`, `fix/gateway-service-auth`, `night/gateway-salon-integration`, `docs/separate-customer-consent-contract`, and the four site branches once they have moved.

## 2. Repository

- [x] *Done:* transferred and public as `Cresavo/gateway`.
- [ ] Set the description and topics (for example `mcp`, `booking`, `agpl`) and link the website.
- [ ] Confirm that GitHub shows the license as AGPL-3.0.

## 3. Repository settings

- [ ] Security: turn on private vulnerability reporting (`SECURITY.md` and the issue template link to it), secret scanning with push protection, Dependabot alerts and security updates.
- [ ] Actions → General: "Allow actions … by full commit SHA only" or an allow-list, default `GITHUB_TOKEN` permission read-only, and maintainer approval for workflows from first-time contributors' forks.
- [ ] Features: Issues on; Wiki and Projects off unless used. Discussions optional.
- [ ] Pull requests: allow squash merge only, "Automatically delete head branches", "Always suggest updating pull request branches".

## 4. Branch protection for `main` (ruleset)

- [ ] Require a pull request with at least one approval, and dismiss stale approvals.
- [ ] Require status checks: `test`, `real-provider`, `audit`, `secret-scan`, `image` (the CI job names).
- [ ] Require branches to be up to date, require linear history, block force-pushes and deletion.
- [ ] Optional: require signed commits. Add a `CODEOWNERS` file once a second maintainer exists.

## 5. Secrets and environments

- [ ] CI needs **no secrets**. Keep it that way; do not add repository secrets for tests.
- [ ] A hosted demo needs one new service token, generated on your own machine, for that environment only. Store it in the host's secret store for the gateway and the demo engine. Never put it in GitHub, chat, issues or logs.
- [ ] Optional: a GitHub environment `demo` with required reviewers, if a deploy workflow is added later.

## 6. Hosted demo on Vercel (separate approval)

Follow Cresavo's `docs/DEPLOY_SANDBOX.md` for the sandbox and [`HOSTING.md`](HOSTING.md#vercel-container-runtime) for the gateway. Two projects in the existing Vercel team.

- [ ] Sandbox project: free PostgreSQL and free Redis from the Marketplace, with no payment method attached. Production environment variables as the guide lists them.
- [ ] Gateway project: import `Cresavo/gateway`; `vercel.json` selects the container preset. Set `SALON_ORIGIN` (sandbox origin, HTTPS), `GATEWAY_PUBLIC_ORIGIN=https://gateway.cresavo.com`, `GATEWAY_TRUST_PROXY_HOPS=1`, `GATEWAY_REQUIRE_SHARED_LIMITS=1`, and `GATEWAY_RATE_LIMIT_REDIS_URL` (a separate free Redis, `rediss://`).
- [ ] Generate one new service token on your own machine and enter it in both projects yourself, as `GATEWAY_SERVICE_TOKEN`. Never in Git, chat or issues.
- [ ] A per-project budget with **pause production** on both projects.
- [ ] Domains: `gateway.cresavo.com` on the gateway project, and the sandbox's domain on the sandbox project, with DNS at the registrar. The gateway refuses `*.vercel.app` hosts by design.
- [ ] Live test before merging Cresavo 90–93:
  - `GET https://gateway.cresavo.com/healthz` and `/.well-known/usp`
  - `npm run provider:check -- --write` against the sandbox, from your own machine, with the service token only in your shell environment
  - `npm run test:e2e -- --gateway https://gateway.cresavo.com --adapter <sandbox hosted adapter>` with an ordinary sandbox agent key ([`CONNECT_A_PROVIDER.md`](CONNECT_A_PROVIDER.md)). Hosted mode does not cover price change, slot taken or expiry; those stay covered by the local real run.
  - approval on the demo phone, and the same booking ID in the sandbox calendar
- [ ] Check that the sandbox caps hold through the gateway (see the topology note on client addresses in `HOSTING.md`).
- [ ] Update the README "Demo status" line.

## 7. Release (optional)

- [ ] Once `main` is green after the move, move `CHANGELOG.md` "Unreleased" to `0.2.0`, tag `v0.2.0` and publish a GitHub release. Releases are yours to cut.
