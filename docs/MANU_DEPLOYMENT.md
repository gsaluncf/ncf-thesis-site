# Manu's static dashboard workflow

This public repository contains the static NCF Senior Thesis Support Dashboard,
the Ask Rooty browser interface, and the automated Cloudflare Pages deployment.
It does not contain the private assistant service, the thesis corpus, model keys,
Cloudflare credentials, or student conversations.

## Normal content update

1. Make the dashboard content change in the source dashboard repository.
2. Open a pull request here with the refreshed compiled snapshot and its updated
   `upstream-manifest.json`.
3. Wait for the unit, browser, accessibility, 404, and link checks to pass.
4. Review the Cloudflare preview URL shown by the deployment.
5. Merge the pull request into `main`.

The `main` branch deploys to the Cloudflare Pages project named
`ncf-thesis-site`. No one needs a Cloudflare key on a laptop. The deployment
uses protected GitHub environment secrets.

## Refresh the pinned upstream snapshot

The current snapshot is pinned to the repository and commit listed in
`UPSTREAM.md` and `upstream-manifest.json`. After updating the pinned commit in
`scripts/import-upstream.mjs` and its matching test, run:

```powershell
npm ci
npm run import:upstream
npm test
npm run test:e2e
npm run check:links
```

Commit the regenerated dashboard files, manifest, and the new pin in one pull
request. Do not edit the minified files in `assets/` by hand. The build applies
the Rooty integration, Lucide icons, repaired links, security headers, and the
custom 404 page after the snapshot is imported.

## Changes that belong in this repository

- Static dashboard content and downloadable handouts
- Images and other public assets
- Hero and Ask Rooty presentation
- Link repairs and accessibility improvements
- The Pages workflow and static tests

Changes to retrieval, model instructions, the NCF corpus, authentication, rate
limits, or retention belong in the private assistant repository. Ask the site
administrator to make those changes.

## What happens after a merge

GitHub Actions installs the locked dependencies, runs every test, builds
`dist/`, and deploys only that directory. Cloudflare Access remains in front of
the production site and only permits users with an `ncf.edu` identity. A failed
test stops the deployment and leaves the previous Pages version active.
