# Publication audit

Audit of everything that becomes visible when this repository is public as `Cresavo/gateway`: Git history on every branch, the `refs/pull/*` refs GitHub keeps for pull requests, and the pull request and issue pages.

- Date: 2026-11-20 (supersedes the 2026-11-19 audit of the first four commits).
- Scope: all 12 branches on `origin`, all `refs/pull/*/head` and `refs/pull/*/merge` refs (pull requests 1–7), no tags, no stashes. 46 commits in total (`git rev-list --all` after fetching `+refs/pull/*`).
- Pull request pages 1–7 (titles, bodies); there are no issues.

This document does not repeat secret values or personal contact details. Where a finding concerns one, it names the location only.

## Method

| Check | Tool | Result |
| --- | --- | --- |
| Gitleaks, full history | `gitleaks git --log-opts=--all --redact` (8.28.0, release SHA-256 verified) | No leaks. 39 non-merge commits scanned, about 876 KB. |
| Patterns gitleaks skips | `git log --all -m -p` (includes merge diffs) with patterns for emails, phone numbers, hosts, GitHub links, private keys, `password`/`token=`, private IP ranges, `.local` hosts | No secrets. Findings 1–3 below. |
| Files ever committed | `git log --all -m --name-only` | 97 paths. The gateway paths are all present on `main`. The `site/` tree, `review-serve.mjs` and `.github/workflows/check.yml` exist only on unmerged branches. No `.env` files, dumps, keys or archives. |
| Binary files | the three images and two font files on the site branches | Images are AI-generated illustrations, documented with their prompts in `site/docs/asset-requests.md` on those branches (no faces, no real businesses). No EXIF, XMP, GPS or authoring metadata. Fonts are the OFL-licensed Schibsted Grotesk with its license file. |
| Identities | `git log --all --format='%an %ae %cn %ce'` | Automation identities (`Claude <noreply@anthropic.com>`, `Codex <codex@example.test>`, `Codex <codex@users.noreply.github.com>`), `dependabot[bot]`, and finding 1. |
| Phone numbers | pattern scan | Only `+46701740605` and `+46701740699`, the bounds of the PTS range reserved for fiction. |
| Emails in content | pattern scan | Only `@example.test` addresses and the automation identities above. |
| Hosts | pattern scan | Loopback, `*.example.test`, `fixture.invalid`, `booking-lab.example`, GitHub, the npm registry, `usp-protocol.dev`, GNU/FSF, PTS, Keep a Changelog, SemVer, SIL (font license). |
| Third-party names | pattern scan | No booking-product competitors. Assistant names appear on the site branches as clients the product works with. A payment brand was removed from a concept card on a site branch (commit `012ae9e`). |
| Pull request pages | GitHub REST API, pull requests 1–7 | No emails, phone numbers or secrets. Dependabot bodies link to upstream changelogs. Pull request 1 is written in Swedish. |
| Dependencies | `npm audit --audit-level=low`, `npm audit signatures` | 0 vulnerabilities. |

## Findings

| # | Severity | Finding | Recommendation |
| --- | --- | --- | --- |
| 1 | **Medium, owner decision** | Four merge commits created by the GitHub web UI carry the owner's personal email address as author, not the GitHub noreply address. Two are on `main` (`835a0d0`, merge of pull request 2; `fad5799`, merge of pull request 7). Two are GitHub-generated `refs/pull/1/merge` and `refs/pull/6/merge`. | Removing the address from `main` requires rewriting history, which needs the owner's decision. See [options](#options-for-finding-1). Either way, turn on "Keep my email addresses private" and "Block command line pushes that expose my email" in the owner's GitHub email settings before the next merge. |
| 2 | Low | Unmerged branches `site/landing`, `site/landing-iteration-3-fable`, `site/salon-page` (pull request 1) and `feat/landing-page` (pull request 6) hold landing-page work unrelated to the gateway: Swedish text, an agent instruction naming the owner by first name, and AI-generated images. Pull request 1's description is in Swedish. | Move that work to the repository that will host the website, then close pull requests 1 and 6 and delete the four branches before publication. Note that GitHub keeps `refs/pull/<n>/head` for closed pull requests. Starting the public repository fresh (option B) avoids carrying them. |
| 3 | Low | History on `main` (`8a018b6`..`e1830fe`) links to the former private salon repository under the owner's account, including a branch name. It reveals the handle and the old repository name, no content. | Keep. The handle is public through the repository URL. Current files point at `Cresavo/cresavo`. |
| 4 | Info | The README and `NOTICE` name the upstream commit `6f5d143e…` of the salon repository as the source of adapted schemas. | Keep: it is the AGPL provenance record. |
| 5 | Info | Stale branches `chore/prepare-public-release`, `docs/public-readiness` (both merged), `fix/gateway-service-auth`, `night/gateway-salon-integration` and `docs/separate-customer-consent-contract` (superseded by `main`). | Delete after the owner confirms nothing on them is still needed. No sensitive content. |
| 6 | Info | Open Dependabot pull request 3 bumps the image to Node 26, while the supported runtime is Node 24. | Close it. `dependabot.yml` now ignores major Node image updates. Pull requests 4 and 5 (checkout, setup-node) can be merged after review. |

### Options for finding 1

| Option | What happens | History rewrite | Force-push |
| --- | --- | --- | --- |
| A. Accept | Transfer or publish as is. The address stays visible in two `main` merge commits. | No | No |
| B. Fresh public repository | Create an empty `Cresavo/gateway`. Push a `main` whose two merge commits are re-authored with the noreply address (for example with `git filter-repo --mailmap`). Keep this private repository archived. Pull requests, branches and `refs/pull/*` are not carried over. | Yes, on a new repository only | No (first push into an empty repository) |
| C. Rewrite in place | Rewrite `main` here, then transfer. `835a0d0` and every later commit on `main` get new IDs. Open pull requests break, and `refs/pull/*` still hold the old commits. | Yes | Yes |

Recommendation at the time of the audit: **B**. Nothing has been rewritten or force-pushed.

**Status update:** the repository has since been transferred and made public as `Cresavo/gateway`, so option A applies in practice. The address in `835a0d0` and `fad5799` is public. A rewrite now (option C) would not take it back from clones, forks, mirrors or GitHub's own `refs/pull/*`, and it would break every open pull request. It is not recommended. What remains is preventing new exposure: the email privacy settings above, and squash merges in the web UI only after those settings are on.

## Conclusion

No secrets anywhere in history. One personal-data finding (1); the repository is now public, so it is accepted (see the status update). Branch cleanup (2, 5) is the owner's action. The CI `secret-scan` job repeats the full-history gitleaks scan on every pull request.
