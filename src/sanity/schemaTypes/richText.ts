import { defineArrayMember, defineType } from "sanity";

/** Paragraphs with inline links only — the site's typography has no headings or lists. */
export const richText = defineType({
  name: "richText",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [],
      marks: {
        decorators: [],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              {
                name: "href",
                type: "url",
                title: "URL",
                description: "Full URL, or a site path like /about",
                validation: (rule) =>
                  rule.required().uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
              },
            ],
          },
        ],
      },
    }),
  ],
});
