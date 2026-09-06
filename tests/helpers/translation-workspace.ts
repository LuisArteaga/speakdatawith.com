/**
 * Shared helpers for the translation workflow tests: throwaway workspaces
 * that mirror the repository layout (`src/content/articles/en/…`,
 * `translation-work/…`), CLI invocation with an isolated cwd, and a
 * deterministic fake translator used as the stand-in for the LLM step.
 *
 * The fake translator prefixes every segment text and converts the two
 * numeric conventions in the fixture (`0.25` → `0,25`, `1,234` → `1.234`),
 * exactly the transformation the numeric invariant expects from a real
 * translation.
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const scriptsDir = join(repoRoot, 'scripts', 'translation');
const fixturesDir = join(repoRoot, 'tests', 'fixtures', 'translation');

export interface CliResult {
  status: number;
  stdout: string;
  stderr: string;
}

export type TranslationScript = 'extract.mjs' | 'apply.mjs' | 'validate.mjs';

/** Runs one translation CLI script with `cwd` as its working directory. */
export function runScript(script: TranslationScript, args: string[], cwd: string): CliResult {
  const result = spawnSync(process.execPath, [join(scriptsDir, script), ...args], {
    cwd,
    encoding: 'utf8',
  });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** Creates a throwaway workspace containing the fixture as English source. */
export function makeWorkspace(fixture: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'sdw-translation-'));
  mkdirSync(join(dir, 'src', 'content', 'articles', 'en'), { recursive: true });
  copyFileSync(join(fixturesDir, fixture), join(dir, 'src', 'content', 'articles', 'en', fixture));
  return dir;
}

export function workspacePath(dir: string, ...segments: string[]): string {
  return join(dir, ...segments);
}

export const SOURCE_RELATIVE = (fixture: string) => `src/content/articles/en/${fixture}`;

/**
 * Stands in for the LLM translation step: reads the extract output and
 * writes the translated segments file (same ids, same order, prefixed
 * texts, convention-converted numbers, provenance metadata).
 */
export function fakeTranslate(
  dir: string,
  translationKey: string,
  targetLanguage: 'de' | 'es',
): string {
  const segmentsPath = join(dir, 'translation-work', `${translationKey}.${targetLanguage}.segments.json`);
  const data = JSON.parse(readFileSync(segmentsPath, 'utf8')) as {
    segments: { id: string; type: string; text: string }[];
  };
  for (const segment of data.segments) {
    segment.text = `T: ${segment.text.replace(/0\.25/g, '0,25').replace(/1,234/g, '1.234')}`;
  }
  const translatedPath = join(dir, 'translation-work', `${translationKey}.${targetLanguage}.translated.json`);
  writeFileSync(
    translatedPath,
    `${JSON.stringify(
      {
        ...data,
        model: 'test/model',
        ambiguousSegments: [],
        newGlossarySuggestions: [],
      },
      null,
      2,
    )}\n`,
  );
  return translatedPath;
}

/** Reads the YAML frontmatter block of a document as an object. */
export function readFrontmatter(documentPath: string): Record<string, unknown> {
  const raw = readFileSync(documentPath, 'utf8');
  const match = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (!match) {
    throw new Error(`no frontmatter block in ${documentPath}`);
  }
  return parseYaml(match[1]);
}
