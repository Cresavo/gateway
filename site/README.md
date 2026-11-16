# Booking Lab Gateway: marketing site

A static Next.js (App Router) site for the gateway, kept separate from the gateway service.
It has no API routes, no server-side data access, no credentials and no analytics. It never
calls the gateway or the salon provider. Every page is prerendered at build time.

```
site/
  app/            layout, landing page, /docs, OG image, icon, robots, sitemap, 404
  components/     header, hero, how-it-works diagram, sections, code tabs
  lib/content.ts  every product claim and maturity label (audit this file)
  lib/examples.ts code examples, matching openapi.yaml and src/mcp-inputs.js
  scripts/sync-contract.mjs  copies ../openapi.yaml to public/openapi.yaml
```

The gateway's `openapi.yaml` is the source of truth. `npm run dev` and `npm run build` copy it
to `public/openapi.yaml`. The committed copy is only a fallback for builds that can't read
files outside `site/`.

## Run locally

Requires Node 22.12+ (CI uses Node 24).

```bash
cd site
npm ci
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm start
```

## Deploy on Vercel

Nothing has been connected or deployed. When you are ready:

1. Create a Vercel project from this repository and set **Root Directory** to `site`.
   Leave "Include files outside the Root Directory" on (it is on by default) so the contract sync can read `../openapi.yaml`.
2. Framework preset **Next.js**, install command `npm ci`, build command `npm run build`. Node.js 24.x.
3. Optional: set `NEXT_PUBLIC_SITE_URL` (e.g. `https://booking-lab.example`) for canonical and Open Graph URLs.
   Without it the site uses Vercel's own production or preview URL.
4. No secrets or other environment variables are needed. Don't add booking credentials to this project.
5. Optional: under Git settings, add an "Ignored Build Step" such as `git diff --quiet HEAD^ HEAD -- . ../openapi.yaml`
   so gateway-only commits don't trigger a site build.

The gateway itself stays a separate Node process. Don't move it into Vercel functions.

## Content rules

- If the code or docs don't prove a capability, label it `experimental` or `planned` in `lib/content.ts`.
- No partner logos, testimonials, usage numbers or invented endpoints.
- Server-generated values in examples stay as `<placeholders>`.
- Both source repositories are private, so the site links to no GitHub pages. Visitors would see 404s.

Licensed AGPL-3.0-only, like the rest of the repository.
