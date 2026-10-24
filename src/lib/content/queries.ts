import { client } from "@/sanity/client";
import { toImage, toMedia, type SanityMedia } from "./media";
import type { AboutPage, Category, HomePage, MediaSource, RichText, SiteSettings, Subwork, Work } from "./types";

const IMAGE = `{ alt, "url": asset->url, "mimeType": asset->mimeType,
  "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`;

const GALLERY_ITEM = `{ _type, alt,
  "url": coalesce(asset->url, file.asset->url),
  "mimeType": coalesce(asset->mimeType, file.asset->mimeType),
  "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`;

const CATEGORY_FIELDS = `_id, title, "slug": slug.current`;

const WORK_FIELDS = `_id, "slug": slug.current, title, workedWith, period, liveUrl, linkPlaceholder,
  about, keywords, banner${IMAGE}, preview${IMAGE}, gallery[]${GALLERY_ITEM},
  "categories": categories[]->{ ${CATEGORY_FIELDS} }[defined(slug)] | order(title asc)`;

type CategoryDoc = { _id: string; title?: string | null; slug?: string | null };

type WorkDoc = {
  _id: string;
  slug: string;
  title?: string | null;
  categories?: CategoryDoc[] | null;
  workedWith?: string | null;
  period?: string | null;
  liveUrl?: string | null;
  linkPlaceholder?: string | null;
  about?: RichText | null;
  keywords?: string | null;
  banner?: SanityMedia | null;
  preview?: SanityMedia | null;
  gallery?: SanityMedia[] | null;
};

type SubworkDoc = {
  _id: string;
  title?: string | null;
  parentSlug: string;
  categorySlugs?: (string | null)[] | null;
  banner?: SanityMedia | null;
  preview?: SanityMedia | null;
};

/** Returns `null` while no Sanity project is configured. */
async function query<T>(groq: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!client) return null;
  return client.fetch<T>(groq, params);
}

function toCategory(doc: CategoryDoc): Category {
  return { id: doc._id, slug: doc.slug ?? "", title: doc.title ?? doc.slug ?? "" };
}

function toWork(doc: WorkDoc): Work {
  const name = doc.title ?? "";
  return {
    id: doc._id,
    slug: doc.slug,
    name,
    categories: (doc.categories ?? [])
      .filter((category): category is CategoryDoc => Boolean(category?.slug))
      .map(toCategory),
    workedWith: doc.workedWith ?? "",
    when: doc.period ?? "",
    about: doc.about ?? [],
    keywords: doc.keywords ?? "",
    liveUrl: doc.liveUrl || undefined,
    linkLabel: doc.linkPlaceholder || undefined,
    banner: toImage(doc.banner, `${name} banner`),
    preview: toImage(doc.preview, `${name} preview`),
    gallery: (doc.gallery ?? []).map(toMedia).filter((item): item is MediaSource => item !== undefined),
  };
}

export async function getCategories(): Promise<Category[]> {
  const docs = await query<CategoryDoc[]>(
    `*[_type == "category" && defined(slug.current)] | order(title asc){ ${CATEGORY_FIELDS} }`,
  );
  return (docs ?? []).map(toCategory);
}

export async function getWorks(): Promise<Work[]> {
  const docs = await query<WorkDoc[]>(
    `*[_type == "work" && defined(slug.current)] | order(sortOrder asc, _createdAt asc){ ${WORK_FIELDS} }`,
  );
  return (docs ?? []).map(toWork);
}

export async function getWork(slug: string): Promise<Work | null> {
  const doc = await query<WorkDoc | null>(`*[_type == "work" && slug.current == $slug][0]{ ${WORK_FIELDS} }`, {
    slug,
  });
  return doc ? toWork(doc) : null;
}

/** Home-page strip, grouped by parent work in the works order. */
export async function getSubworks(): Promise<Subwork[]> {
  const docs = await query<SubworkDoc[]>(
    `*[_type == "subwork" && defined(parentWork->slug.current)]
      | order(parentWork->sortOrder asc, title asc){
        _id, title, "parentSlug": parentWork->slug.current,
        "categorySlugs": categories[]->slug.current, banner${IMAGE}, preview${IMAGE} }`,
  );
  return (docs ?? []).map((doc) => {
    const title = doc.title ?? "";
    return {
      id: doc._id,
      title,
      parentSlug: doc.parentSlug,
      categorySlugs: (doc.categorySlugs ?? []).filter((slug): slug is string => Boolean(slug)),
      banner: toImage(doc.banner, title),
      preview: toImage(doc.preview, `${title} preview`),
    };
  });
}

export async function getAbout(): Promise<AboutPage> {
  const doc = await query<{ bio?: RichText | null; gallery?: { blank?: boolean; photo?: SanityMedia | null }[] | null }>(
    `*[_id == "about"][0]{ bio, gallery[]{ blank, photo${IMAGE} } }`,
  );
  const gallery = (doc?.gallery ?? []).map((cell, index) =>
    cell.blank ? null : (toImage(cell.photo, `Gallery image ${index + 1}`) ?? null),
  );
  return { bio: doc?.bio ?? [], gallery };
}

export async function getHome(): Promise<HomePage> {
  const doc = await query<{ intro?: RichText | null; contactEmail?: string | null }>(
    `*[_id == "home"][0]{ intro, contactEmail }`,
  );
  return { intro: doc?.intro ?? [], contactEmail: doc?.contactEmail || undefined };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await query<{ title?: string | null; description?: string | null }>(
    `*[_id == "siteSettings"][0]{ title, description }`,
  );
  return { title: doc?.title || undefined, description: doc?.description || undefined };
}
