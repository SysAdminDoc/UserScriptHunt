# Research — ScriptHunt

## Executive Summary
[Verified] ScriptHunt is a zero-backend, single-file static/PWA userscript discovery tool that aggregates Greasy Fork, Sleazy Fork, GitHub repositories/code, OpenUserJS, Userscript.Zone, ScriptCat, and opt-in GitHub Gists with local trust scoring, metadata/security inspection, comparison, favorites, installed-script marking, saved searches, diagnostics, and offline recent-search recovery. Its strongest current shape is privacy-preserving cross-catalog vetting, not manager replacement. The highest-value direction is to make that vetting resilient under real manager metadata, source drift, cache pressure, and migration data. Priority opportunities: cap oversized metadata parsing/rendering; add cache quota diagnostics and recovery controls; harden source adapter failure tests; expose installed-script update/download provenance; recognize manager backup/import formats with preview; explain `@connect` versus browser site-access failures; make source capabilities executable so docs and repo metadata cannot drift; improve GitHub query/rate-limit controls; broaden accessibility regressions; normalize license/SPDX evidence.

## Product Map
- Core workflows: search enabled catalogs; filter by site, language, license, install count, update age, grant, and risk; inspect trust/security/metadata; compare scripts; favorite/export/import; mark installed/update states; save and refresh searches locally.
- User personas: cautious users vetting install risk; power users comparing sources; script authors researching competing implementations; mobile/Safari users saving candidates for later manager install; operators troubleshooting source/proxy failures.
- Platforms and distribution: static GitHub Pages-style app, PWA manifest/service worker, optional Cloudflare Worker CORS proxy, local-only storage, Playwright/Node local test suite, no runtime npm dependencies.
- Key integrations and data flows: JSON APIs for Greasy Fork/Sleazy Fork/GitHub/ScriptCat; proxied HTML scraping for OpenUserJS, Userscript.Zone, and Gists; `localStorage` preferences/tokens/source health/fallback caches; IndexedDB searches and scan cache in `scripthunt-offline-v1`; export/import JSON for favorites and installed scripts.

## Competitive Landscape
- Greasy Fork/Sleazy Fork: strong by-site discovery, API-backed metadata, locale-aware catalogs, and external-script policy. Learn: source-provided applies-to and external dependency rules should be first-class trust evidence. Avoid: forum/review/community features owned by catalogs.
- Tampermonkey: broad commercial-grade manager expectations around configurable search, sync/update flows, local file tracking, and update/download URL semantics. Learn: users need clear install/update provenance. Avoid: manager automation, WebDAV sync, or paid-tier style features in a static discovery app.
- Violentmonkey: active WebExtensions manager with open requests for custom search sources, site-access troubleshooting hints, `@require` cache behavior, mass export, and permission ergonomics. Learn: distinguish script metadata permissions from browser extension permissions. Avoid: extension policy deployment and manager UI replication.
- ScriptCat: active manager/catalog with recent security, migration, backup, Firefox/MV2, and `GM.xmlHttpRequest` permission issues. Learn: migration fidelity and isolation boundaries are trust features. Avoid: background/scheduled script execution and cloud backup ownership.
- quoid/userscripts: Safari/iOS-focused manager work surfaces install/update, directory, iCloud, localization, huge metadata, and `@require` deprecation concerns. Learn: mobile memory limits and large metadata blocks can break otherwise valid scripts. Avoid: platform-specific App Store packaging as ScriptHunt's primary route.
- OpenUserJS, Userscript.Zone, GitHub Gists, and awesome-userscripts: valuable long-tail sources with weaker contracts or scrape-only paths. Learn: adapter diagnostics and drift tests are mandatory before broadening source count. Avoid: treating undocumented HTML selectors as stable.
- SearXNG and OpenSSF Scorecard: adjacent metasearch/trust systems show the value of visible source health and auditable trust dimensions. Learn: trust should explain evidence, not hide it behind one opaque rank. Avoid: ML/vector ranking before deterministic metadata quality is exhausted.

## Security, Privacy, and Reliability
- [Verified] Oversized metadata is not bounded for rendering: `parseMetaBlock` preserves repeated keys at `index.html:1795`, and `.card-metadata` renders full metadata text; quoid/userscripts#899 shows huge `@match` lists can stall userscript tooling.
- [Verified] Cache recovery is incomplete: offline/search and scan caches are capped in code (`index.html:612`, `index.html:614`, `index.html:833`) but there is no UI to inspect quota/usage, clear only scan/offline caches, or recover from browser eviction; MDN StorageManager supports usage/quota estimates.
- [Verified] Adapter tests are mostly success-shape tests: `tests/adapter.spec.js:4` normalizes representative fixtures, while real sources include API rate limits, proxy failures, malformed HTML, empty pages, and scrape drift.
- [Verified] Installed update state lacks full provenance: `applyMetaUrls` stores `downloadURL`/`updateURL` at `index.html:866`, scanner warnings cover host drift at `index.html:1180`, but installed import/update UI does not show the install/download/update tuple that Tampermonkey/quoid users struggle to interpret.
- [Verified] Import validation is safer than prior sessions but not manager-format aware: `parseScriptImportPayload` accepts ScriptHunt schemas, generic `scripts` arrays, and legacy arrays at `index.html:985`; it does not preview Tampermonkey/Violentmonkey ZIP/JSON or ScriptCat backup configuration before import.
- [Verified] Site-access troubleshooting is missing: scanner labels `@connect` risk at `index.html:1161`, but Violentmonkey#2263 and ScriptCat#1476 show browser extension site permissions can still break `GM_xmlhttpRequest` even when script metadata is correct.
- [Verified] Source capability truth can drift: code registers seven sources at `index.html:1033`, README lists seven at `README.md:93`, but `gh repo view` still describes only four sources; docs and repo metadata need an executable check/update path.
- [Verified] Dependency posture is currently clean: `npm audit --json` reports zero vulnerabilities and `@playwright/test` is current at 1.61.1; avoid adding new audit/a11y dependencies unless the benefit beats license and maintenance cost.

## Architecture Assessment
- Keep the single-file architecture, but split internal boundaries conceptually: source capability records, parser limits, storage/cache service, import adapters, and diagnostics payloads can remain in `index.html` while gaining testable seams.
- `index.html:1033` source registry should carry endpoint type, CORS/proxy path, page size, metadata confidence, locale support, and scan capability so UI, diagnostics, README checks, and repo metadata all derive from the same facts.
- `index.html:1795` metadata parsing should normalize repeated/variant directives while enforcing render caps and preserving full data for filtering/scoring.
- `index.html:1762` scan fetching and `index.html:795` cache reads are strong foundations; next work should expose cache state and recovery controls rather than increase concurrency.
- `cors-proxy/worker.js:12` and `cors-proxy/worker.js:54` correctly constrain methods/origins/hosts; custom source/template work must not bypass the same allowlist mentality.
- Testing is broad for UI smoke, Worker allowlists, diagnostics redaction, scan caching, PWA prompts, source toggles, and import validation, but needs edge fixtures for adapter failures, oversized metadata, manager import formats, storage pressure, mobile/popover accessibility, and source-doc drift.
- Category coverage: security, accessibility, testing, docs, distribution, plugin/source extensibility, mobile, offline/recovery, migration, and upgrade strategy remain roadmap-relevant; full multi-user/cloud sync and full UI localization are rejected below because they conflict with the local static product.

## Rejected Ideas
- Full userscript manager replacement — manager sources show valuable risk signals, but ScriptHunt should stay discovery/vetting rather than execute scripts or own browser permissions.
- User accounts, reviews, comments, and cloud sync — Greasy Fork, OpenUserJS, ScriptCat, Tampermonkey, and Violentmonkey already own identity/sync domains; ScriptHunt's privacy value is local-only state.
- Extension-first distribution — Chrome/Firefox WebExtensions `userScripts` and sandbox issues add review and maintenance burden; the existing PWA/bookmarklet/companion-userscript path fits the project better.
- Arbitrary JavaScript adapter plugins — WECG sandbox and ScriptCat Firefox MV2 issues show untrusted code execution boundaries are hard; constrained JSON/API or URL templates are safer.
- Remote CI workflows — repo policy and `Roadmap_Blocked.md` already prohibit GitHub Actions; keep all verification local.
- Full UI localization framework — current value is source locale filtering and localized metadata preservation; a translation framework would add weight to a single-file app without evidence of demand.
- ML/vector ranking — no source showed a current ranking failure that deterministic trust dimensions cannot explain; keep ranking auditable.
- Public-proxy-only strategy — source/proxy failures make a validated self-hosted Worker option necessary.

## Sources
### Project
- https://github.com/SysAdminDoc/UserScriptHunt

### Catalogs, Managers, And Issues
- https://greasyfork.org/en/help/api
- https://greasyfork.org/en/help/external-scripts
- https://www.tampermonkey.net/documentation.php
- https://github.com/Tampermonkey/tampermonkey/issues/2015
- https://github.com/Tampermonkey/tampermonkey/issues/2797
- https://violentmonkey.github.io/api/metadata-block/
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/2263
- https://github.com/violentmonkey/violentmonkey/issues/2453
- https://github.com/violentmonkey/violentmonkey/issues/2169
- https://github.com/scriptscat/scriptcat/issues/1470
- https://github.com/scriptscat/scriptcat/issues/1476
- https://github.com/scriptscat/scriptcat/issues/1483
- https://github.com/scriptscat/scriptcat/issues/1484
- https://github.com/quoid/userscripts
- https://github.com/quoid/userscripts/issues/248
- https://github.com/quoid/userscripts/issues/871
- https://github.com/quoid/userscripts/issues/899
- https://github.com/OpenUserJs/OpenUserJS.org
- https://www.userscript.zone/
- https://github.com/awesome-scripts/awesome-userscripts
- https://github.com/searxng/searxng
- https://github.com/ossf/scorecard

### Standards, APIs, Proxies, And Testing
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://developer.chrome.com/docs/extensions/reference/api/userScripts
- https://github.com/w3c/webextensions/issues/637
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- https://playwright.dev/docs/accessibility-testing

## Open Questions
- None that block prioritization. ScriptCat install URL stability and exact manager backup shapes should be validated with fixtures when those roadmap items are implemented.
