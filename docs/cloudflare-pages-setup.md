# Cloudflare Pages setup

These steps are performed manually in the Cloudflare dashboard. No step in
this repository configures Cloudflare automatically, and no automation
holds Cloudflare credentials.

## One-time setup

1. Open Cloudflare and go to **Workers & Pages → Create → Pages → Connect
   to Git**.
2. Authorize GitHub and select the repository `speakdatawith.com`.
3. In the build configuration, choose the framework preset **Astro**.
4. Set the **production branch** to `main`.
5. Build command:

   ```bash
   npm run validate
   ```

   This is the same gate as the repository CI: `astro check` (once), the
   Astro build, and the automated `dist/` leak check.

6. Output directory:

   ```text
   dist
   ```

7. Set the Node version to match `.nvmrc` (major version 22). Cloudflare
   Pages reads a `NODE_VERSION` environment variable or accepts the version
   in the build settings; use 22.
8. Connect the custom domain `speakdatawith.com` to the Pages project
   (Pages project → Custom domains).
9. Verify HTTPS is active for the domain and that `https://www.speakdatawith.com`
   redirects to the canonical domain `https://speakdatawith.com`.

## What Cloudflare publishes

- Cloudflare Pages publishes exactly the contents of `dist/`: HTML, CSS,
  the small click-to-load script, and optimized images. The leak check
  (`npm run check:dist`, the last step of `npm run validate`) fails the
  build automatically when `dist/` contains anything that must not go
  public (`.env` files, `.git`/`.github`/`docs` directories, Markdown
  sources, source maps). For a full listing you can still run
  `find dist -type f | sort` locally.
- Images need no separate hosting service; they are built into `dist/` by
  Astro's asset pipeline.
- Files in `public/` are copied into `dist/` unchanged and served verbatim
  under a stable URL (currently: `favicon.svg`, `robots.txt`).
- Pull-request previews are built for every PR and can be publicly
  reachable under `<hash>.<project>.pages.dev`. Therefore: never push
  confidential drafts or unpublished personal data to a branch, because a
  preview of that branch would expose them.
- The production build requires no secrets; the Pages project needs none
  either.

## Analytics

Cloudflare Web Analytics can be enabled later from the Cloudflare dashboard
without adding any third-party script to the site. This repository ships no
analytics scripts.

## Scope of automation

Do not attempt to configure Cloudflare programmatically without explicit
credentials. All steps above are manual by design.
