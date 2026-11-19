# Publication audit

Audit of the full Git history before the repository becomes public as `Cresavo/gateway`.

- Date: 2026-11-19
- Scope: all refs (`git rev-list --all`): 4 commits on `main`, no tags, no stashes, no other branches.
- Commits audited: `8a018b6`, `a239275`, `b37d414`, `e1830fe`.

## Method

| Check | Tool | Result |
| --- | --- | --- |
| Secret patterns over every patch in history | `git log --all -p` with regular expressions for private keys, cloud keys, GitHub/Slack/LLM tokens, JWTs, 40+ character hex and base64 runs | No secrets. The only long hex value is the upstream source commit ID in the README. |
| Gitleaks, full history | `gitleaks git --log-opts=--all` | **Not run in this session**: downloading the binary was blocked. CI runs it on every push with full history (`fetch-depth: 0`), see `.github/workflows/ci.yml`. The first CI run on the pull request is the authoritative gitleaks result. |
| Files ever committed | `git log --all --name-only` | 15 files, all still present. No deleted files, `.env` files, dumps or binaries in history. |
| Author and committer identities | `git log --format='%an %ae %cn %ce'` | `Codex <codex@example.test>` and `Codex <codex@users.noreply.github.com>`. No personal email addresses. |
| URLs | every URL in history | loopback, `example.test`, npm registry, usp-protocol.dev, GNU/FSF license links, and the private repository URL below. |
| Personal or customer data | manual review of tests, OpenAPI examples, discovery text | Fictional data only: "Salong Eko (synthetic demo)", `@example.test` addresses, `demo` business. No names, phone numbers or addresses of real people. |
| Dependencies | `npm audit` | 0 vulnerabilities. |

## Findings

| # | Severity | Finding | Action |
| --- | --- | --- | --- |
| 1 | Low | README in history (`8a018b6`..`e1830fe`) links to the former private salon repository `niclasvestlund-YT/booking-lab-se`, including the branch name `refactor/gateway-provider-split`. It reveals the owner's GitHub handle and the former repository name, no content. | Current README now points at `Cresavo/cresavo`. History keeps the old link. The owner's handle is already public through the repository URL itself, so no history rewrite is recommended. |
| 2 | Info | README in history states the upstream source commit `6f5d143e…` in `booking-lab-se`. | Kept: it is the provenance record for AGPL code reuse. It resolves in `Cresavo/cresavo` if that history was carried over. |
| 3 | Info | Commit authors are an automation identity, not the owner. | No action needed. Future commits should use the GitHub noreply address. |

## Conclusion

No secrets and no personal data found in history. **No history rewrite is needed**, and none was done. The gitleaks CI job must pass on the pull request before the repository is made public. If it reports a finding, stop and decide with the owner before any rewrite.
