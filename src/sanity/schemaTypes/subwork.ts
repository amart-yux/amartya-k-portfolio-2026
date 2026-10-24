import { defineArrayMember, defineField, defineType } from "sanity";

const altField = defineField({ name: "alt", title: "Alt text", type: "string" });

export const subwork = defineType({
  name: "subwork",
  title: "Subwork",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "parentWork",
      title: "Parent Work",
      type: "reference",
      to: [{ type: "work" }],
      description: "Clicking this tile on the home page opens this work.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      description: "The home page filter shows this tile when one of these categories is selected.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "category" }] })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "banner",
      title: "Banner",
      type: "image",
      description: "The tile image in the strip at the bottom of the home page.",
      fields: [altField],
    }),
    defineField({
      name: "preview",
      title: "Preview",
      type: "image",
      description: "Shown in the centre of the home page while this tile is hovered. Leave empty for no preview.",
      fields: [altField],
    }),
  ],
  orderings: [
    { title: "Parent work order", name: "parentOrder", by: [{ field: "parentWork.sortOrder", direction: "asc" }] },
    { title: "Title", name: "title", by: [{ field: "title", direction: "asc" }] },
  ],
  preview: { select: { title: "title", subtitle: "parentWork.title", media: "banner" } },
});
