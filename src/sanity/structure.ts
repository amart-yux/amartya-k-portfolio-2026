import type { StructureResolver } from "sanity/structure";

/** One-off pages, each stored under a fixed document ID that the site queries. */
const SINGLETONS = [
  { id: "home", type: "homePage", title: "Home" },
  { id: "about", type: "aboutPage", title: "About" },
  { id: "siteSettings", type: "siteSettings", title: "Site settings" },
] as const;

export const singletonTypes = new Set<string>(SINGLETONS.map(({ type }) => type));

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.documentTypeListItem("work").title("Works"),
      S.documentTypeListItem("subwork").title("Subworks"),
      S.documentTypeListItem("category").title("Categories"),
      S.divider(),
      ...SINGLETONS.map(({ id, type, title }) =>
        S.listItem().title(title).id(id).child(S.document().schemaType(type).documentId(id).title(title)),
      ),
    ]);
