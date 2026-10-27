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

const VIDEO_TYPE = "galleryVideo";

export function toImage(media: SanityMedia | null | undefined, altFallback = ""): ImageSource | undefined {
  if (!media?.url) return undefined;
  return {
    kind: "image",
    src: media.url,
    width: media.width ?? undefined,
    height: media.height ?? undefined,
    alt: media.alt || altFallback,
  };
}

export function toMedia(item: SanityMedia): MediaSource | undefined {
  if (item._type !== VIDEO_TYPE) return toImage(item);
  if (!item.url) return undefined;
  return { kind: "video", src: item.url, mimeType: item.mimeType ?? undefined, alt: item.alt ?? "" };
}
