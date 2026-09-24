/**
 * AOA Sessions — live performance content.
 * Each session is a standalone content object.
 * Empty for now; add entries here when first sessions are produced.
 */

export interface Session {
  id: string;
  slug: string;
  number: number;
  title: string;
  artist: string;          // Artist name
  artistSlug?: string;     // links to /artist/[slug]
  date: string;            // ISO date string e.g. "2025-01-15"
  description: string;
  videoUrl?: string;       // YouTube / Vimeo embed URL
  thumbnailUrl?: string;   // Poster/thumbnail image
  trackTitle?: string;
  releaseUrl?: string;     // Link to release
  tags?: string[];
}

/**
 * Live sessions — add a real object here when a video is ready.
 * Required: id, slug, number, title, artist, date, description.
 * To play on-site: add videoUrl (YouTube, Vimeo, or a direct .mp4).
 * Thumbnail: public file under /public/sessions/ or a remote image URL.
 *
 * Once an entry exists, it appears on /sessions, the homepage teaser,
 * /sessions/[slug], and the sitemap. No CMS or API needed.
 */
export const SESSIONS: Session[] = [];

export function getSession(slug: string): Session | undefined {
  return SESSIONS.find((s) => s.slug === slug);
}

/** Convert a watch URL into an embeddable iframe src, or return a direct file. */
export function getSessionEmbedUrl(url?: string): string | null {
  if (!url) return null;

  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (youtube?.[1]) return `https://www.youtube.com/embed/${youtube[1]}?rel=0`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;

  if (/\.(mp4|webm)(\?|$)/i.test(url) || url.startsWith('/')) return url;
  return url;
}

