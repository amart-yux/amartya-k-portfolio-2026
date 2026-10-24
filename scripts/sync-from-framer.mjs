/**
 * Copies the Framer CMS (Works, Category, Subworks) into Sanity.
 *
 * Framer is treated as the source of truth for structure (categories, subworks,
 * order, text fields). Images, descriptions, galleries and links are only
 * written when Framer has a value, so anything already filled in Sanity is
 * never wiped by an empty Framer field. Safe to re-run.
 *
 * Needs:
 *   FRAMER_PROJECT_URL     e.g. https://framer.com/projects/Name--abc123
 *   FRAMER_API_KEY         Framer project API key
 *   SANITY_API_WRITE_TOKEN Sanity "Editor" token
 *
 * Run with: pnpm sync:framer
 */
import { createClient } from "@sanity/client";
import { connect } from "framer-api";

const { FRAMER_PROJECT_URL, FRAMER_API_KEY, SANITY_API_WRITE_TOKEN } = process.env;
if (!FRAMER_PROJECT_URL || !FRAMER_API_KEY || !SANITY_API_WRITE_TOKEN) {
  console.error("Set FRAMER_PROJECT_URL, FRAMER_API_KEY and SANITY_API_WRITE_TOKEN first.");
  process.exit(1);
}

const sanity = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || "3ptpe4cb",
  dataset: process.env.PUBLIC_SANITY_DATASET || "production",
  token: SANITY_API_WRITE_TOKEN,
  apiVersion: "2025-02-19",
  useCdn: false,
});

const key = () => Math.random().toString(36).slice(2, 12);
const ref = (id, withKey = true) => ({ _type: "reference", _ref: id, ...(withKey ? { _key: key() } : {}) });
const slugValue = (current) => ({ _type: "slug", current });

/** Reads a Framer collection into plain objects keyed by field name. */
async function readCollection(framer, name) {
  const collection = (await framer.getCollections()).find((c) => c.name === name);
  if (!collection) throw new Error(`Framer collection "${name}" not found`);
  const names = Object.fromEntries((await collection.getFields()).map((f) => [f.id, f.name]));
  const items = await collection.getItems();
  return items
    .filter((item) => !item.draft)
    .map((item) => {
      const fields = {};
      for (const [id, data] of Object.entries(item.fieldData)) fields[names[id] ?? id] = data.value;
      return { slug: item.slug, fields };
    });
}

const assetCache = new Map();
async function uploadImage(image) {
  if (!image?.url) return undefined;
  if (!assetCache.has(image.url)) {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error(`Download failed (${response.status}): ${image.url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const asset = await sanity.assets.upload("image", buffer, { filename: image.url.split("/").pop() });
    assetCache.set(image.url, asset._id);
  }
  return { _type: "image", asset: ref(assetCache.get(image.url), false) };
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
const decode = (text) =>
  text.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (match, code) => {
    if (code in ENTITIES) return ENTITIES[code];
    if (code.startsWith("#x")) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return match;
  });

/** Framer formatted text (HTML) → Portable Text paragraphs with inline links. */
function htmlToBlocks(html) {
  if (!html) return undefined;
  const paragraphs = [...html.matchAll(/<(p|h\d|li)[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]);
  const blocks = paragraphs
    .map((inner) => {
      const markDefs = [];
      const children = [];
      for (const part of inner.split(/(<a\b[^>]*>[\s\S]*?<\/a>)/i)) {
        const link = part.match(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
        const text = decode((link ? link[2] : part).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
        if (!text) continue;
        const marks = [];
        if (link) {
          const markKey = key();
          markDefs.push({ _type: "link", _key: markKey, href: decode(link[1]) });
          marks.push(markKey);
        }
        children.push({ _type: "span", _key: key(), text, marks });
      }
      if (!children.length) return null;
      return { _type: "block", _key: key(), style: "normal", markDefs, children };
    })
    .filter(Boolean);
  return blocks.length ? blocks : undefined;
}

const clean = (value) => (typeof value === "string" ? value.trim() : value) || undefined;

const framer = await connect(FRAMER_PROJECT_URL, FRAMER_API_KEY);
const [frCategories, frWorks, frSubworks] = [
  await readCollection(framer, "Category"),
  await readCollection(framer, "Works"),
  await readCollection(framer, "Subworks"),
];
await framer.disconnect?.();
console.log(`Framer: ${frCategories.length} categories, ${frWorks.length} works, ${frSubworks.length} subworks`);

const existing = await sanity.fetch(`{
  "categories": *[_type == "category" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current },
  "works": *[_type == "work" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current },
  "subworks": *[_type == "subwork" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current }
}`);
const idBySlug = (docs) => new Map(docs.map((doc) => [doc.slug, doc._id]));

const categoryIds = idBySlug(existing.categories);
for (const { slug, fields } of frCategories) {
  const data = { title: clean(fields.Title) ?? slug, slug: slugValue(slug) };
  if (categoryIds.has(slug)) await sanity.patch(categoryIds.get(slug)).set(data).commit();
  else categoryIds.set(slug, (await sanity.create({ _type: "category", ...data }))._id);
}
const categoryRefs = (slugs = []) => slugs.filter((s) => categoryIds.has(s)).map((s) => ref(categoryIds.get(s)));
console.log(`Categories synced: ${categoryIds.size}`);

const workIds = idBySlug(existing.works);
for (const [index, { slug, fields }] of frWorks.entries()) {
  const galleryImages = (fields.Gallery ?? []).map((item) => Object.values(item.fieldData ?? {})[0]?.value);
  const gallery = [];
  for (const image of galleryImages) {
    const uploaded = await uploadImage(image);
    if (uploaded) gallery.push({ ...uploaded, _key: key() });
  }

  const set = {
    title: clean(fields.Title) ?? slug,
    slug: slugValue(slug),
    sortOrder: index + 1,
    categories: categoryRefs(fields.Categories),
  };
  const optional = {
    workedWith: clean(fields["Worked With"]),
    period: clean(fields.Year),
    keywords: clean(fields.Keywords),
    liveUrl: clean(fields["Project Link"]),
    linkPlaceholder: clean(fields["Link Placeholder"]),
    about: htmlToBlocks(fields.Description),
    banner: await uploadImage(fields.Banner),
    preview: await uploadImage(fields.Preview),
    gallery: gallery.length ? gallery : undefined,
  };
  for (const [field, value] of Object.entries(optional)) if (value !== undefined) set[field] = value;

  if (workIds.has(slug)) await sanity.patch(workIds.get(slug)).set(set).commit();
  else workIds.set(slug, (await sanity.create({ _type: "work", ...set }))._id);
  console.log(`Work ${index + 1}/${frWorks.length}: ${set.title} (${gallery.length} gallery images)`);
}

const subworkIds = idBySlug(existing.subworks);
const framerSubworkSlugs = new Set();
for (const { slug, fields } of frSubworks) {
  const parentId = workIds.get(fields["Parent Work"]);
  if (!parentId) {
    console.warn(`Skipped subwork "${slug}": parent work "${fields["Parent Work"]}" not found`);
    continue;
  }
  framerSubworkSlugs.add(slug);
  const set = {
    title: clean(fields.Title) ?? slug,
    slug: slugValue(slug),
    parentWork: ref(parentId, false),
    categories: categoryRefs(fields.Categories),
  };
  const banner = await uploadImage(fields.Banner);
  const preview = await uploadImage(fields.Preview);
  if (banner) set.banner = banner;
  if (preview) set.preview = preview;

  if (subworkIds.has(slug)) await sanity.patch(subworkIds.get(slug)).set(set).commit();
  else await sanity.create({ _type: "subwork", ...set });
}
console.log(`Subworks synced: ${framerSubworkSlugs.size}`);

const removed = existing.subworks.filter((doc) => !framerSubworkSlugs.has(doc.slug));
for (const doc of removed) await sanity.delete(doc._id);
if (removed.length) console.log(`Removed subworks not in Framer: ${removed.map((d) => d.slug).join(", ")}`);

console.log(`Done. Uploaded ${assetCache.size} images.`);
process.exit(0);
