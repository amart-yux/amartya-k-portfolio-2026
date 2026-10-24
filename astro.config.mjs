// @ts-check
import { defineConfig } from "astro/config";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import react from "@astrojs/react";
import sanity from "@sanity/astro";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

const isDevServer = process.argv.includes("dev");
const mode = isDevServer ? "development" : "production";

/** Same file precedence as Vite; real environment variables (e.g. on Vercel) win. */
function loadEnvFiles() {
  const files = [".env", `.env.${mode}`, ".env.local", `.env.${mode}.local`];
  const fromFiles = files
    .filter((file) => existsSync(file))
    .reduce((merged, file) => ({ ...merged, ...parseEnv(readFileSync(file, "utf8")) }), {});
  return { ...fromFiles, ...process.env };
}

const env = loadEnvFiles();

const projectId = env.PUBLIC_SANITY_PROJECT_ID || "3ptpe4cb";
const dataset = env.PUBLIC_SANITY_DATASET || "production";

/**
 * Sanity Studio is mounted at /studio once a project ID is configured.
 * Without one the site still runs and renders empty content.
 */
const sanityIntegration = projectId
  ? [sanity({ projectId, dataset, apiVersion: "2025-02-19", useCdn: true, studioBasePath: "/studio" })]
  : [];

/**
 * Astro's dev server rejects cross-site subresource requests unless their
 * Origin is allowed. The v0 editor probes the preview from its own origin,
 * so those hosts are trusted during `astro dev` only.
 */
const v0EditorDomains = ["v0.app", "*.v0.app", "v0.dev", "*.v0.dev", "*.vusercontent.net"].map(
  (hostname) => ({ hostname, protocol: "https" }),
);

const allowedDomains = [
  { hostname: "*.vercel.run", protocol: "https" },
  ...(isDevServer ? v0EditorDomains : []),
];

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [...sanityIntegration, react()],
  vite: { plugins: [tailwindcss()] },
  server: { host: true, port: 3000 },
  security: { allowedDomains },
});
