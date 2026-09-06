/**
 * A YouTube video ID. YouTube assigns exactly 11 characters from the
 * URL-safe alphabet `[A-Za-z0-9_-]` to every video, which makes the
 * length a load-bearing part of the validation: anything longer, shorter,
 * or containing other characters is not a video ID and must never reach
 * the embed URL.
 */
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_EMBED_URL_BASE = 'https://www.youtube-nocookie.com/embed/';
const YOUTUBE_EMBED_URL_PARAMS = '?autoplay=1&rel=0';
const YOUTUBE_WATCH_URL_BASE = 'https://www.youtube.com/watch?v=';

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

function assertValidYouTubeVideoId(videoId: string): void {
  if (!isValidYouTubeVideoId(videoId)) {
    throw new Error(`Invalid YouTube video ID: ${JSON.stringify(videoId)}`);
  }
}

/**
 * URL of the privacy-enhanced `youtube-nocookie.com` embed player for
 * `videoId`, with autoplay enabled and related videos disabled.
 *
 * Throws for malformed IDs so a broken URL can never be assembled:
 * render-time callers fail the build, and the facade script validates
 * the ID separately before reaching this point.
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  assertValidYouTubeVideoId(videoId);
  return `${YOUTUBE_EMBED_URL_BASE}${videoId}${YOUTUBE_EMBED_URL_PARAMS}`;
}

/**
 * URL of the regular YouTube watch page for `videoId`, used as the
 * facade's no-JavaScript fallback link target.
 *
 * Throws for malformed IDs, mirroring `buildYouTubeEmbedUrl`.
 */
export function buildYouTubeWatchUrl(videoId: string): string {
  assertValidYouTubeVideoId(videoId);
  return `${YOUTUBE_WATCH_URL_BASE}${videoId}`;
}

/**
 * Attributes applied to the iframe that the facade creates after the
 * user's click. `src` uses the privacy-enhanced embed host; `loading`
 * defers loading until the frame is near the viewport, and
 * `referrerPolicy` limits the referrer to the embedding origin.
 */
export interface YouTubeEmbedAttributes {
  src: string;
  title: string;
  allow: string;
  allowFullscreen: boolean;
  loading: 'lazy';
  referrerPolicy: 'strict-origin-when-cross-origin';
}

/** Permission allow-list for the embedded player, kept as narrow as YouTube's player requires. */
const YOUTUBE_EMBED_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

/**
 * The complete attribute set for the facade's post-click iframe: the
 * privacy-enhanced embed URL, the accessible title, YouTube's permission
 * allow-list, fullscreen support, deferred loading, and a referrer
 * policy that only exposes the embedding origin.
 */
export function buildYouTubeEmbedAttributes(
  videoId: string,
  title: string
): YouTubeEmbedAttributes {
  return {
    src: buildYouTubeEmbedUrl(videoId),
    title,
    allow: YOUTUBE_EMBED_ALLOW,
    allowFullscreen: true,
    loading: 'lazy',
    referrerPolicy: 'strict-origin-when-cross-origin',
  };
}
