---
title: 'Optimising AutoPkg for CI/CD'
description: 'How caching update metadata and using URLDownloaderPython reduced my AutoPkg run for 80 app titles from 84 minutes to 24 minutes.'
pubDate: 2026-09-29
tags: ['autopkg', 'macos', 'jamf', 'github-actions']
---

Caching update metadata reduced my AutoPkg run for 80 app titles from 84 minutes to 24 minutes.
I combined this approach with `URLDownloaderPython` in GitHub Actions.

My [previous post](https://jrmfong.github.io/blog/my-journey-with-autopkg/) covered the move to ephemeral runners, which are temporary machines created for each run.
This post explains how I maintain recipes, check for updates and cache the metadata those checks need.

## Maintaining recipes

Community recipes cover many apps, but vendor changes can break them.
A vendor can change a download URL or signing certificate, or switch an installer from a DMG to a PKG.
These changes can mean we need to update or rewrite a recipe.

We cannot expect community maintainers to meet our service level agreement (SLA) for fixing recipes.
With patching windows getting shorter, we cannot always wait for a community fix.
A private repository lets us maintain recipes to meet our own deadlines and keep sensitive settings private.
We can still reuse community recipes where they meet our needs.

I also maintain a public AutoPkg recipe repository.
I could add a GitHub Actions workflow to check those recipes regularly and help others who use them.

## Checking for updates

At first, I thought temporary runners would need little storage management.
As the recipe list grew, reducing build time became more important.
Shorter runs help avoid the six-hour runtime limit and keep costs down.
They also get updates to a mobile device management (MDM) service such as Jamf more quickly.

Avoiding downloads of unchanged apps helps reduce that time.
Two processors we often use for downloads are `URLDownloader` and `URLDownloaderPython`.

### URLDownloader in AutoPkg 2.9.0

This is a simplified description of how `URLDownloader` checks for changes in AutoPkg 2.9.0.

It reads saved `ETag` and `Last-Modified` values from the cached file's extended attributes.
It sends these values in a GET request as `If-None-Match` and `If-Modified-Since`, respectively.
These headers ask the server to send the file only if it has changed.

If the server returns `304 Not Modified`, AutoPkg sets `download_changed=False` and keeps the cached file.
If the server returns `200 OK`, curl downloads the response body.
AutoPkg normally replaces the cached file and sets `download_changed=True`.
But a 200 response only means the request succeeded.
It does not establish that the content changed.

A server that ignores conditional requests can cause repeated downloads, even when its content is unchanged.

### URLDownloaderPython

`URLDownloaderPython` opens a GET request using Python's `urllib.request.urlopen()` and checks the response headers.
It does not automatically send conditional headers based on the earlier download.

It loads the earlier metadata from `<pathname>.info.json`.
If the cached file is missing, it decides a download is needed.

With the default settings, it compares `Content-Length`, `ETag` and `Last-Modified` against the saved metadata.
A difference triggers a download.
Missing metadata can prevent comparisons.
If no comparisons succeed, it also downloads the file.

If the comparisons show no change, it sets `download_changed=False`.
It then returns before reading the response body in its download loop.
Otherwise, it reads the body and normally replaces the cached file.
It also updates the saved metadata.

Both processors depend on metadata from the server.
But `URLDownloaderPython` can avoid reading the full response body even when a server ignores conditional requests.
The server must still supply stable, useful response headers for these comparisons.

In my experience, `URLDownloaderPython` gives better results when checking for updates.
But `URLDownloader` remains much more widely used.
A scan of the official AutoPkg recipe index on 28 September 2026 found 4,837 recipes directly using `URLDownloader`.
Only 96 directly used `URLDownloaderPython`.

### URLDownloader in AutoPkg 3.0 RC5

In AutoPkg 3.0 RC5, `URLDownloader` combines conditional GET requests with checks against cached metadata.
It compares response headers with the metadata in `<pathname>.info.json`.

A 304 response shows no change.
A 200 response can also count as unchanged when the metadata comparisons find no difference.

## Caching update metadata

My workflow caches the metadata needed for update checks instead of every full installer.
This keeps the cache small and reduces the time needed to restore it to a temporary runner.

I use `actions/cache@v5` in GitHub Actions to save and restore this metadata.
It includes the extended attributes used by `URLDownloader` and the `.info.json` files used by `URLDownloaderPython`.

The workflow must skip later processing for unchanged apps when using placeholder files.
Otherwise, it could treat a placeholder as a real installer.

The workflow creates nonempty placeholder files at the expected cache paths.
These satisfy the processors' checks that cached files exist.

AutoPkg's `--check` mode stops the check run at `EndOfCheckPhase`.
The workflow then reads `download_changed` to decide whether it needs a full recipe run.
Scott Blake explains this approach in [Unlocking AutoPkg's Check Mode](https://macadminmusings.com/blog/2025/11/22/unlocking-autopkgs-check-mode/).

While waiting for the stable release of AutoPkg 3.0, I use `URLDownloaderPython` with this caching approach.
In my environment, this reduced the run for 80 app titles from 84 minutes to 24 minutes.
