# Owner checklist: making the gateway public

Only the repository owner, or a Cresavo organisation owner, can do these steps. Nothing here has been done by automation. Work top to bottom; each block depends on the one before it.

## 1. Decide on history (before anything is public)

- [ ] Read [`PUBLICATION_AUDIT.md`](PUBLICATION_AUDIT.md), finding 1. Choose option A (accept), B (fresh repository, recommended) or C (rewrite in place).
- [ ] In your GitHub email settings, turn on "Keep my email addresses private" and "Block command line pushes that expose my email". Do this before merging anything else in the web UI.
- [ ] Move the landing-page work (pull requests 1 and 6, branches `site/*` and `feat/landing-page`) to the website's repository, or confirm it can be dropped.
- [ ] Close Dependabot pull request 3 (Node 26). Review and merge pull requests 4 and 5 if wanted.
- [ ] Delete merged and superseded branches: `chore/prepare-public-release`, `docs/public-readiness`, `fix/gateway-service-auth`, `night/gateway-salon-integration`, `docs/separate-customer-consent-contract`, and the four site branches once they have moved.

## 2. Create or transfer the repository

- [ ] Option B: create the empty public repository `Cresavo/gateway` in the organisation, push the cleaned `main`, and archive `niclasvestlund-YT/booking-lab-gateway`. Option A or C: Settings → Danger zone → Transfer to `Cresavo`, rename to `gateway`, then change visibility to public.
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

## 6. Domains and hosting (only after the demo engine exists)

- [ ] Choose subdomains under a domain you control, for example `gateway.<demo domain>` and `engine.<demo domain>`. Create DNS records at your registrar and HTTPS on the host.
- [ ] Deploy a Cresavo engine in split mode with a managed PostgreSQL seeded with fictional data ([`HOSTING.md`](HOSTING.md#prerequisite-a-public-split-mode-provider)).
- [ ] Deploy this image with exactly one instance and the remote flags from `HOSTING.md`. Turn off request-body and header logging on the host.
- [ ] Check `https://gateway.<demo domain>/healthz` and `/.well-known/usp`. Then run one booking through an assistant with fictional data.
- [ ] Update the README "Demo status" line.

## 7. Release (optional)

- [ ] Once `main` is green after the move, move `CHANGELOG.md` "Unreleased" to `0.2.0`, tag `v0.2.0` and publish a GitHub release. Releases are yours to cut.
