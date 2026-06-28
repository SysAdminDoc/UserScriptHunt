# Research - ScriptHunt

## Executive Summary
ScriptHunt is a static, single-file userscript discovery app that aggregates Greasy Fork, Sleazy Fork, GitHub repositories/code, OpenUserJS, Userscript.Zone, ScriptCat, and opt-in GitHub Gists with local trust scoring, metadata inspection, comparison, favorites, diagnostics, and offline recent-search recovery. Verified: the last ten commits already shipped the previous highest-value gaps around grant filtering, source diagnostics, URL state, adapter fixtures, accessibility, and offline cache, so the next direction is reliability under real source/proxy failure and more truthful manager-aware risk evidence. Priority opportunities: bound and cache raw-script scans; validate/test custom proxies in-app; expand security scoring around `@match`, `@connect`, `@require`, and update URL semantics; parse metadata variants such as localized names and `@exclude-match`; replace the stale remote-workflow roadmap idea with a local QA gate; version all import/export payloads; add PWA update recovery; and add lightweight live source canaries.

## Product Map
- Core workflows: search enabled userscript sources; filter by site/license/installs/freshness/grant/risk; inspect trust/security/metadata; compare scripts; favorite/export/import; recover recent searches offline.
- User personas: cautious users vetting permissions before install; power users comparing competing scripts across catalogs; script authors checking competing implementations; mobile users discovering scripts for later installation in a manager.
- Platforms and distribution: static GitHub Pages-style web app, PWA shell via `manifest.json` and `sw.js`, optional Cloudflare Worker CORS proxy in `cors-proxy/worker.js`, no runtime package dependencies.
- Key integrations and data flows: JSON APIs for Greasy Fork/Sleazy Fork/GitHub/ScriptCat; proxied HTML scraping for OpenUserJS, Userscript.Zone, and Gists; localStorage for preferences/favorites/tokens/source health; IndexedDB/localStorage fallback for recent offline searches; Playwright and Node tests for local verification.

## Competitive Landscape
- Greasy Fork/Sleazy Fork: strong catalog APIs, by-site discovery, locale-aware catalogs, stats, and install metadata. Learn: domain and locale filters should be metadata-backed. Avoid: cloning forum/community features.
- Userscript.Zone and Tampermonkey: good current-site discovery and manager handoff expectations. Learn: URL-context search must distinguish source-provided applies-to data from locally parsed metadata. Avoid: relying on opaque scrape results without diagnostics.
- OpenUserJS: older but still useful catalog with RSS/version-history requests and long migration history. Learn: feed-style update discovery and version diffs are valuable. Avoid: treating undocumented HTML selectors as stable without fixtures and canaries.
- ScriptCat: active manager/catalog with recent issues around migration, backup, Firefox/MV2 compatibility, and `GM_download`/`@connect` security semantics. Learn: manager semantics should feed risk labels. Avoid: turning ScriptHunt into a full manager or cloud backup system.
- Violentmonkey and quoid/userscripts: manager projects define practical expectations for custom search sources, install/update URL normalization, `@require` behavior, and troubleshooting permissions. Learn: normalize install/update/download URLs and explain metadata risk in manager terms. Avoid: adopting extension-only sync/policy features in a static page.
- Userscript-Plus and UserScript-Finder: prove demand for current-site helpers and installed-script awareness. Learn: bookmarklet/import flows are enough for ScriptHunt's static architecture. Avoid: making an extension the primary distribution.
- SearXNG, npms, Socket, and OpenSSF Scorecard: adjacent search/trust systems expose ranking dimensions, source health, and security rationale. Learn: users trust visible evidence more than opaque totals. Avoid: ML/vector ranking before deterministic metadata quality is exhausted.

## Security, Privacy, and Reliability
- Verified risk: `index.html:1291` and `index.html:1324` run grant/risk filters with `Promise.all()` over every visible result; raw-script scans can fan out into many direct/proxy fetches at once, stressing public proxy limits and GitHub/catalog rate limits.
- Verified risk: `index.html:447` and `index.html:457` read a custom proxy URL from localStorage and call it directly; `index.html:10` injects the stored value into CSP without URL validation or a user-visible proxy test.
- Verified risk: `index.html:2237` through `index.html:2244` import favorites as any JSON array and append raw items with only an `id` check; malformed old exports can persist inconsistent URLs or unescaped labels.
- Verified reliability gap: `sw.js` uses cache-first shell behavior and immediate `skipWaiting()`/`clients.claim()` but has no update-available notification or recovery path if cached shell and source code drift.
- Verified parser gap: `index.html:1258` treats only a short list of metadata keys as arrays and does not normalize localized keys (`@name:xx`), `@exclude-match`, or `@compatible`, all documented by manager metadata ecosystems.
- Verified scanner gap: `index.html:790` through `index.html:850` catches common dangerous code and some metadata risk, but does not score broad `@match` patterns, enumerate `@connect` hosts, detect update/download URL mismatches, or distinguish pinned/versioned `@require` URLs.
- Verified privacy posture: preferences, favorites, tokens, source health, and offline search caches are local-only; diagnostics already exclude secrets, but proxy/token configuration still needs safer in-app editing and validation.
- Verified dependency posture: `npm audit --json` reports zero vulnerabilities, `package-lock.json` pins Playwright 1.61.1, and `npm outdated --json` returned no outdated package entries in the checked environment.

## Architecture Assessment
- The source adapter registry in `index.html:724` is the right extension boundary; more sources should wait until scan caching and live adapter canaries exist.
- The CORS proxy path should become a first-class settings boundary: validate scheme/host, test one allowed source and one rejected host, surface response-shape errors, and keep custom URLs out of diagnostics.
- Metadata/security scanning needs a cache keyed by normalized install/update URL plus version/hash, with bounded concurrency and stale invalidation; this preserves static operation while reducing source/proxy pressure.
- Import/export should use versioned schemas for favorites, installed-script lists, and offline cache entries rather than accepting arbitrary arrays.
- PWA update handling belongs in `sw.js` plus a toast/status control in `index.html`, not a backend.
- Testing is strong for deterministic UI behavior, adapter fixtures, Worker allowlists, diagnostics, and offline cache; remaining gaps are local QA orchestration, import schema tests, scan-cache concurrency tests, and optional live canaries for proxied sources.
- Documentation should remove or qualify the existing `ROADMAP.md` remote workflow item because repo rules require local builds/tests and no GitHub Actions workflows.

## Rejected Ideas
- Full backend search service - contradicts the static/no-backend design; use the Worker only for constrained CORS proxying.
- User accounts, reviews, comments, and cloud sync - catalogs and managers already own identity and sync; ScriptHunt should keep user data local.
- Full userscript manager replacement - manager issues are useful evidence, but ScriptHunt should remain discovery and vetting.
- Extension-first distribution - current bookmarklet/PWA flow covers browser-context discovery without Web Store/AMO maintenance.
- Remote build/test workflows - the repo policy forbids GitHub Actions for builds/tests; add local QA scripts instead.
- Full UI localization - source-level locale filters and localized metadata parsing are a better fit than a translation framework in a single-file app.
- ML/vector ranking - no verified need at the current result scale; deterministic trust dimensions are more auditable.
- Public-proxy-only strategy - source failures and proxy limits make a validated self-hosted Worker path necessary.

## Sources
### Project And Local Evidence
- https://github.com/SysAdminDoc/UserScriptHunt

### Direct Competitors And Managers
- https://greasyfork.org/en/help/api
- https://github.com/greasyfork-org/greasyfork
- https://www.userscript.zone/
- https://www.tampermonkey.net/documentation.php
- https://github.com/OpenUserJs/OpenUserJS.org
- https://github.com/OpenUserJs/OpenUserJS.org/issues/2026
- https://github.com/scriptscat/scriptcat/issues/1506
- https://github.com/scriptscat/scriptcat/issues/1484
- https://github.com/scriptscat/scriptcat/issues/1483
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/2263
- https://github.com/violentmonkey/violentmonkey/issues/2453
- https://github.com/quoid/userscripts/issues/836
- https://github.com/quoid/userscripts/issues/871
- https://github.com/quoid/userscripts/issues/817
- https://github.com/jae-jae/Userscript-Plus/issues/63

### APIs, Specs, Proxies, And Trust Systems
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://violentmonkey.github.io/api/metadata-block/
- https://developer.chrome.com/docs/extensions/reference/api/userScripts
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/userScripts
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager
- https://developers.cloudflare.com/workers/platform/limits/
- https://codetabs.com/cors-proxy/cors-proxy.html
- https://allorigins.win/
- https://api-docs.npms.io/
- https://github.com/ossf/scorecard
- https://socket.dev/

## Open Questions
- Does ScriptCat guarantee the `https://scriptcat.org/scripts/code/<id>/...user.js` install URL pattern, or should ScriptHunt treat it as best-effort and cache failures separately?
- Which self-hosted Worker URL, if any, should the public deployment recommend by default?
- Which manager export shapes should installed-script import support first: Tampermonkey ZIP, Violentmonkey ZIP/JSON, quoid/userscripts export, or ScriptCat backup JSON?
