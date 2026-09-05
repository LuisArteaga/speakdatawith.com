/**
 * A YouTube video ID. YouTube assigns exactly 11 characters from the
 * URL-safe alphabet `[A-Za-z0-9_-]` to every video, which makes the
 * length a load-bearing part of the validation: anything longer, shorter,
 * or containing other characters is not a video ID and must never reach
 * the embed URL.
 */
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Whether `videoId` is a syntactically valid YouTube video ID.
 *
 * Used by the content schema (frontmatter validation) and by the
 * YouTubeFacade click handler (defense in depth before the embed URL is
 * assembled), so both layers share one definition.
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  return YOUTUBE_VIDEO_ID_PATTERN.test(videoId);
}
