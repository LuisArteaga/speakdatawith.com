import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

/** All files under src/, as repo-relative POSIX paths. */
function listSrcFiles(): string[] {
  const srcRoot = join(repoRoot, 'src');
  const entries = readdirSync(srcRoot, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join('src', relative(srcRoot, join(entry.parentPath, entry.name)))
        .split('\\')
        .join('/'),
    );
}

const REQUIRED_TOKENS = [
  '--color-bg',
  '--color-surface',
  '--color-surface-elevated',
  '--color-text',
  '--color-text-muted',
  '--color-primary',
  '--color-primary-light',
  '--color-primary-subtle',
  '--color-accent',
  '--color-signal',
  '--color-border',
  '--color-border-active',
  '--color-border-accent',
  '--font-sans',
  '--font-mono',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--shadow-card',
  '--glow-primary',
  '--glow-accent',
  '--transition-fast',
  '--transition-slow',
];

/** Color literals: 3/4/6/8-digit hex plus rgb()/rgba()/hsl()/hsla() notation. */
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/;

describe('design tokens', () => {
  it('tokens.css defines every mandated design token', () => {
    const css = readRepoFile('src/styles/tokens.css');
    for (const token of REQUIRED_TOKENS) {
      expect(css.includes(`${token}:`), `missing token ${token}`).toBe(true);
    }
  });
});

describe('token-only component styling', () => {
  it('color literals appear only inside the BrandOwl SVG markup', () => {
    // Scans EVERY .astro file under src/ (page-level <style> blocks
    // included), not just src/components.
    const astroFiles = listSrcFiles().filter((path) =>
      path.endsWith('.astro'),
    );
    expect(astroFiles.length).toBeGreaterThan(0);
    for (const path of astroFiles) {
      const content = readRepoFile(path);
      const isBrandOwl = path.endsWith('BrandOwl.astro');
      const scanned = isBrandOwl
        ? // The canonical SVG markup keeps two pure-white glint highlights
          // (no token exists) and two subtle rgba surface fills; everything
          // outside the <svg> element (frontmatter, scoped style) must be
          // literal-free.
          content.replace(/<svg[\s\S]*<\/svg>/, '')
        : content;
      expect(
        COLOR_LITERAL.test(scanned),
        `${path} uses color literals`,
      ).toBe(false);
    }
  });
});

describe('static-only styling stack', () => {
  it('no client: directives are used anywhere in src/', () => {
    const offenders = listSrcFiles().filter((path) =>
      readRepoFile(path).includes('client:'),
    );
    expect(offenders, `client directives in ${offenders.join(', ')}`).toEqual(
      [],
    );
  });

  it('no Google Fonts CDN references are used anywhere in src/', () => {
    const offenders = listSrcFiles().filter((path) =>
      readRepoFile(path).includes('fonts.googleapis'),
    );
    expect(offenders, `CDN fonts in ${offenders.join(', ')}`).toEqual([]);
  });
});
