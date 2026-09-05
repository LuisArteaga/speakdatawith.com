# Image guidelines

## Where images live

| Location | Purpose | Processing |
| --- | --- | --- |
| `src/assets/brand/` | Logo, brand material, reused site assets | Optimized by Astro's asset pipeline |
| `src/assets/images/` | Article images referenced from articles | Optimized by Astro's asset pipeline |
| `src/content/articles/<slug>/` | Colocated article images (screenshots, diagrams) | Optimized by Astro's asset pipeline |
| `public/` | Only assets that must be served verbatim under a stable URL (favicon, downloads, explicitly public JSON) | Copied unchanged |

Images under `src/` are imported and rendered through Astro's pipeline
(`Figure.astro` or `astro:assets`' `Image`), which determines intrinsic
width and height, converts to efficient formats, and prevents layout shift.
Never reference `src/` images by URL string; import them.

## Recommended formats

- **Diagrams and screenshots (UI)**: PNG or SVG source; Astro converts raster
  images to efficient formats at build time.
- **Photos**: JPG/JPEG or WebP source.
- **Icons and simple graphics**: SVG (committed as source, not base64).

Avoid GIFs for anything but genuinely animated content; prefer a video
facade instead of large animated files.

## Recommended maximum dimensions

- Article body images: max. 2000 px on the long edge.
- Screenshots: capture at 1x or 2x, crop to the relevant region; avoid
  full-desktop screenshots when a window crop suffices.
- Anything much larger should be downscaled before committing; the pipeline
  optimizes delivery, it does not fix oversized sources.

## Alt text rules

- `alt` is mandatory in `Figure.astro`; there is no way to render an image
  without it.
- Describe the information the image conveys, not its appearance:
  "Pipeline failing at the dbt test step", not "Screenshot".
- Decorative images (e.g. a video poster inside a button) use `alt=""`,
  which the components set themselves.
- Avoid starting with "Image of" or "Screenshot of"; screen readers already
  announce the element type.

## Metadata and privacy

- Strip EXIF metadata before committing images, or export without metadata
  from the capture tool. Astro's
  optimization pipeline also drops most metadata at build time, but the
  source file in the repository must be clean already.
- Screenshots must not contain personal data: no real names, e-mail
  addresses, IP addresses, account IDs, tokens, or customer data. Use
  demo data or redact before committing.
- Never screenshot or commit secrets: API keys, connection strings,
  `.env` contents, tokens in URLs. Check a screenshot the same way you
  would check a diff for secrets.

## `src/assets` vs `public`

- Use `src/assets/` (or colocated folders under `src/content/articles/`)
  for anything that benefits from optimization, intrinsic dimensions, or
  cache-busting hashed URLs — that is almost everything.
- Use `public/` only when the file must keep a stable, predictable URL and
  be served byte-for-byte (favicon, downloadable files). Files in `public/`
  are copied unchanged into `dist/` and are not optimized.

## Embedding in an article

Use MDX (`.mdx`) and `Figure.astro`:

```mdx
import Figure from '../../components/Figure.astro';
import poster from './my-image.png';

<Figure src={poster} alt="What the alt text must say" caption="Optional caption" />
```

`Figure.astro` renders a semantic `<figure>`/`<figcaption>`, requires the
alt text, and produces a responsive image that cannot overflow its
container.
