---
title: 'Hello, world'
description: 'Why I built this blog, how it works, and what I plan to write about here.'
pubDate: 2026-09-20
tags: ['meta', 'astro']
---

Every few years I rebuild my personal site, write one post, and abandon it. The
pattern is always the same: I pick something with a lot of moving parts, the
setup itself becomes the hobby, and by the time it works I have nothing left to
say.

So this time the constraint came first. The site has to be boring enough that
publishing is easier than tinkering.

## What that means in practice

A post is a Markdown file in `src/content/blog/`. I write it, commit it, push
it. GitHub Actions builds the site and deploys it. There is no CMS, no database,
no admin panel, and nothing to log into.

```bash
# the entire publishing workflow
vim src/content/blog/some-post.md
git commit -am "post: some post"
git push
```

The build produces static HTML. No JavaScript ships to the browser unless a post
specifically needs it, which so far none of them do.

## Making it legible to machines

The other requirement was that things I write should actually be findable — by
search engines, and increasingly by language models answering questions on
someone's behalf.

Those two audiences want similar things but not identical ones. Search engines
want fast, semantic, well-linked HTML with structured data. Models want the text
without having to reconstruct it from markup.

So the site serves both:

| Path | Who it's for |
| --- | --- |
| `/sitemap-index.xml` | Search engine crawlers |
| `/rss.xml` | Feed readers |
| `/blog/<slug>.md` | Anything that wants the raw source of one post |
| `/llms.txt` | An index of every post, with summaries |
| `/llms-full.txt` | The full text of the whole site in one fetch |

Each post also carries `BlogPosting` JSON-LD, so a crawler gets the title,
publication date, author, and tags as data rather than having to infer them from
the page.

The `.md` endpoints turned out to be the piece I like most. Append `.md` to any
post URL and you get the source text. It costs nothing to serve, it's useful to
humans who want to quote something, and it means a model retrieving this page
gets prose instead of a `<div>` soup it has to strip first.

## What I'll write about

Infrastructure and automation, mostly — the unglamorous parts. Fleet management,
CI pipelines that misbehave in interesting ways, and the small tools I end up
building because the existing ones don't quite fit.

If that's useful to you, the [RSS feed](/rss.xml) is the reliable way to follow
along.
