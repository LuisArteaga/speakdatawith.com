/**
 * Tests for the editorial bootstrap script (`npm run editorial:new`,
 * issue #29): ID allocation over both sources (`content-work/` directories
 * and article frontmatter `translationKey` values), the collision abort,
 * the thirteen-file scaffold with its standard headers, the gate checklist
 * seed, and the CLI end-to-end behavior. A parity block (issue #40) pins
 * the artifact set to the workflow contract: the scaffold must match the
 * `docs/editorial/workflow.md` table and name every artifact in the skill
 * router. All workspaces are throwaway mkdtemp directories outside the
 * productive collections.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  allocateEditorialId,
  ARTIFACT_FILES,
  buildGateChecklistSeed,
  buildScaffoldFiles,
  EDITORIAL_ID_PATTERN,
  formatEditorialId,
  GATE_CHECKLIST_ITEMS,
  nextEditorialNumber,
  scaffoldArticleWorkspace,
} from '../scripts/editorial/new-article.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_PATH = join(REPO_ROOT, 'scripts', 'editorial', 'new-article.mjs');

interface CliResult {
  status: number;
  stdout: string;
  stderr: string;
}

let root = '';

function makeWorkspace(): string {
  root = mkdtempSync(join(tmpdir(), 'editorial-new-'));
  mkdirSync(join(root, 'content-work'), { recursive: true });
  mkdirSync(join(root, 'src', 'content', 'articles', 'en'), { recursive: true });
  mkdirSync(join(root, 'src', 'content', 'articles', 'de'), { recursive: true });
  mkdirSync(join(root, 'src', 'content', 'articles', 'es'), { recursive: true });
  return root;
}

function contentWork(): string {
  return join(root, 'content-work');
}

function articlesDir(): string {
  return join(root, 'src', 'content', 'articles');
}

function addContentWorkDir(id: string): void {
  mkdirSync(join(contentWork(), id));
}

function addContentWorkFile(name: string): void {
  writeFileSync(join(contentWork(), name), 'not a directory');
}

function addArticle(language: 'en' | 'de' | 'es', name: string, translationKey: string): void {
  const content = [
    '---',
    `translationKey: ${translationKey}`,
    `language: ${language}`,
    '---',
    '',
    '# Body',
    '',
  ].join('\n');
  writeFileSync(join(articlesDir(), language, name), content);
}

function addRawArticle(language: 'en' | 'de' | 'es', name: string, content: string): void {
  writeFileSync(join(articlesDir(), language, name), content);
}

function runCli(args: string[], cwd: string): CliResult {
  const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd, encoding: 'utf8' });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

describe('editorial ID primitives', () => {
  it('accepts the documented ID shape only', () => {
    expect(EDITORIAL_ID_PATTERN.test('SDW-001')).toBe(true);
    expect(EDITORIAL_ID_PATTERN.test('SDW-1000')).toBe(true);
    expect(EDITORIAL_ID_PATTERN.test('SDW-05')).toBe(false);
    expect(EDITORIAL_ID_PATTERN.test('SDW-001-EN')).toBe(false);
  });

  it('formats numbers with at least three digits', () => {
    expect(formatEditorialId(1)).toBe('SDW-001');
    expect(formatEditorialId(42)).toBe('SDW-042');
    expect(formatEditorialId(999)).toBe('SDW-999');
    expect(formatEditorialId(1000)).toBe('SDW-1000');
  });

  it('takes the maximum plus one, starting from 1', () => {
    expect(nextEditorialNumber([])).toBe(1);
    expect(nextEditorialNumber([1, 2, 3])).toBe(4);
    expect(nextEditorialNumber([7])).toBe(8);
  });
});

describe('allocateEditorialId', () => {
  afterEach(() => {
    if (root !== '') {
      rmSync(root, { recursive: true, force: true });
      root = '';
    }
  });

  it('returns SDW-001 on an empty workspace', () => {
    makeWorkspace();
    expect(allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toBe('SDW-001');
  });

  it('counts content-work directories as the maximum', () => {
    makeWorkspace();
    addContentWorkDir('SDW-001');
    addContentWorkDir('SDW-002');
    expect(allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toBe('SDW-003');
  });

  it('ignores plain files and non-matching names in content-work', () => {
    makeWorkspace();
    addContentWorkDir('SDW-001');
    addContentWorkFile('SDW-002');
    addContentWorkDir('notes');
    addContentWorkDir('SDW-5');
    expect(allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toBe('SDW-002');
  });

  it('counts article frontmatter translationKey values as the maximum', () => {
    makeWorkspace();
    addArticle('en', 'first.md', 'SDW-007');
    expect(allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toBe('SDW-008');
  });

  it('scans every language directory', () => {
    makeWorkspace();
    addArticle('en', 'source.md', 'SDW-002');
    addArticle('de', 'uebersetzung.md', 'SDW-004');
    addArticle('es', 'traduccion.mdx', 'SDW-003');
    expect(allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toBe('SDW-005');
  });

  it('ignores invalid translationKey values and files without frontmatter', () => {
    makeWorkspace();
    addArticle('en', 'short.md', 'SDW-12');
    addArticle('en', 'not-an-id.md', 'article-one');
    addRawArticle('en', 'no-frontmatter.md', '# Just a body\n');
    expect(allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toBe('SDW-001');
  });

  it('takes the maximum across mixed findings from both sources', () => {
    makeWorkspace();
    addContentWorkDir('SDW-001');
    addContentWorkDir('SDW-003');
    addArticle('en', 'older.md', 'SDW-002');
    addArticle('de', 'neuer.md', 'SDW-005');
    expect(allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toBe('SDW-006');
  });

  it('aborts on broken article frontmatter YAML with the file name', () => {
    makeWorkspace();
    addRawArticle('en', 'broken.md', '---\ntranslationKey: [unclosed\n---\n');
    expect(() => allocateEditorialId({ workDir: contentWork(), articlesDir: articlesDir() })).toThrowError(/broken\.md/);
  });
});

describe('scaffoldArticleWorkspace', () => {
  afterEach(() => {
    if (root !== '') {
      rmSync(root, { recursive: true, force: true });
      root = '';
    }
  });

  it('creates exactly the thirteen artifact files', () => {
    makeWorkspace();
    const writtenPaths = scaffoldArticleWorkspace({ workDir: contentWork(), id: 'SDW-001', topic: 'Interviews first' });

    expect(writtenPaths).toHaveLength(13);
    const fileNames = readdirSync(join(contentWork(), 'SDW-001')).sort();
    expect(fileNames).toHaveLength(13);
    expect(fileNames).toEqual(ARTIFACT_FILES.map((artifact) => artifact.file).sort());
  });

  it('writes standard headers with ID, privacy note, and purpose', () => {
    makeWorkspace();
    scaffoldArticleWorkspace({ workDir: contentWork(), id: 'SDW-001', topic: 'Interviews first' });

    for (const artifact of ARTIFACT_FILES) {
      const content = readFileSync(join(contentWork(), 'SDW-001', artifact.file), 'utf8');
      expect(content.startsWith(`# ${artifact.title}\n`)).toBe(true);
      expect(content).toContain('`SDW-001`');
      expect(content).toContain('gitignored, ADR-0003');
      expect(content).toContain(artifact.purpose);
    }
  });

  it('records the topic in topic.md only', () => {
    makeWorkspace();
    scaffoldArticleWorkspace({ workDir: contentWork(), id: 'SDW-001', topic: 'Interviews first' });

    const topicContent = readFileSync(join(contentWork(), 'SDW-001', 'topic.md'), 'utf8');
    expect(topicContent).toContain('Provisional topic: Interviews first');
    const draftContent = readFileSync(join(contentWork(), 'SDW-001', 'draft.md'), 'utf8');
    expect(draftContent.includes('Interviews first')).toBe(false);
  });

  it('aborts with a clear collision error when the target path exists as a file', () => {
    makeWorkspace();
    addContentWorkFile('SDW-001');
    expect(() => scaffoldArticleWorkspace({ workDir: contentWork(), id: 'SDW-001', topic: 't' })).toThrowError(
      /collision.*SDW-001/s,
    );
  });

  it('aborts with a clear collision error when the target directory already exists', () => {
    makeWorkspace();
    addContentWorkDir('SDW-001');
    expect(() => scaffoldArticleWorkspace({ workDir: contentWork(), id: 'SDW-001', topic: 't' })).toThrowError(
      /collision.*SDW-001/s,
    );
  });

  it('creates the content-work directory when it does not exist yet', () => {
    makeWorkspace();
    rmSync(contentWork(), { recursive: true, force: true });
    const writtenPaths = scaffoldArticleWorkspace({ workDir: contentWork(), id: 'SDW-001', topic: 't' });
    expect(writtenPaths).toHaveLength(13);
  });
});

describe('buildScaffoldFiles', () => {
  it('is pure and embeds the topic only into topic.md', () => {
    const files = buildScaffoldFiles('SDW-042', 'Data quality gates');
    expect(files).toHaveLength(13);
    const topicFile = files.find((file) => file.file === 'topic.md');
    expect(topicFile?.content).toContain('Provisional topic: Data quality gates');
    expect(topicFile?.content).toContain('SDW-042');
    const others = files.filter((file) => file.file !== 'topic.md');
    expect(others.every((file) => !file.content.includes('Data quality gates'))).toBe(true);
  });
});

describe('buildGateChecklistSeed', () => {
  it('contains the full drafting gate in workflow.md order', () => {
    const seed = buildGateChecklistSeed('SDW-001', 'Interviews first');
    let cursor = seed.indexOf('### Drafting gate');
    expect(cursor).toBeGreaterThan(-1);
    for (const item of GATE_CHECKLIST_ITEMS) {
      const position = seed.indexOf(`- [ ] ${item}`, cursor);
      expect(position).toBeGreaterThan(-1);
      cursor = position;
    }
  });

  it('uses the [CONTENT] issue title format with the ID and topic', () => {
    const seed = buildGateChecklistSeed('SDW-005', 'Interviews first');
    expect(seed).toContain('## [CONTENT] SDW-005 — Interviews first');
  });
});

describe('artifact set parity with the workflow contract (issue #40)', () => {
  const workflowPath = join(REPO_ROOT, 'docs', 'editorial', 'workflow.md');
  const skillPath = join(REPO_ROOT, '.claude', 'skills', 'editorial', 'SKILL.md');

  interface WorkflowRow {
    file: string;
    purpose: string;
  }

  function workflowArtifactTable(): WorkflowRow[] {
    const source = readFileSync(workflowPath, 'utf8');
    const section = source.split('## Working artifacts')[1] ?? '';
    const rows: WorkflowRow[] = [];
    for (const line of section.split('\n')) {
      const match = /^\| `([a-z0-9.-]+\.md)` \| (.+) \|$/u.exec(line.trim());
      if (match) {
        rows.push({ file: match[1], purpose: match[2] });
      }
    }
    return rows;
  }

  it('matches the workflow.md working-artifacts table in names, purposes, and order', () => {
    const rows = workflowArtifactTable();
    expect(rows).toHaveLength(13);
    expect(rows.map((row) => row.file)).toEqual(ARTIFACT_FILES.map((artifact) => artifact.file));
    ARTIFACT_FILES.forEach((artifact, index) => {
      // The table lowercases the first letter and drops the trailing period;
      // the scaffold header capitalizes it.
      const normalized = artifact.purpose.replace(/^./u, (c) => c.toLowerCase()).replace(/\.$/u, '');
      expect(normalized).toBe(rows[index].purpose);
    });
  });

  it('names every artifact in the skill router', () => {
    const skill = readFileSync(skillPath, 'utf8');
    for (const artifact of ARTIFACT_FILES) {
      expect(skill).toContain(`\`${artifact.file}\``);
    }
  });

  it('scaffolds the checkpoint artifacts with the hand-made first-instance headers', () => {
    const files = buildScaffoldFiles('SDW-007', 't');
    const status = files.find((file) => file.file === 'status.md');
    const transcript = files.find((file) => file.file === 'interview-transcript-raw.md');
    expect(status?.content.startsWith('# Status\n')).toBe(true);
    expect(status?.content).toContain('session-resume state');
    expect(transcript?.content.startsWith('# Interview Transcript (Raw)\n')).toBe(true);
    expect(transcript?.content).toContain('Verbatim dictated interview material');
  });
});

describe('editorial:new CLI', () => {
  afterEach(() => {
    if (root !== '') {
      rmSync(root, { recursive: true, force: true });
      root = '';
    }
  });

  it('allocates, scaffolds, and prints the gate checklist seed', () => {
    makeWorkspace();
    const cli = runCli(['Interview before producing'], root);

    expect(cli.status).toBe(0);
    expect(cli.stdout).toContain('Allocated editorial ID SDW-001');
    expect(readdirSync(join(contentWork(), 'SDW-001'))).toHaveLength(13);
    for (const item of GATE_CHECKLIST_ITEMS) {
      expect(cli.stdout).toContain(`- [ ] ${item}`);
    }
    expect(cli.stdout).toContain('## [CONTENT] SDW-001 — Interview before producing');
  });

  it('fails with usage when the topic is missing', () => {
    makeWorkspace();
    const cli = runCli([], root);

    expect(cli.status).toBe(1);
    expect(cli.stderr).toContain('usage');
  });

  it('fails with the collision error when the next ID path is taken', () => {
    makeWorkspace();
    addContentWorkFile('SDW-001');
    const cli = runCli(['Interview before producing'], root);

    expect(cli.status).toBe(1);
    expect(cli.stderr).toContain('collision');
    expect(cli.stderr).toContain('SDW-001');
  });
});
