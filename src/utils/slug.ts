/**
 * Slug for a content entry file name: lowercased, whitespace and
 * underscores collapsed to single dashes, characters outside ASCII
 * alphanumerics and dashes removed, no leading/trailing dashes.
 *
 * Used by the `articles` collection's custom `generateId`, which must
 * strip the per-language directory before slugging — pure so the rule is
 * unit-testable.
 */
export function slugifyFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/\.(md|mdx)$/, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}
