import { defineArrayMember, defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Home",
  type: "document",
  fields: [
    defineField({ name: "intro", title: "Intro", type: "richText" }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      validation: (rule) => rule.email(),
    }),
  ],
  preview: { prepare: () => ({ title: "Home" }) },
});

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About",
  type: "document",
  fields: [
    defineField({ name: "bio", title: "Bio", type: "richText" }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      description: "Two-column grid, filled left to right. Use blank cells for gaps.",
      of: [
        defineArrayMember({
          name: "galleryCell",
          title: "Cell",
          type: "object",
          fields: [
            defineField({
              name: "blank",
              title: "Blank cell",
              type: "boolean",
              description: "Leave this cell empty in the grid.",
              initialValue: false,
            }),
            defineField({
              name: "photo",
              title: "Photo",
              type: "image",
              hidden: ({ parent }) => Boolean((parent as { blank?: boolean } | undefined)?.blank),
              fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
            }),
          ],
          preview: {
            select: { blank: "blank", media: "photo" },
            prepare: ({ blank, media }) => ({ title: blank ? "Blank cell" : "Photo", media }),
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "About" }) },
});

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Site title", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
