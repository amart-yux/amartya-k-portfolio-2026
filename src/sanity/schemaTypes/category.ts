import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Used in the home page filter URL, e.g. /?category=web",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [{ title: "Title", name: "title", by: [{ field: "title", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
