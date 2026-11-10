import { defineField, defineType } from "sanity";

const altField = defineField({ name: "alt", title: "Alt text", type: "string" });

export const poster = defineType({
  name: "poster",
  title: "Poster",
  type: "document",
  fields: [
    defineField({
      name: "number",
      title: "Number",
      type: "number",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "defaultImage",
      title: "Default image",
      type: "image",
      fields: [altField],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "hoverImage",
      title: "Hover image",
      type: "image",
      fields: [altField],
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [{ title: "Number", name: "number", by: [{ field: "number", direction: "asc" }] }],
  preview: {
    select: { number: "number", media: "defaultImage" },
    prepare: ({ number, media }) => ({ title: number ? `Poster ${number}` : "Poster", media }),
  },
});
