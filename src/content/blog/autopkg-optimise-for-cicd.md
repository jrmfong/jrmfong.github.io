---
title: 'Optimising AutoPkg for CI/CD'
description: 'How caching update metadata and using URLDownloaderPython reduced my AutoPkg run for 80 app titles from 84 minutes to 24 minutes.'
pubDate: 2026-09-29
tags: ['autopkg', 'macos', 'jamf', 'github-actions', 'CICD']
---

My [previous post](https://jrmfong.github.io/blog/my-journey-with-autopkg/) covered the move to ephemeral runners.
This post explains how I maintain recipes, check for updates and cache the metadata those checks need.


## Maintaining recipes

Community recipes cover many apps, but vendor changes can break them.
A vendor can change a download URL or signing certificate, or switch an installer from a DMG to a PKG.
These changes can mean we need to update or rewrite a recipe.

We cannot expect community maintainers to meet any SLA for fixing recipes for obvious reason.
With patching windows getting shorter, we cannot always wait for a community fix.
A private repository lets us maintain recipes to meet our own deadlines and keep sensitive settings private.
We can still reuse community recipes where they meet our needs.

I also maintain a public AutoPkg recipe repository. What I will do next is to create a GitHub Actions workflow
to check those recipes regularly and help others who use them.

## Checking for updates

At first, I thought temporary runners would need little storage management.
As the recipe list grew, reducing build time became more important.
Shorter runs help avoid the six-hour runtime limit and keep costs down.
They also get updates to a MDM such as Jamf more quickly.

Avoiding downloads of unchanged apps helps reduce that time.
Two processors we often use for downloads are `URLDownloader` and `URLDownloaderPython`.

### URLDownloader

This is a simplified description of how `URLDownloader` checks for changes in AutoPkg 2.9.0.

- It reads any saved `ETag` and `Last-Modified` values from the cached file’s extended attributes.
- It sends those values in a GET request as `If-None-Match` and `If-Modified-Since`, respectively. 
- If the server returns `304 Not Modified`, AutoPkg sets `download_changed=False` and retains the cached file.
- If the server returns `200 OK`, curl downloads the response body. AutoPkg normally replaces the cached file and sets `download_changed=True`. However, 200 means the request succeeded, it does not itself establish that the content changed.

A server that ignores conditional requests can cause repeated downloads, even when its content is unchanged.

### URLDownloaderPython

It uses a different decision process:
- It opens a GET request using Python’s `urllib.request.urlopen()` and inspects the response headers. It does not automatically send conditional headers derived from the previous download.
- It loads the previous metadata from `<pathname>.info.json`.
- If the cached file is missing, it decides a download is required.
- With the default settings, it compares `Content-Length`, `ETag`, and `Last-Modified` against the saved metadata. A difference triggers downloading. Missing metadata can prevent comparisons; if no comparisons succeed, it also downloads.
- If the comparisons indicate no change, it sets `download_changed=False` and returns before reading the response body in its download loop. Otherwise, it reads the body and normally replaces the cached file and updates the metadata.

Both processors depend on metadata from the server. But `URLDownloaderPython` can avoid reading the full response body even when a server ignores conditional requests but still supply stable, useful response headers for these comparisons.
 uses a different decision process:

### URLDownloader in AutoPkg 3.0 RC5

In AutoPkg 3.0 RC5, `URLDownloader` combines conditional GET requests with checks against cached metadata.
It compares response headers with the metadata in `<pathname>.info.json`.

A 304 response shows no change. A 200 response can also count as unchanged when the metadata comparisons find no difference.

## Caching update metadata

In my workflow, I cache the metadata needed for update checks rather than every full installer. This keeps the cache small and reduces the amount of data and build time that needs to be restored to an ephemeral runner.

I used `actions/cache@v5` in GitHub Actions to save and restore this metadata. This includes the extended attributes used by `URLDownloader` and `.info.json` file used by URLDownloaderPython.

The CI workflow also creates non-empty placeholder files at the expected cache paths to satisfy the processors’ file presence checks.

This workaround requires the workflow to skip later processing for unchanged apps, so that a placeholder is never treated as a real installer. This is where AutoPkg’s `--check` mode and `EndOfCheckPhase` come in: the check run stops at that marker, allowing the workflow to inspect `download_changed` and decide whether a full recipe run is necessary. Scott Blake has an excellent explanation of this approach in [Unlocking AutoPkg's Check Mode](https://macadminmusings.com/blog/2025/11/22/unlocking-autopkgs-check-mode/).

While waiting for the stable release of AutoPkg 3.0, I use `URLDownloaderPython` with this caching approach.
In my environment, this reduced the run for 80 app titles from 84 minutes to 24 minutes.
