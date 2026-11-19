# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub: **Security → Report a vulnerability** on this repository (private vulnerability reporting). Include what you found, how to reproduce it with fictional data, and the impact you expect.

We aim to acknowledge reports within 3 working days and to agree on a fix and disclosure date with you. Please give us reasonable time to fix the problem before public disclosure.

## Scope

In scope: this gateway (REST v1, MCP, discovery, forwarding, rate limits, configuration).
Salon-side issues (database, consent page, mandates, agent credential issuing) belong to [Cresavo](https://github.com/Cresavo/cresavo); report them there the same way.

Testing rules:

- Use only your own local setup or the public demo with fictional data.
- No denial-of-service testing, no social engineering, no real personal data.
- Never try to use or keep credentials that are not yours.

## Supported versions

Only the latest release and `main` receive security fixes.

The threat model is in [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).
