import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { singletonTypes, structure } from "./src/sanity/structure";

const SINGLETON_ACTIONS = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Portfolio",
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? actions.filter(({ action }) => action !== undefined && SINGLETON_ACTIONS.has(action))
        : actions,
  },
});
