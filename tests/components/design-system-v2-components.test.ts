import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/Hero.astro';
import SectionHeading from '../../src/components/SectionHeading.astro';

// Assertions here stick to the public contract: rendered text, HTML tags,
// and documented hooks/attributes (owl-interactive container class, the
// system caption, BrandOwl's decorative default). Internal scoped class
// names of the components are deliberately not pinned.

describe('Hero', () => {
  it('renders the title as the only h1 and wires the section label', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
    });
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toContain('aria-labelledby="hero-heading"');
    expect(html).toMatch(/<h1[^>]*id="hero-heading"/);
    expect(html).toContain('SpeakDataWith');
  });

  it('renders the default decorative owl card with the system caption', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
    });
    expect(html).toContain('owl-interactive');
    expect(html).toContain('[SYSTEM.OWL_INTELLIGENCE_ACTIVE]');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="180"');
  });

  it('renders no CTAs and no description paragraph with only a title', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
    });
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<button');
    // Attribute-tolerant paragraph count: the default visual's caption is
    // the only <p>, so an (empty) description paragraph would make it two.
    expect((html.match(/<p[\s>]/g) ?? []).length).toBe(1);
  });

  it('renders exclusively the visual slot content when provided', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: 'SpeakDataWith' },
      slots: { visual: '<img src="/media/hero.png" alt="Hero visual" />' },
    });
    expect(html).toContain('<img src="/media/hero.png" alt="Hero visual" />');
    expect(html).not.toContain('[SYSTEM.OWL_INTELLIGENCE_ACTIVE]');
    expect(html).not.toContain('owl-interactive');
    expect(html).not.toContain('aria-hidden="true"');
  });

  it('renders badge, description, and both CTA links when fully specified', async () => {
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
    expect(html).toContain('DATA VAULT 2.0');
    expect(html).toContain('Patterns, pitfalls, and best practices.');
    expect(html).toContain('Read article');
    expect(html).toContain('href="/en/articles/bitemporal/"');
    expect(html).toContain('About');
    expect(html).toContain('href="/about/"');
    expect((html.match(/<a /g) ?? []).length).toBe(2);
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
    expect(halfSecondary).toContain('href="/en/articles/"');
    expect(halfSecondary).not.toContain('href="/about/"');
    expect(halfSecondary).not.toContain('<button');
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
    expect(h3).toContain('Related');
  });

  it('renders the optional eyebrow text above the title', async () => {
    const container = await AstroContainer.create();
    const withEyebrow = await container.renderToString(SectionHeading, {
      props: { title: 'Latest articles', eyebrow: 'Technical note' },
    });
    expect(withEyebrow).toContain('Technical note');
    expect(withEyebrow).toContain('Latest articles');

    const withoutEyebrow = await container.renderToString(SectionHeading, {
      props: { title: 'Latest articles' },
    });
    expect(withoutEyebrow).not.toContain('Technical note');
  });

  it('binds the id to the heading element for aria-labelledby wiring', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionHeading, {
      props: { title: 'All articles', id: 'articles-list-heading' },
    });
    expect(html).toMatch(/<h2[^>]*id="articles-list-heading"/);
  });
});
