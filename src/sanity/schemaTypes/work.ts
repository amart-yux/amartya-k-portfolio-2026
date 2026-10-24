import { defineArrayMember, defineField, defineType } from "sanity";

const altField = defineField({ name: "alt", title: "Alt text", type: "string" });

/**
 * Field names (period, liveUrl, about) predate the Framer naming; only the
 * titles follow Framer so existing content keeps working. A work's Subworks
 * are the Subwork documents whose Parent Work points here.
 */
export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The page lives at /works/{slug}",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sortOrder",
      title: "Position",
      type: "number",
      description: "Lower numbers appear first in the home page list.",
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "category" }] })],
      validation: (rule) => rule.unique().max(10),
    }),
    defineField({ name: "workedWith", title: "Worked With", type: "string", description: "Hidden when empty." }),
    defineField({ name: "period", title: "Year", type: "string", description: "e.g. 2025 - Completed" }),
    defineField({ name: "about", title: "Description", type: "richText" }),
    defineField({ name: "keywords", title: "Keywords", type: "text", rows: 3 }),
    defineField({
      name: "liveUrl",
      title: "Project Link",
      type: "url",
      description: "The Live Project row is hidden when empty.",
    }),
    defineField({
      name: "linkPlaceholder",
      title: "Link Placeholder",
      type: "string",
      description: "Text shown for the Project Link. Defaults to the URL.",
    }),
    defineField({
      name: "banner",
      title: "Banner",
      type: "image",
      fields: [altField],
    }),
    defineField({
      name: "preview",
      title: "Preview",
      type: "image",
      description: "Shown in the centre of the home page while this work is hovered.",
      fields: [altField],
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      description: "Images and videos shown on the work page, top to bottom.",
      of: [
        defineArrayMember({ type: "image", fields: [altField] }),
        defineArrayMember({
          name: "galleryVideo",
          title: "Video",
          type: "object",
          fields: [
            defineField({
              name: "file",
              title: "Video file",
              type: "file",
              options: { accept: "video/*" },
              validation: (rule) => rule.required(),
            }),
            altField,
          ],
          preview: { select: { title: "alt" }, prepare: ({ title }) => ({ title: title || "Video" }) },
        }),
      ],
    }),
  ],
  orderings: [{ title: "Position", name: "position", by: [{ field: "sortOrder", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "period", media: "preview" } },
});
