import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Badge from '../../src/components/Badge.astro';
import BrandOwl from '../../src/components/BrandOwl.astro';
import Button from '../../src/components/Button.astro';
import ContentCard from '../../src/components/ContentCard.astro';

describe('Button', () => {
  it('renders an anchor when href is given', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { href: '/en/articles/' },
      slots: { default: 'Browse all' },
    });
    expect(html).toContain('<a');
    expect(html).toContain('href="/en/articles/"');
    expect(html).not.toContain('<button');
    expect(html).toContain('Browse all');
  });

  it('renders a submit-safe button without href', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { variant: 'ghost' },
      slots: { default: 'Learn more' },
    });
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).not.toContain('<a ');
    expect(html).toContain('button--ghost');
  });
});

describe('Badge', () => {
  it('renders the glowing dot by default and slot content', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, {
      slots: { default: 'Sep 2026' },
    });
    expect(html).toContain('badge__dot');
    expect(html).toContain('badge--default');
    expect(html).toContain('Sep 2026');
  });

  it('omits the dot and applies the accent variant on demand', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, {
      props: { dot: false, variant: 'accent' },
      slots: { default: 'Beta' },
    });
    expect(html).not.toContain('badge__dot');
    expect(html).toContain('badge--accent');
    expect(html).toContain('Beta');
  });
});

describe('BrandOwl', () => {
  it('is decorative by default: aria-hidden, no role, no title', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BrandOwl, { props: {} });
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain('<title');
    expect(html).toContain('viewBox="0 0 200 200"');
  });

  it('exposes role="img" with an accessible name when decorative is false', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BrandOwl, {
      props: { decorative: false, title: 'Wireframe owl' },
    });
    expect(html).toContain('role="img"');
    expect(html).toContain('<title');
    expect(html).toContain('Wireframe owl');
    expect(html).not.toContain('aria-hidden="true"');
  });
});

describe('ContentCard', () => {
  it('renders slot content without a caption by default', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ContentCard, {
      slots: { default: '<p>Card body</p>' },
    });
    expect(html).toContain('content-card');
    expect(html).toContain('Card body');
    expect(html).not.toContain('content-card__caption');
  });

  it('renders the caption below the content when provided', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ContentCard, {
      props: { caption: 'latest' },
      slots: { default: '<p>Card body</p>' },
    });
    expect(html).toContain('content-card__caption');
    expect(html).toContain('latest');
  });
});
