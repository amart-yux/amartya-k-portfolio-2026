import { createClient, type SanityClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "./env";

/** Read-only client for published content; `null` until a project ID is set. */
export const client: SanityClient | null = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: true, perspective: "published" })
  : null;
