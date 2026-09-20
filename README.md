# jrmfong.github.io

My personal technical blog. Static site built with [Astro](https://astro.build),
deployed to GitHub Pages on every push to `main`.

## Writing a post

Create a Markdown file in `src/content/blog/`. The filename becomes the URL
slug, so `deploying-with-nix.md` is published at `/blog/deploying-with-nix/`.

```markdown
---
title: 'Deploying with Nix'
description: 'One sentence that shows up in search results and the RSS feed.'
pubDate: 2026-09-21
tags: ['nix', 'deployment']
---

Post body here.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Used as the `<h1>` and the page title. |
| `description` | yes | Becomes the meta description — keep it under ~155 characters. |
| `pubDate` | yes | `YYYY-MM-DD`. Drives ordering and the sitemap. |
| `updatedDate` | no | Shown on the post and emitted as `dateModified`. |
| `tags` | no | Generates `/tags/<tag>/` index pages. |
| `heroImage` | no | Path to an image in `src/assets/`. Used for social previews. |
| `draft` | no | `true` keeps it out of production builds but visible via `npm run dev`. |

Then commit and push:

```bash
git add . && git commit -m "post: deploying with nix" && git push
```

The deploy takes about a minute. Watch it in the repo's Actions tab.

## Local development

```bash
npm install     # once
npm run dev     # http://localhost:4321, live reload, drafts visible
npm run build   # production build into dist/
npm run preview # serve dist/ exactly as it'll be deployed
```

## How discoverability works

Search engines and language models get different things from this site:

| Path | Purpose |
| --- | --- |
| `/sitemap-index.xml` | Every HTML page, for search crawlers. Generated at build time. |
| `/robots.txt` | Explicitly allows search and AI crawlers. Edit `public/robots.txt` to change that. |
| `/rss.xml` | Feed readers. |
| `/blog/<slug>.md` | The raw Markdown source of any post. |
| `/llms.txt` | Index of every post with summaries, in the [llmstxt.org](https://llmstxt.org) format. |
| `/llms-full.txt` | Full text of every post in one document. |

Every page also carries JSON-LD structured data (`BlogPosting` on posts,
`WebSite` elsewhere), Open Graph and Twitter card tags, and a canonical URL.
The site ships as static HTML with no client-side JavaScript, which is what
makes it readable to crawlers that don't run a browser engine.

## Changing the basics

Almost everything configurable lives in `src/consts.ts` — site title,
description, your name and bio, social links, and the nav items. The colour
palette and typography are the custom properties at the top of
`src/styles/global.css`.

## Adding a custom domain

1. Put the bare domain in `public/CNAME` (one line, e.g. `jeremyfong.dev`).
2. Change `site` in `astro.config.mjs` and `SITE_URL` in `src/consts.ts` to match.
3. Update the `Sitemap:` line in `public/robots.txt`.
4. At your DNS provider, point an `ALIAS`/`ANAME` record at `jrmfong.github.io`,
   or four `A` records at `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`.
5. In the repo's Settings → Pages, enter the domain and enable "Enforce HTTPS"
   once the certificate is issued.
