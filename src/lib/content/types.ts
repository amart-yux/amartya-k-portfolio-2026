/** A paragraph-level Portable Text document (paragraphs + inline links only). */
export type RichTextBlock = {
  _type: "block";
  _key: string;
  style?: string;
  markDefs?: { _key: string; _type: string; href?: string }[];
  children: { _type: "span"; _key: string; text: string; marks?: string[] }[];
};

export type RichText = RichTextBlock[];

/** Image resolved to a renderable `<img>` source set. */
export type ImageSource = {
  kind: "image";
  src: string;
  width?: number;
  height?: number;
  alt: string;
};

/** Video served straight from the media library. */
export type VideoSource = {
  kind: "video";
  src: string;
  mimeType?: string;
  width?: number;
  height?: number;
  poster?: string;
  alt: string;
};

export type MediaSource = ImageSource | VideoSource;

export type Category = {
  id: string;
  slug: string;
  title: string;
};

export type Work = {
  id: string;
  slug: string;
  name: string;
  categories: Category[];
  workedWith: string;
  when: string;
  about: RichText;
  keywords: string;
  liveUrl?: string;
  linkLabel?: string;
  banner?: ImageSource;
  preview?: ImageSource;
  gallery: MediaSource[];
};

/** One tile in the strip at the bottom of the home page; links to its parent work. */
export type Subwork = {
  id: string;
  title: string;
  parentSlug: string;
  categorySlugs: string[];
  banner?: ImageSource;
  preview?: ImageSource;
};

export type AboutPage = {
  bio: RichText;
  /** `null` cells are intentional blanks in the two-column grid. */
  gallery: (ImageSource | null)[];
};

export type SiteSettings = {
  title?: string;
  description?: string;
  favicon?: ImageSource;
  previewBanner?: ImageSource;
};

export type HomePage = {
  intro: RichText;
  contactEmail?: string;
};
