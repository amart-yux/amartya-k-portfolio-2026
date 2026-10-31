# Portfolio

A portfolio website built with [Astro](https://astro.build). All content (projects, home page, about page and images) is managed in [Sanity](https://www.sanity.io), a hosted CMS. The content editor (Sanity Studio) is built into the site at `/studio`.

- **Website:** Astro + Tailwind CSS, deployed on Vercel
- **Content and images:** Sanity (no database or file storage needed)
- **Editor:** `/studio` on the same site

---

## 1. Requirements

- [Node.js](https://nodejs.org) **22.23.4 or newer**, or Node 24 (check with `node -v`)
- [pnpm](https://pnpm.io). The easiest way to get it is to run `corepack enable` once, which comes with Node.
- A [Sanity](https://www.sanity.io) account
- A [Vercel](https://vercel.com) account (for deploying)

---

## 2. Run it locally

```bash
# 1. Install dependencies
pnpm install

# 2. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the site and [http://localhost:3000/studio](http://localhost:3000/studio) for the editor.

The site works without any setup. It reads from Sanity project `3ptpe4cb`, dataset `production`, which is set as the default in `src/sanity/env.ts`.

---

## 3. Sanity setup

Choose **one** of these options.

### Option A: Use the existing Sanity project (content already there)

1. The project owner invites you at [sanity.io/manage](https://www.sanity.io/manage) → project **3ptpe4cb** → **Members** → **Invite**, with the **Editor** or **Administrator** role.
2. Accept the invite. You can then sign in at `/studio`.

Nothing else is needed.

### Option B: Use your own, new Sanity project

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage) and copy its **Project ID**.
2. In the project, go to **Datasets** and make sure a dataset called `production` exists. Create it if it's missing.
3. Create a file called `.env` in the project root:

   ```bash
   PUBLIC_SANITY_PROJECT_ID=your-project-id
   PUBLIC_SANITY_DATASET=production
   ```

4. **Optional: copy in the starter content.** In **API** → **Tokens**, create a token with **Editor** permissions. Then run:

   ```bash
   SANITY_API_WRITE_TOKEN=your-token pnpm import:sanity
   ```

   This uploads all projects, pages and images from `seed/seed.json` into your Sanity project. You can run it again safely. Delete the token afterwards. The site itself never needs it.

### CORS origins (needed for both options)

Studio only works from addresses that Sanity allows. In [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **CORS origins**, add each address below and tick **Allow credentials**:

- `http://localhost:3000` (local development)
- `https://*.vercel.app` (Vercel deployments)
- Your custom domain, such as `https://yourdomain.com`, if you have one

If Studio shows a CORS or login error, an address is missing from this list.

---

## 4. Deploy to Vercel

### Via GitHub (recommended)

1. Push this folder to a new GitHub repository. Don't commit `node_modules`, `dist`, `.astro` or `.env`, which `.gitignore` already excludes.
2. On [vercel.com/new](https://vercel.com/new), import the repository.
3. Vercel picks up the settings from `vercel.json` automatically (framework **Astro**, build command `astro build`). Leave the defaults.
4. **Environment variables:**
   - Option A (existing project): none needed.
   - Option B (your own project): add `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` with the same values as your `.env`.
5. Click **Deploy**.
6. Add the deployed address (and any custom domain) to Sanity's **CORS origins** if it isn't covered by `https://*.vercel.app`.

Every push to the main branch redeploys automatically.

### Via the Vercel CLI

```bash
pnpm dlx vercel        # preview deployment
pnpm dlx vercel --prod # production deployment
```

---

## 5. Editing content

1. Go to `https://your-site/studio` and sign in with your Sanity account.
2. The menu on the left matches the site:
   - **Home:** intro text and contact email
   - **About:** bio and gallery
   - **Works:** the projects, listed on the home page in **Position** order. Each has a title, a **Show on Portfolio** toggle (on by default; off hides the Work and its Subworks from the home page without unpublishing it), categories, Worked With (hidden when empty), year, live link and link label, description, keywords, a banner, a **preview** image (shown on hover in the work list) and a gallery.
- **Subworks:** the tiles in the strip at the bottom of the home page. Each has a **Parent Work** (the page it opens), one or more categories (used by the filter), a **Banner** (the tile image) and an optional **Preview** (shown on hover).
- **Categories:** the filter options on the home page (Identity, Media, ...). Add, rename or remove them here.
3. Make your changes and click **Publish**.

The live site updates right away, with no redeploy. Drafts stay hidden until you publish them.

---

## 6. Project structure

```
src/
  pages/              Site routes (home, about, works/[slug])
  components/         UI components
  layouts/            Page layout
  lib/content/        Sanity queries and data mapping
  sanity/             Sanity client, env, Studio structure and schema
    schemaTypes/      Content types (work, home, about, rich text)
sanity.config.ts      Studio configuration (served at /studio)
sanity.cli.ts         Sanity CLI configuration
scripts/
  import-to-sanity.mjs  One-time import of seed/seed.json into Sanity
seed/seed.json        Starter content
vercel.json           Vercel build settings
```

To add or change fields, edit the files in `src/sanity/schemaTypes/`, then update the matching query in `src/lib/content/` so the site displays the new field.

---

## 7. Scripts

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `pnpm dev`           | Start the dev server on port 3000     |
| `pnpm build`         | Build for production                  |
| `pnpm preview`       | Preview the production build locally  |
| `pnpm check`         | Type-check the project                |
| `pnpm import:sanity` | Import `seed/seed.json` into Sanity   |
| `pnpm sync:framer`   | Copy the Framer CMS into Sanity       |

`pnpm sync:framer` needs `FRAMER_PROJECT_URL`, `FRAMER_API_KEY` and `SANITY_API_WRITE_TOKEN` set for that one command. It updates categories, works and subworks, and never clears a Sanity field just because the matching Framer field is empty. It is safe to run again.

---

## Troubleshooting

- **Studio is blank or shows a CORS error:** add the current address to Sanity's CORS origins with **Allow credentials** ticked.
- **Can't sign in to Studio:** your Sanity account must be a member of the project.
- **Work pages show 404:** the work isn't published in Sanity yet, or `PUBLIC_SANITY_PROJECT_ID` points to the wrong project.
- **Install fails:** check `node -v` (needs 22.23.4 or newer) and run `corepack enable`.
