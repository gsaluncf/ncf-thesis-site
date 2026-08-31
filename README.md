# NCF Senior Thesis Support Dashboard

This repository publishes the static student dashboard at
`thesis.ncfdatascience.com`. It preserves Manu López Zafra's dashboard and adds
a live Ask Rooty interface backed by a separate private API.

## Local verification

```powershell
npm ci
npm test
npm run test:e2e
npm run check:links
```

Run `npm run build` to create the exact Cloudflare Pages artifact in `dist/`.
The site stores the active chat only in browser memory. It does not use local
storage, session storage, analytics, or client-side telemetry.

See [UPSTREAM.md](UPSTREAM.md) for source provenance and
[docs/MANU_DEPLOYMENT.md](docs/MANU_DEPLOYMENT.md) for the static content and
deployment workflow.
