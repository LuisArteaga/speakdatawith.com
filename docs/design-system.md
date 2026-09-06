# Design System v1

The site's visual language is built from design tokens (CSS custom
properties), a canonical brand asset, and three base components. Plain CSS
only — no Tailwind, no Sass, no CSS-in-JS, no UI framework, and no
`client:` directives (every component in this system is purely static;
interactions are CSS-only).

## Design Tokens

`src/styles/tokens.css` is the single source of truth for colors,
typography, radii, shadows/glow, and motion. It is imported by
`BaseLayout.astro` before `src/styles/global.css`, which holds only
structural base styles (layout, header/footer, code blocks, reduced-motion
guard). `global.css` keeps the layout-scale tokens `--content-width` and
`--spacing-1..3`.

Rules:

- Component styles use token references exclusively — no hex or rgba
  literals in `.astro` files. The only exception is the SVG markup of
  `BrandOwl.astro` (its two pure-white glint highlights have no token).
- `--color-signal` (cyan) is reserved for technical labels, nodes, and
  status indicators — never for surfaces or buttons.
- Every file with transitions/animations carries a
  `prefers-reduced-motion: reduce` block.

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

## Extending

- New visual values belong in `tokens.css` first; components reference
  tokens only.
- New components: Astro scoped `<style>` in the component file, tokens for
  every color/radius/shadow/transition value, a `prefers-reduced-motion`
  block when the component transitions anything.
- `tests/design-tokens.test.ts` enforces token completeness and the
  token-only styling rule as part of `npm test`.
