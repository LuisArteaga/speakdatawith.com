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

const HEX_COLOR = /#[0-9a-fA-F]{6}\b/;

describe('design tokens', () => {
  it('tokens.css defines every mandated design token', () => {
    const css = readRepoFile('src/styles/tokens.css');
    for (const token of REQUIRED_TOKENS) {
      expect(css.includes(`${token}:`), `missing token ${token}`).toBe(true);
    }
  });
});

describe('token-only component styling', () => {
  it('hex color literals appear only inside the BrandOwl SVG markup', () => {
    const componentDir = join(repoRoot, 'src', 'components');
    const files = readdirSync(componentDir).filter((name) =>
      name.endsWith('.astro'),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const content = readFileSync(join(componentDir, name), 'utf8');
      if (name === 'BrandOwl.astro') {
        // The two pure-white glint highlights live in the SVG markup; the
        // scoped style block outside it must stay token-only.
        const withoutSvgMarkup = content.replace(
          /<svg[\s\S]*<\/svg>/,
          '',
        );
        expect(
          HEX_COLOR.test(withoutSvgMarkup),
          `${name} uses hex colors outside the SVG markup`,
        ).toBe(false);
      } else {
        expect(
          HEX_COLOR.test(content),
          `${name} uses hex color literals`,
        ).toBe(false);
      }
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
