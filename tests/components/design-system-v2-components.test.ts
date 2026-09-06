import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/Hero.astro';
import SectionHeading from '../../src/components/SectionHeading.astro';

describe('Hero', () => {
  it('renders the title as the only h1 with section wiring', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
    });
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toContain('aria-labelledby="hero-heading"');
    expect(html).toContain('id="hero-heading"');
    expect(html).toContain('SpeakDataWith');
  });

  it('renders no badge, description, or actions by default', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
    });
    expect(html).not.toContain('badge');
    expect(html).not.toContain('hero__description');
    expect(html).not.toContain('hero__actions');
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<button');
  });

  it('renders the default owl visual with the system caption', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
    });
    expect(html).toContain('owl-interactive');
    expect(html).toContain('content-card');
    expect(html).toContain('[SYSTEM.OWL_INTELLIGENCE_ACTIVE]');
    expect(html).toContain('owl-svg');
  });

  it('renders only the visual slot content when the slot is provided', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
      slots: { visual: '<img src="/media/hero.png" alt="Hero visual" />' },
    });
    expect(html).toContain('<img src="/media/hero.png" alt="Hero visual" />');
    expect(html).not.toContain('[SYSTEM.OWL_INTELLIGENCE_ACTIVE]');
    expect(html).not.toContain('owl-interactive');
  });

  it('renders badge, description, and both CTAs when fully specified', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: {
        title: 'Bitemporal modeling',
        badge: 'DATA VAULT 2.0',
        description: 'Patterns, pitfalls, and best practices.',
        ctaText: 'Read article',
        ctaHref: '/en/articles/bitemporal/',
        secondaryText: 'About',
        secondaryHref: '/about/',
      },
    });
    expect(html).toContain('badge--default');
    expect(html).toContain('DATA VAULT 2.0');
    expect(html).toContain('hero__description');
    expect(html).toContain('button--primary');
    expect(html).toContain('href="/en/articles/bitemporal/"');
    expect(html).toContain('button--ghost');
    expect(html).toContain('href="/about/"');
  });

  it('omits a CTA when only one half of the pair is given', async () => {
    const container = await AstroContainer.create();
    const halfPrimary = await container.renderToString(Hero, {
      props: { title: 'T', ctaText: 'Read article' },
    });
    expect(halfPrimary).not.toContain('<a ');
    expect(halfPrimary).not.toContain('<button');

    const halfSecondary = await container.renderToString(Hero, {
      props: {
        title: 'T',
        ctaText: 'Read article',
        ctaHref: '/en/articles/',
        secondaryText: 'About',
      },
    });
    expect(halfSecondary).toContain('button--primary');
    expect(halfSecondary).not.toContain('button--ghost');
  });
});

describe('SectionHeading', () => {
  it('renders an h2 by default and an h3 on demand', async () => {
    const container = await AstroContainer.create();
    const h2 = await container.renderToString(SectionHeading, {
      props: { title: 'Latest articles' },
    });
    expect((h2.match(/<h2/g) ?? []).length).toBe(1);
    expect(h2).not.toContain('<h3');
    expect(h2).toContain('Latest articles');

    const h3 = await container.renderToString(SectionHeading, {
      props: { title: 'Related', level: 3 },
    });
    expect((h3.match(/<h3/g) ?? []).length).toBe(1);
    expect(h3).not.toContain('<h2');
  });

  it('renders the optional eyebrow above the title', async () => {
    const container = await AstroContainer.create();
    const withEyebrow = await container.renderToString(SectionHeading, {
      props: { title: 'Latest articles', eyebrow: 'section' },
    });
    expect(withEyebrow).toContain('section-heading__eyebrow');
    expect(withEyebrow).toContain('section');

    const withoutEyebrow = await container.renderToString(SectionHeading, {
      props: { title: 'Latest articles' },
    });
    expect(withoutEyebrow).not.toContain('section-heading__eyebrow');
  });

  it('binds the id to the heading element for aria-labelledby wiring', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionHeading, {
      props: { title: 'All articles', id: 'articles-list-heading' },
    });
    expect(html).toMatch(/<h2[^>]*id="articles-list-heading"/);
  });
});
