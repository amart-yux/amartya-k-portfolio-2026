/**
 * One-time import of the portfolio content in seed/seed.json into Sanity.
 * Downloads every image from its current URL, uploads it to Sanity, and
 * creates the categories, works, subworks, home, about and site settings
 * documents. For a project that already has the old content, use
 * `pnpm migrate:subworks` instead so edits made in Studio are kept.
 *
 * Needs PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (an "Editor"
 * token from sanity.io/manage). Safe to re-run: documents use fixed IDs and
 * are replaced, and Sanity de-duplicates identical image uploads.
 *
 * Run with: pnpm import:sanity
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || "3ptpe4cb";
const dataset = process.env.PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN before running the import.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
const seed = JSON.parse(await readFile(new URL("../seed/seed.json", import.meta.url), "utf8"));

const uploaded = new Map();

async function uploadAsset(media) {
  const url = media?.$media?.url;
  if (!url) return null;
  if (!uploaded.has(url)) {
    uploaded.set(
      url,
      (async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        const kind = (response.headers.get("content-type") ?? "").startsWith("video/") ? "file" : "image";
        const asset = await client.assets.upload(kind, buffer, { filename: media.$media.filename });
        console.log(`  uploaded ${media.$media.filename}`);
        return { kind, id: asset._id };
      })(),
    );
  }
  return uploaded.get(url);
}

async function imageField(media, alt) {
  const asset = await uploadAsset(media);
  if (!asset) return undefined;
  const field = { _type: "image", asset: { _type: "reference", _ref: asset.id } };
  return alt === undefined ? field : { ...field, alt };
}

async function galleryItem(item) {
  const asset = await uploadAsset(item.asset);
  if (!asset) return null;
  const reference = { _type: "reference", _ref: asset.id };
  if (asset.kind === "file") {
    return { _type: "galleryVideo", _key: item._key, alt: item.alt ?? "", file: { _type: "file", asset: reference } };
  }
  return { _type: "image", _key: item._key, alt: item.alt ?? "", asset: reference };
}

const key = (index) => `k${index.toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const CATEGORY_LABELS = {
  identity: "Identity",
  media: "Media",
  packaging: "Packaging",
  product: "Product",
  space: "Space",
  web: "Web",
};
const categoryDocs = Object.entries(CATEGORY_LABELS).map(([slug, title]) => ({
  _id: `category-${slug}`,
  _type: "category",
  title,
  slug: { _type: "slug", current: slug },
}));
const categoryRef = (slug, index) => ({ _type: "reference", _ref: `category-${slug}`, _key: key(index) });
const subworks = [];

async function workDoc(entry, index) {
  const data = entry.data;
  console.log(`Work: ${data.title}`);
  const gallery = [];
  for (const item of data.gallery ?? []) {
    const converted = await galleryItem(item);
    if (converted) gallery.push(converted);
  }
  // Dots in a Sanity ID mark it as a private path, hidden from public reads.
  const workId = `work-${entry.slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  for (const [tileIndex, tile] of (data.thumbnails ?? []).entries()) {
    const banner = await imageField(tile.image, "");
    if (!banner || !tile.category) continue;
    subworks.push({
      _id: `${workId}-subwork-${tileIndex}`,
      _type: "subwork",
      title: `${data.title} ${CATEGORY_LABELS[tile.category] ?? tile.category}`,
      slug: { _type: "slug", current: `${entry.slug}-${tile.category}` },
      parentWork: { _type: "reference", _ref: workId },
      categories: [categoryRef(tile.category, tileIndex)],
      banner,
    });
  }
  return {
    _id: workId,
    _type: "work",
    title: data.title,
    slug: { _type: "slug", current: entry.slug },
    sortOrder: index,
    categories: (data.categories ?? []).map(categoryRef),
    workedWith: data.worked_with ?? "",
    period: data.period ?? "",
    liveUrl: data.live_url || undefined,
    about: data.about ?? [],
    keywords: data.keywords ?? "",
    preview: await imageField(data.preview, data.preview?.$media?.alt ?? ""),
    gallery,
  };
}

async function aboutDoc(entry) {
  console.log("About page");
  const gallery = [];
  for (const [index, cell] of (entry.data.gallery ?? []).entries()) {
    const photo = cell.blank ? undefined : await imageField(cell.photo, cell.photo?.$media?.alt ?? "");
    gallery.push({ _type: "galleryCell", _key: key(index), blank: Boolean(cell.blank), photo });
  }
  return { _id: "about", _type: "aboutPage", bio: entry.data.bio ?? [], gallery };
}

const home = seed.content.home[0].data;
const settings = seed.settings ?? {};

const docs = [...categoryDocs];
for (const [index, entry] of seed.content.works.entries()) docs.push(await workDoc(entry, index));
docs.push(...subworks);
docs.push(await aboutDoc(seed.content.about[0]));
docs.push({ _id: "home", _type: "homePage", intro: home.intro ?? [], contactEmail: home.contact_email || undefined });
docs.push({
  _id: "siteSettings",
  _type: "siteSettings",
  title: settings.seo?.defaultTitle ?? settings.title,
  description: settings.seo?.defaultDescription ?? settings.tagline,
});

const transaction = client.transaction();
for (const doc of docs) transaction.createOrReplace(doc);
await transaction.commit();
console.log(`Done: ${docs.length} documents, ${uploaded.size} files.`);
