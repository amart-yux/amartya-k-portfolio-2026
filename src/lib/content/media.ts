import type { ImageSource, MediaSource } from "./types";

/** Image or file as projected by the GROQ fragments in queries.ts. */
export type SanityMedia = {
  _type?: string;
  url?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
};

/** Same responsive variants the original site served (512/1024/2048 + original). */
const SCALE_STEPS = [512, 1024, 2048];
const MAX_SRC_WIDTH = 2048;
const VIDEO_TYPE = "galleryVideo";

/** Animated GIFs are served untouched so they keep every frame. */
function isGif(url: string, mimeType?: string | null): boolean {
  return mimeType === "image/gif" || /\.gif(\?|$)/i.test(url);
}

/** Sanity's image CDN resizes and picks WebP/AVIF from query params. */
function cdnUrl(url: string, width: number): string {
  const resized = new URL(url);
  resized.searchParams.set("w", String(width));
  resized.searchParams.set("auto", "format");
  return resized.href;
}

export function toImage(media: SanityMedia | null | undefined, altFallback = ""): ImageSource | undefined {
  if (!media?.url) return undefined;
  const width = media.width ?? undefined;
  const height = media.height ?? undefined;
  const image: ImageSource = { kind: "image", src: media.url, width, height, alt: media.alt || altFallback };
  if (!width || isGif(media.url, media.mimeType)) return image;

  const widths = [...SCALE_STEPS.filter((step) => step < width), width];
  return {
    ...image,
    src: cdnUrl(media.url, Math.min(width, MAX_SRC_WIDTH)),
    srcset: widths.map((step) => `${cdnUrl(media.url as string, step)} ${step}w`).join(", "),
  };
}

export function toMedia(item: SanityMedia): MediaSource | undefined {
  if (item._type !== VIDEO_TYPE) return toImage(item);
  if (!item.url) return undefined;
  return { kind: "video", src: item.url, mimeType: item.mimeType ?? undefined, alt: item.alt ?? "" };
}
