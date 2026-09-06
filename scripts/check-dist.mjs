// Leak check for the Astro build output: fails when dist/ contains entries
// that must never be published (env files, git/workflow directories, Markdown
// sources, source maps). Plain Node only (node:fs / node:path / node:url),
// no npm dependencies. See README "Validation" for the rule list.
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENV_FILE_PATTERN = /^\.env(\..+)?$/;
const MARKDOWN_EXTENSIONS = ['.md', '.mdx'];
const SOURCE_MAP_EXTENSION = '.map';
const FORBIDDEN_DIRECTORY_NAMES = ['.git', '.github', 'docs'];

function nameViolation(name) {
  if (ENV_FILE_PATTERN.test(name)) {
    return true;
  }
  if (MARKDOWN_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return true;
  }
  if (name.endsWith(SOURCE_MAP_EXTENSION)) {
    return true;
  }
  return false;
}

/**
 * All violations in `distDir`, as paths relative to `distDir` and sorted
 * lexicographically, or `null` when `distDir` does not exist yet.
 *
 * Violation classes:
 * - `.env` and `.env.*` files (any depth)
 * - `.git`, `.github`, and `docs` directories (any depth)
 * - `.md` / `.mdx` source files and `.map` source maps (any depth)
 *
 * The scan reads directory entries only (readdir with withFileTypes), so
 * symlinks are evaluated by name but never followed and can never crash
 * the scan. Name-based file rules apply to symlink entries too. Real
 * directories are always walked - including flagged ones - so nested
 * violations (e.g. a Markdown file inside a smuggled `docs` directory)
 * are listed as well.
 */
export function findDistViolations(distDir) {
  if (!existsSync(distDir)) {
    return null;
  }
  const violations = [];
  const walk = (dir, relBase) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = relBase === '' ? entry.name : join(relBase, entry.name);
      if (nameViolation(entry.name) || (entry.isDirectory() && FORBIDDEN_DIRECTORY_NAMES.includes(entry.name))) {
        violations.push(rel);
      }
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), rel);
      }
    }
  };
  walk(distDir, '');
  return violations.sort();
}

function main() {
  const distDir = resolve('dist');
  const violations = findDistViolations(distDir);
  if (violations === null) {
    console.log('[check-dist] dist/ does not exist yet - nothing to check (run "npm run build" first).');
    return 0;
  }
  if (violations.length > 0) {
    console.error(`[check-dist] dist/ contains ${violations.length} entr${violations.length === 1 ? 'y' : 'ies'} that must not be published:`);
    for (const violation of violations) {
      console.error(`  - ${violation}`);
    }
    console.error('[check-dist] Remove or exclude these entries before deploying.');
    return 1;
  }
  console.log('[check-dist] OK: no leak violations in dist/.');
  return 0;
}

// Run the CLI only on direct invocation ("node scripts/check-dist.mjs"),
// never on import from the unit tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
