/**
 * Type declarations for scripts/check-dist.mjs (the script itself is plain
 * JavaScript by design; this file only makes the import from the Vitest
 * tests type-check under `astro check`).
 */

/**
 * All violations in `distDir`, as paths relative to `distDir` and sorted
 * lexicographically, or `null` when `distDir` does not exist yet.
 */
export function findDistViolations(distDir: string): string[] | null;
