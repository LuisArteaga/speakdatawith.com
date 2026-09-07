#!/usr/bin/env node
/**
 * editorial:new — the deterministic bootstrap for a new article (issue #29,
 * ADR-0003). It allocates the next free editorial ID and scaffolds the
 * eleven private working artifacts under `content-work/<ID>/`; everything
 * else in the editorial workflow is prompt plus templates. The script
 * enforces no gates and validates no checkbox states — the gates are human
 * confirmations (docs/editorial/workflow.md).
 *
 * The editorial ID is the language-neutral Translation Key per ADR-0001 and
 * ADR-0003 (pattern ^SDW-\d{3,}$, e.g. SDW-001). The per-language contentId
 * (SDW-001-EN) is minted only at the handoff into the content pipeline and
 * is deliberately not produced here.
 *
 * ID allocation scans two sources and takes the maximum found number + 1:
 * - the directory names `content-work/SDW-*` (directories only, matching
 *   the ID pattern),
 * - the `translationKey` frontmatter values of all `.md` / `.mdx` files
 *   anywhere under `src/content/articles/`.
 * A collision — the target path `content-work/<ID>` already exists, for
 * example as a plain file that the directory-only scan ignores — aborts the
 * script with a clear error and exit code 1.
 *
 * Plain Node by design (node:fs / node:path / node:url). The single
 * non-builtin import is `parseFrontmatter` from
 * `scripts/translation/lib/frontmatter.mjs`, so article frontmatter is
 * parsed by the same YAML parser as the rest of the content tooling instead
 * of a fragile regex (the `yaml` package is already a devDependency). A
 * committed article with broken frontmatter aborts the bootstrap with the
 * file name — the collection must be green before a new article starts.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from '../translation/lib/frontmatter.mjs';

/** The editorial ID pattern: the Translation Key pattern from ADR-0001. */
export const EDITORIAL_ID_PATTERN = /^SDW-\d{3,}$/;

const FRONTMATTER_BLOCK_PATTERN = /^---\n([\s\S]*?)\n---(?:\n|$)/;
const ARTICLE_EXTENSION_PATTERN = /\.(md|mdx)$/;
const ID_PREFIX = 'SDW-';

/**
 * The eleven working artifacts of the editorial lifecycle, in scaffold
 * order. Titles and purposes mirror docs/editorial/workflow.md verbatim
 * ("Working artifacts" table) — the editorial skill's templates
 * (.claude/skills/editorial/, separate issue) must stay consistent with
 * these headers.
 */
export const ARTIFACT_FILES = [
  { file: 'topic.md', title: 'Topic', purpose: 'Provisional problem, open ambiguities, intended reader.' },
  { file: 'interview-notes.md', title: 'Interview Notes', purpose: 'Approved round summaries of the experience and humanity interviews.' },
  { file: 'author-language-bank.md', title: 'Author Language Bank', purpose: "The author's actual wording, recovered verbatim." },
  { file: 'thesis-map.md', title: 'Thesis Map', purpose: 'Decision, primary reader, trigger, current thesis, conventional assumption, failure mechanism, confidence.' },
  { file: 'gap-analysis.md', title: 'Gap Analysis', purpose: 'Every claim classified: observed, reproducible, externally verifiable, interpretive, unknown, or private.' },
  { file: 'research-ledger.md', title: 'Research Ledger', purpose: 'Claim-level traceability: source, source type, version, access date, interpretation, limitation.' },
  { file: 'article-brief.md', title: 'Article Brief', purpose: "Approved brief: reader's decision, opening material, problem and solution space, claims to avoid, CTA." },
  { file: 'outline.md', title: 'Outline', purpose: 'Argument-first outline, approved before drafting.' },
  { file: 'draft.md', title: 'Draft', purpose: 'The working draft.' },
  { file: 'humanity-interview.md', title: 'Humanity Interview', purpose: 'Emotional-reality pass over the draft.' },
  { file: 'claims-audit.md', title: 'Claims Audit', purpose: 'Final evidence check: every claim backed, explicitly waived, or removed.' },
];

/**
 * The drafting gate, verbatim from docs/editorial/workflow.md ("Issue
 * structure"): the checklist seed printed for the article's [CONTENT]
 * issue. Gate enforcement is out of scope — these are human confirmations.
 */
export const GATE_CHECKLIST_ITEMS = [
  'Interview complete',
  'Thesis confirmed',
  'Gaps classified',
  'Research and experiments complete',
  'Follow-up interview complete',
  'Brief approved',
  'Outline approved',
  'Draft authorized',
  'Humanity interview complete',
  'Claims audit complete',
];

/** Formats a number as an editorial ID: `SDW-` plus at least three digits. */
export function formatEditorialId(number) {
  return `${ID_PREFIX}${String(number).padStart(3, '0')}`;
}

/** Next free editorial number: maximum of the found numbers + 1, from 1. */
export function nextEditorialNumber(numbers) {
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
}

/**
 * Editorial IDs of the `content-work/SDW-*` directories. Plain files and
 * non-matching names are ignored (they are not valid editorial IDs); the
 * collision guard at scaffold time catches a file occupying the next ID's
 * path.
 */
export function scanContentWorkIds(workDir) {
  if (!existsSync(workDir)) {
    return [];
  }
  return readdirSync(workDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && EDITORIAL_ID_PATTERN.test(entry.name))
    .map((entry) => entry.name);
}

/**
 * `translationKey` frontmatter values of all articles under `articlesDir`
 * (recursively, `.md`/`.mdx`). Files without a frontmatter block and values
 * that are not valid editorial IDs are ignored; broken frontmatter YAML
 * throws with the file path — a committed article must never be silently
 * skipped (CI's check:translations would fail on it anyway).
 */
export function scanArticleTranslationKeys(articlesDir) {
  const keys = [];
  if (!existsSync(articlesDir)) {
    return keys;
  }
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.isFile() || !ARTICLE_EXTENSION_PATTERN.test(entry.name)) {
        continue;
      }
      const raw = readFileSync(path, 'utf8');
      const match = FRONTMATTER_BLOCK_PATTERN.exec(raw);
      if (!match) {
        continue;
      }
      let frontmatter;
      try {
        frontmatter = parseFrontmatter(match[1]);
      } catch (error) {
        throw new Error(`article ${relative(process.cwd(), path)}: ${error.message}`);
      }
      const key = frontmatter.translationKey;
      if (typeof key === 'string' && EDITORIAL_ID_PATTERN.test(key)) {
        keys.push(key);
      }
    }
  };
  walk(articlesDir);
  return keys;
}

/**
 * Next free editorial ID, scanning both allocation sources: the
 * `content-work/` directories and the committed articles' `translationKey`
 * values. Pure over its inputs' filesystem state; no paths are created.
 */
export function allocateEditorialId({ workDir, articlesDir }) {
  const ids = [...scanContentWorkIds(workDir), ...scanArticleTranslationKeys(articlesDir)];
  const numbers = ids.map((id) => Number.parseInt(id.slice(ID_PREFIX.length), 10));
  return formatEditorialId(nextEditorialNumber(numbers));
}

/**
 * The scaffold contents for one article: the eleven artifact files with
 * their standard headers (title, editorial ID, privacy note, purpose from
 * docs/editorial/workflow.md); `topic.md` additionally records the topic.
 * Pure — returns the files, writes nothing.
 */
export function buildScaffoldFiles(id, topic) {
  return ARTIFACT_FILES.map((artifact) => {
    const header = [
      `# ${artifact.title}`,
      '',
      `Editorial ID: \`${id}\` — private working artifact in \`content-work/\` (gitignored, ADR-0003).`,
      `Purpose: ${artifact.purpose}`,
      '',
    ].join('\n');
    const body = artifact.file === 'topic.md' ? `Provisional topic: ${topic}\n` : '';
    return { file: artifact.file, content: `${header}${body}` };
  });
}

/**
 * Creates `content-work/<ID>/` and writes the scaffold files. Throws a
 * clear collision error when the target path already exists (directory or
 * file) — it is never scaffolded over. Returns the written paths relative
 * to the working directory.
 */
export function scaffoldArticleWorkspace({ workDir, id, topic }) {
  const targetDir = join(workDir, id);
  if (existsSync(targetDir)) {
    throw new Error(
      `collision: content-work/${id} already exists — refusing to scaffold over an existing file or directory. Resolve the ID conflict first.`,
    );
  }
  mkdirSync(targetDir, { recursive: true });
  const scaffoldFiles = buildScaffoldFiles(id, topic);
  for (const scaffoldFile of scaffoldFiles) {
    writeFileSync(join(targetDir, scaffoldFile.file), scaffoldFile.content);
  }
  return scaffoldFiles.map((scaffoldFile) => `content-work/${id}/${scaffoldFile.file}`);
}

/**
 * The gate checklist seed for the article's `[CONTENT]` issue, verbatim
 * from docs/editorial/workflow.md. Printed as local text only — the script
 * never creates GitHub issues.
 */
export function buildGateChecklistSeed(id, topic) {
  const checklist = GATE_CHECKLIST_ITEMS.map((item) => `- [ ] ${item}`).join('\n');
  return `## [CONTENT] ${id} — ${topic}\n\n### Drafting gate\n\n${checklist}\n`;
}

function main() {
  const topic = process.argv[2];
  if (topic === undefined || topic.trim() === '') {
    console.error('[editorial] usage: npm run editorial:new "Topic" — a non-empty topic is required.');
    return 1;
  }
  const trimmedTopic = topic.trim();
  const workDir = resolve('content-work');
  const articlesDir = resolve('src', 'content', 'articles');
  const id = allocateEditorialId({ workDir, articlesDir });
  const writtenPaths = scaffoldArticleWorkspace({ workDir, id, topic: trimmedTopic });
  console.log(`[editorial] Allocated editorial ID ${id} for "${trimmedTopic}".`);
  console.log(`[editorial] Scaffolded ${writtenPaths.length} working artifacts under content-work/${id}/ (gitignored, ADR-0003):`);
  for (const writtenPath of writtenPaths) {
    console.log(`[editorial]   - ${writtenPath}`);
  }
  console.log('[editorial] Gate checklist seed for the [CONTENT] issue (docs/editorial/workflow.md):');
  console.log('');
  console.log(buildGateChecklistSeed(id, trimmedTopic));
  console.log('[editorial] Next steps: create the [CONTENT] issue with this checklist, then follow docs/editorial/workflow.md.');
  return 0;
}

// Run the CLI only on direct invocation ("node scripts/editorial/new-article.mjs"
// or "npm run editorial:new"), never on import from the unit tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
