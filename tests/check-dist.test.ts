import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findDistViolations } from '../scripts/check-dist.mjs';

const SCRIPT_PATH = resolve('scripts', 'check-dist.mjs');

let root = '';

function makeRoot(): string {
  root = mkdtempSync(join(tmpdir(), 'check-dist-'));
  return root;
}

function distPath(): string {
  return join(root, 'dist');
}

/** `content: null` seeds a directory entry, anything else a text file. */
function seedDist(entries: Record<string, string | null>): string {
  makeRoot();
  const dist = distPath();
  mkdirSync(dist);
  for (const [rel, content] of Object.entries(entries)) {
    const target = join(dist, rel);
    if (content === null) {
      mkdirSync(target, { recursive: true });
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
  }
  return dist;
}

describe('findDistViolations', () => {
  afterEach(() => {
    if (root !== '') {
      rmSync(root, { recursive: true, force: true });
      root = '';
    }
  });

  it('returns null when dist does not exist yet', () => {
    makeRoot();
    expect(findDistViolations(distPath())).toBeNull();
  });

  it('accepts the allowed build artifacts', () => {
    const dist = seedDist({
      'index.html': '<html></html>',
      'rss.xml': '<rss/>',
      'sitemap-index.xml': '<sitemap/>',
      'sitemap-0.xml': '<sitemap/>',
      'favicon.svg': '<svg/>',
      'robots.txt': 'User-agent: *',
      '_astro/hero.a1b2c3d4.jpg': 'image',
      '_astro/site.abc123.css': 'body {}',
    });

    expect(findDistViolations(dist)).toEqual([]);
  });

  it('flags a root-level .env file', () => {
    const dist = seedDist({ '.env': 'SECRET=1' });

    expect(findDistViolations(dist)).toEqual(['.env']);
  });

  it('flags nested .env.* files', () => {
    const dist = seedDist({ 'sub/.env.production': 'SECRET=1' });

    expect(findDistViolations(dist)).toEqual(['sub/.env.production']);
  });

  it('flags .git and .github directories at any depth', () => {
    const dist = seedDist({ 'nested/.git': null, 'nested/.github': null });

    expect(findDistViolations(dist)).toEqual(['nested/.git', 'nested/.github']);
  });

  it('flags a docs directory and the markdown source inside it', () => {
    const dist = seedDist({ 'docs/note.md': 'note' });

    expect(findDistViolations(dist)).toEqual(['docs', 'docs/note.md']);
  });

  it('flags .md, .mdx, and .map files at any depth', () => {
    const dist = seedDist({
      'deep/a/b/post.md': 'source',
      'pages/about.mdx': 'source',
      'x.js.map': '{}',
    });

    expect(findDistViolations(dist)).toEqual([
      'deep/a/b/post.md',
      'pages/about.mdx',
      'x.js.map',
    ]);
  });

  it('lists every violation of a seeded tree, sorted, and nothing else', () => {
    const dist = seedDist({
      'index.html': '<html></html>',
      'sub/.env': 'SECRET=1',
      'x.js.map': '{}',
      'docs/note.md': 'note',
      'keep.txt': 'allowed',
    });

    expect(findDistViolations(dist)).toEqual([
      'docs',
      'docs/note.md',
      'sub/.env',
      'x.js.map',
    ]);
  });

  it('does not follow symlinks and never crashes on them', () => {
    const dist = seedDist({ 'index.html': '<html></html>' });
    const outside = join(root, 'outside');
    mkdirSync(outside);
    writeFileSync(join(outside, 'leak.map'), '{}');
    symlinkSync(outside, join(dist, 'portal'), 'dir');

    expect(findDistViolations(dist)).toEqual([]);
  });

  it('flags symlink entries by name without following them', () => {
    const dist = seedDist({ 'index.html': '<html></html>' });
    symlinkSync(join(root, 'anywhere'), join(dist, '.env.production'), 'dir');

    expect(findDistViolations(dist)).toEqual(['.env.production']);
  });
});

describe('check-dist CLI', () => {
  afterEach(() => {
    if (root !== '') {
      rmSync(root, { recursive: true, force: true });
      root = '';
    }
  });

  function runCheckDist() {
    return spawnSync(process.execPath, [SCRIPT_PATH], {
      cwd: root,
      encoding: 'utf8',
    });
  }

  it('exits 0 with a notice when dist does not exist yet', () => {
    makeRoot();

    const result = runCheckDist();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });

  it('exits 0 on a clean dist', () => {
    makeRoot();
    mkdirSync(distPath());
    writeFileSync(join(distPath(), 'index.html'), '<html></html>');

    const result = runCheckDist();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('exits non-zero and lists every violation on a leaked dist', () => {
    makeRoot();
    mkdirSync(distPath());
    writeFileSync(join(distPath(), '.env'), 'SECRET=1');
    writeFileSync(join(distPath(), 'app.js.map'), '{}');

    const result = runCheckDist();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.env');
    expect(result.stderr).toContain('app.js.map');
  });
});
