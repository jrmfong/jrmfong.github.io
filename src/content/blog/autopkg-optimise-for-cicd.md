# AutoPkg: Optimisation for CI/CD

As I mentioned in my [previous post](https://jrmfong.github.io/blog/my-journey-with-autopkg/), I’ll cover some of the challenges I encountered and how I found solutions.

## Challenge 1: Community recipes

It’s great that so many recipes are readily available for a wide range of apps. However, vendors sometimes change a download URL, update a signing certificate (for example, after rebranding), or change the update format from a DMG to a PKG. Each of these changes can mean that a recipe needs to be updated or even rewritten.

We simply cannot expect any community maintainers to have an SLA for fixing recipes. With patching windows getting shorter, we can’t always wait for a community recipe to be updated. A private repository lets us maintain recipes to meet our own SLA, avoid duplicating existing recipes, and include settings that may involve sensitive security controls.

I also maintain a public AutoPkg recipe repository. To help the community, it may be worthwhile to setup a GitHub Actions workflow that regularly checks whether recipes are still valid.

## Challenge 2: Checking for updates - the problem with `URLDownloader`

I initially thought I wouldn’t need to manage storage too much because the runner is ephemeral. But as the recipe list grows, reducing build time becomes more important. It helps avoid hitting the six-hour runtime limit, keeps costs down, and most importantly, gets updates to an MDM such as Jamf more quickly.

The first question is: how can we avoid downloading apps when no updates are available? Two processors we use often are `URLDownloader` and `URLDownloaderPython`.

In AutoPkg 2.9.0, `URLDownloader` normally checks for changes as follows which is a simplified version

1. It reads any saved `ETag` and `Last-Modified` values from the cached file’s extended attributes.
2. It sends those values in a GET request as `If-None-Match` and `If-Modified-Since`, respectively.
3. If the server returns `304 Not Modified`, AutoPkg sets `download_changed=False` and retains the cached file.
4. If the server returns `200 OK`, curl downloads the response body. AutoPkg normally replaces the cached file and sets `download_changed=True`. However, 200 means the request succeeded—it does not itself establish that the content changed.

A server that ignores conditional requests can consequently cause repeated downloads, even when its content is unchanged.

`URLDownloaderPython` uses a different decision process:

1. It opens a GET request using Python’s `urllib.request.urlopen()` and inspects the response headers. It does not automatically send conditional headers derived from the previous download.
2. It loads the previous metadata from `<pathname>.info.json`.
3. If the cached file is missing, it decides a download is required.
4. With the default settings, it compares `Content-Length`, `ETag`, and `Last-Modified` against the saved metadata. A difference triggers downloading. Missing metadata can prevent comparisons; if no comparisons succeed, it also downloads.
5. If the comparisons indicate no change, it sets `download_changed=False` and returns before reading the response body in its download loop. Otherwise, it reads the body and normally replaces the cached file and updates the metadata.

Both approaches depend on server-provided metadata. However, `URLDownloaderPython` can avoid consuming the full response body when a server ignores conditional requests but still supplies stable, useful response headers.

In my field experience, `URLDownloaderPython` delivers better results in update checking. Nevertheless, `URLDownloader` remains much more widely used: a scan of the official AutoPkg recipe index on 28 September 2026 found 4,837 recipes directly using `URLDownloader`, compared with just 96 using `URLDownloaderPython`.

In AutoPkg 3.0 RC5, `URLDownloader` improves change detection by combining HTTP conditional GET requests with comparison of response headers against cached metadata in `<pathname>.info.json`. A 304 response indicates no change, while a 200 response can also be classified as unchanged when the metadata comparisons find no difference.

## Challenge 3: Caching

In my workflow, I cache the metadata needed for update checks rather than every full installer. This keeps the cache small and reduces the amount of data and build time that needs to be restored to an ephemeral runner.

I used `actions/cache@v5` in GitHub Actions to save and restore this metadata. This includes the extended attributes used by `URLDownloader` and `.info.json` file used by `URLDownloaderPython`.

The CI workflow also creates nonempty placeholder files at the expected cache paths to satisfy the processors’ file presence checks.

This workaround requires the workflow to skip later processing for unchanged apps, so that a placeholder is never treated as a real installer. This is where AutoPkg’s `--check` mode and `EndOfCheckPhase` come in: the check run stops at that marker, allowing the workflow to inspect `download_changed` and decide whether a full recipe run is necessary. Scott Blake explains this approach in [Unlocking AutoPkg’s Check Mode](https://macadminmusings.com/blog/2025/11/22/unlocking-autopkgs-check-mode/).

While awaiting the stable release of AutoPkg 3.0, I’ve combined `URLDownloaderPython` with this caching approach to improve performance. In my environment, this reduced a full run for 80 app titles from 84 minutes to 24 minutes.

