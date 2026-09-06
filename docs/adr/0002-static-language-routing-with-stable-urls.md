# Static language routing with stable URLs

The site serves English, German, and Spanish at stable, directly addressable
URLs (`/en/…`, `/de/…`, `/es/…`, including the default locale in the prefix)
and deliberately performs no automatic language or region detection — no IP,
geo-location, `Accept-Language`, or browser-language redirects, neither at
build time nor via client-side JS. The only redirect is the fixed root
redirect `/` → `/en/`, implemented as a real 301 in Cloudflare Pages
`public/_redirects` (Astro's static `redirects` config would only emit a
meta-refresh page without a status code, since there is no adapter). Every
published language version is self-canonical and linked to its published
siblings via reciprocal `hreflang`; `x-default` is omitted while `/` is a
pure redirect stub.

## Why

- Googlebot crawls predominantly from the US; IP- or `Accept-Language`-based
  redirects risk hiding localized pages from Google entirely. `hreflang`
  exists precisely so Google can pick the right version itself.
- Static hosting cannot negotiate `Accept-Language` server-side; a "smart"
  redirect would mean client-side JS — worse for crawlers and unstable URLs.
- Generic language codes (`en`, `de`, `es` — not `en-US`/`es-ES`) keep each
  version addressable for the whole language audience; only date formatting
  uses explicit locales (`de-DE`).

## Consequences

- Every visitor lands on `/en/` first, regardless of browser settings;
  language switching is manual via the language switcher.
- Local `astro dev` / `astro preview` does not redirect `/` (no `_redirects`
  support outside Cloudflare) — documented in `docs/local-development.md`.
- If `/` ever becomes a real language selector page, revisit `x-default`.

## Inspiration & References

- Google Search Central Community, "Why 'avoid automatic redirection' when
  hreflang exists?" — let Google crawl stable per-language URLs; geo- or
  language-based redirects risk making pages invisible:
  https://support.google.com/webmasters/thread/151197680
- Google Search Central Blog, "Introducing 'x-default hreflang' for
  international pages":
  https://developers.google.com/search/blog/2013/04/x-default-hreflang-for-international-pages
- Astro Docs — Internationalization (i18n) Routing (`prefixDefaultLocale`)
  and Routing → Redirects (static builds emit meta-refresh pages):
  https://docs.astro.build/en/guides/internationalization/
  https://docs.astro.build/en/guides/routing/
- Cloudflare Pages Docs — Redirects (`_redirects` in the static asset
  directory, rules take precedence over static assets):
  https://developers.cloudflare.com/pages/configuration/redirects/
