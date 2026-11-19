# Contributing

Thanks for helping. This gateway sits between AI assistants and salons, so small changes can have security effects. Please read [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) first.

## Ground rules

- Everything in the repository is in English.
- Fictional data only: `@example.test` emails, the demo salon, phone numbers from ranges reserved for fiction. Never real customers, staff or salons.
- No secrets in Git, issues, logs or test output. Tests generate their own random tokens.
- The gateway stores nothing and decides nothing about bookings. Logic about prices, consent, mandates or scheduling belongs in [Cresavo](https://github.com/Cresavo/cresavo).
- Do not rename env vars, routes, headers or tool names without a migration note in `CHANGELOG.md`.

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

Node 24 is the supported runtime.

## Pull requests

- One topic per pull request, with a short description of why.
- Add or update tests for every behavior change. Security-relevant changes need a test that fails without the change.
- Update `CHANGELOG.md` under "Unreleased".
- CI must be green: lint, typecheck, tests, end-to-end, secret scan and dependency audit.
- Pin new GitHub Actions by full commit SHA.

## Licensing

By contributing you agree that your contribution is licensed under AGPL-3.0-only. Add `// SPDX-License-Identifier: AGPL-3.0-only` at the top of new source files.
