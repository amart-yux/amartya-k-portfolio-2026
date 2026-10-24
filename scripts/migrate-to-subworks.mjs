/**
 * One-time migration of the existing Sanity content to the Framer CMS model:
 *   - creates a Category document for every category used by a work,
 *   - turns each work's old `categories` strings into Category references,
 *   - turns each old `thumbnails` tile into its own Subwork document
 *     (Banner = the tile image, Parent Work = that work), then removes
 *     the old `thumbnails` field.
 *
 * Safe to re-run: existing categories are reused and works that were already
 * migrated are skipped. Needs SANITY_API_WRITE_TOKEN (an "Editor" token).
 *
 * Run with: pnpm migrate:subworks
 */
import { createClient } from "@sanity/client";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || "3ptpe4cb";
const dataset = process.env.PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error("Set SANITY_API_WRITE_TOKEN before running the migration.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });

const LABELS = {
  identity: "Identity",
  media: "Media",
  packaging: "Packaging",
  product: "Product",
  space: "Space",
  web: "Web",
};

const key = () => Math.random().toString(36).slice(2, 12);
const reference = (id) => ({ _type: "reference", _ref: id, _key: key() });

const existing = await client.fetch(`*[_type == "category"]{ _id, "slug": slug.current }`);
const categoryIds = new Map(existing.map((category) => [category.slug, category._id]));

async function categoryId(slug) {
  if (!categoryIds.has(slug)) {
    const created = await client.create({
      _type: "category",
      title: LABELS[slug] ?? slug,
      slug: { _type: "slug", current: slug },
    });
    console.log(`Category: ${created.title}`);
    categoryIds.set(slug, created._id);
  }
  return categoryIds.get(slug);
}

const works = await client.fetch(
  `*[_type == "work" && !(_id in path("drafts.**"))] | order(sortOrder asc){ _id, title, "slug": slug.current, categories, thumbnails }`,
);

let subworkCount = 0;
for (const work of works) {
  const legacyCategories = (work.categories ?? []).filter((item) => typeof item === "string");
  const tiles = work.thumbnails ?? [];
  if (legacyCategories.length === 0 && tiles.length === 0) continue;

  console.log(`Work: ${work.title}`);
  const transaction = client.transaction();

  for (const tile of tiles) {
    if (!tile.category) continue;
    const label = LABELS[tile.category] ?? tile.category;
    transaction.create({
      _type: "subwork",
      title: `${work.title} ${label}`,
      slug: { _type: "slug", current: `${work.slug}-${tile.category}` },
      parentWork: { _type: "reference", _ref: work._id },
      categories: [reference(await categoryId(tile.category))],
      banner: tile.image?.asset ? { _type: "image", asset: tile.image.asset, alt: "" } : undefined,
    });
    subworkCount += 1;
  }

  const refs = [];
  for (const slug of legacyCategories) refs.push(reference(await categoryId(slug)));
  transaction.patch(work._id, (patch) => patch.set({ categories: refs }).unset(["thumbnails"]));

  await transaction.commit();
}

console.log(`Done: ${categoryIds.size} categories, ${subworkCount} new subworks.`);
