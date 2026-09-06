# Design System

The site's visual language is built from design tokens (CSS custom
properties), a canonical brand asset, and base components. Plain CSS
only — no Tailwind, no Sass, no CSS-in-JS, no UI framework, and no
`client:` directives (every component in this system is purely static;
interactions are CSS-only).

v1 established the tokens and the base components (`BrandOwl`, `Badge`,
`Button`, `ContentCard`); v2 adds the composition layer for pages:
`Hero` and `SectionHeading`, built exclusively from the v1 parts.

## Design Tokens

`src/styles/tokens.css` is the single source of truth for colors,
typography, radii, shadows/glow, and motion. It is imported by
`BaseLayout.astro` before `src/styles/global.css`, which holds only
structural base styles (layout, header/footer, code blocks, reduced-motion
guard). `global.css` keeps the layout-scale tokens `--content-width`,
`--content-width-wide`, and `--spacing-1..4`.

Rules:

- Component styles use token references exclusively — no hex, rgb()/rgba(),
  or hsl()/hsla() literals in `.astro` files. The only exception is the SVG
  markup of `BrandOwl.astro`: its two pure-white glint highlights (no token
  exists for pure white) and two subtle rgba surface fills are part of the
  canonical, unchangeable SVG. `tests/design-tokens.test.ts` enforces this
  for every `.astro` file under `src/`.
- `--color-signal` (cyan) is reserved for technical labels, nodes, and
  status indicators — never for surfaces or buttons.
- Every file with transitions/animations carries a
  `prefers-reduced-motion: reduce` block.
- The token set is the fixed v1 contract from the design-system issue.
  `--radius-md` currently has no consumer by design: it was provisioned by
  v1 for the hero work and stays in the set for the upcoming 3D visual
  container (the v2 hero itself uses `ContentCard` with `--radius-lg` for
  its default visual).

Fonts are self-hosted via `@fontsource/space-grotesk` (400/600/700) and
`@fontsource/fira-code` (400/600); the per-weight CSS files are imported in
`BaseLayout.astro`. No Google-Fonts CDN, no external `@import`.

## BrandOwl

Canonical owl brand asset (`src/components/BrandOwl.astro`). The SVG
geometry is fixed; colors map to tokens via the classes `.owl-mesh-line`
(stroke `--color-primary`), `.owl-accent-line` (stroke `--color-accent`),
`.owl-node` (fill `--color-primary`), `.owl-eye-outer` (stroke
`--color-accent`, fill `--color-surface`), `.owl-eye-pupil` (fill
`--color-signal`), and the beak (fill `--color-accent`).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number` | `200` | Square edge length in pixels. |
| `decorative` | `boolean` | `true` | `true` → `aria-hidden="true"`; `false` → `role="img"` plus a `<title>`. |
| `title` | `string` | `"SpeakDataWith owl logo"` | Accessible name, only rendered when `decorative` is `false`. |

Hover interactions activate only inside a container with the class
`owl-interactive`: mesh lines brighten to `--color-primary-light` with full
opacity, nodes and eyes switch to `--color-signal` with a glow, pupils scale
to 1.3. All animations and transitions are disabled under
`prefers-reduced-motion: reduce`.

```astro
<div class="hero owl-interactive">
  <BrandOwl size={180} />
</div>
```

## Badge

Pill-shaped monospace label for technical metadata.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `dot` | `boolean` | `true` | Glowing accent dot in front of the content. |
| `variant` | `'default' \| 'accent'` | `'default'` | `accent` uses the accent-tinted border token. |

Content is passed via slot.

```astro
<Badge>{formatArticleDate(publishedAt, locale)}</Badge>
<Badge variant="accent">Beta</Badge>
```

## Button

Action element: renders `<a>` when `href` is set, otherwise
`<button type="button">`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `href` | `string` | — | Renders as a link when set. |
| `variant` | `'primary' \| 'ghost'` | `'primary'` | Primary: brand gradient with `--glow-primary`; ghost: transparent with token border. |

Hover lifts the button by 2px and intensifies the glow (disabled under
`prefers-reduced-motion: reduce`). The `:focus-visible` ring uses
`--color-signal` with `outline-offset: 2px`.

```astro
<Button href="/en/articles/">Browse all</Button>
<Button variant="ghost">Learn more</Button>
```

## ContentCard

Bordered surface for content groupings. Hover changes border
(`--color-border-active`) and shadow (`--glow-accent`) only — cards never
move.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `caption` | `string` | — | Optional monospace caption (`--color-signal`) below the content. |

Content is passed via slot.

```astro
<ContentCard caption="latest">
  <h2><a href="/en/articles/some-article/">Title</a></h2>
  <p>Short description.</p>
</ContentCard>
```

## Hero

Landing hero (`src/components/Hero.astro`): a text column (badge, h1,
description, CTAs) plus a visual column, composed exclusively from the v1
components — `Badge`, `Button`, `ContentCard`, `BrandOwl` — with the layout
styles scoped to the component.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `badge` | `string` | — | Optional badge text above the title (rendered with the glowing dot). |
| `title` | `string` | — | H1 text; the hero renders the page's only `<h1>`. |
| `description` | `string` | — | Optional excerpt below the title. |
| `ctaText` / `ctaHref` | `string` | — | Primary CTA; rendered only when both are set. |
| `secondaryText` / `secondaryHref` | `string` | — | Secondary (ghost) action; rendered only when both are set. |
| slot `visual` | — | owl card | Named slot for the visual column. |

Layout: CSS grid, mobile single column with the visual below the text, two
columns `1.2fr 0.8fr` with a 3rem gap (`--spacing-4`) and vertical centering
from 900px; the hero caps at `--content-width-wide` (1150px). The default
`<main>` width is the prose width, so landing pages opt into the wide layout
with `<BaseLayout wide>` (renders `main--wide`). The h1 sizes 2.4rem mobile /
3.2rem from 900px (`font-weight: 700`, `line-height: 1.18`,
`letter-spacing: -0.02em`); the description is muted at 1.1rem with a 600px
max-width. The `<section>` binds `aria-labelledby` to the h1.

The default visual is the decorative owl inside a `ContentCard` with the
caption `[SYSTEM.OWL_INTELLIGENCE_ACTIVE]`, hover-interactive via the
`owl-interactive` container class. When the `visual` slot is provided, only
the slot content renders. The slot stays deliberately generic so a later 3D
element can replace the owl without any change to `Hero.astro`:

```astro
<Hero
  title="SpeakDataWith"
  description={dict.homeIntro}
  ctaText={dict.homeBrowseAll}
  ctaHref={`/${locale}/articles/`}
>
  <img slot="visual" src="/media/hero-visual.png" alt="Alternative visual" />
</Hero>
```

## SectionHeading

Pure typographic heading for sections below the hero: an optional monospace
eyebrow (signal color, uppercase) plus an h2 or h3 title. No background, no
border. The optional `id` lets a surrounding section bind `aria-labelledby`
to the heading.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow` | `string` | — | Optional uppercase monospace label above the title. |
| `title` | `string` | — | Heading text. |
| `level` | `2 \| 3` | `2` | Renders `<h2>` (default) or `<h3>`. |
| `id` | `string` | — | DOM id on the heading (aria-labelledby target). |

```astro
<section aria-labelledby="latest-articles-heading">
  <SectionHeading id="latest-articles-heading" title={dict.homeLatest} />
  <!-- section content -->
</section>
```

## Extending

- New visual values belong in `tokens.css` first; components reference
  tokens only.
- New components: Astro scoped `<style>` in the component file, tokens for
  every color/radius/shadow/transition value, a `prefers-reduced-motion`
  block when the component transitions anything.
- `tests/design-tokens.test.ts` enforces token completeness and the
  token-only styling rule as part of `npm test`.
