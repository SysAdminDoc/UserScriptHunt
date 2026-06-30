# Research - ScriptHunt

## Executive Summary
[Verified] ScriptHunt is a zero-backend, single-file static/PWA userscript discovery and vetting tool for Greasy Fork, Sleazy Fork, GitHub repositories/code, OpenUserJS, Userscript.Zone, ScriptCat, and opt-in GitHub Gists. Its strongest current shape is privacy-preserving cross-catalog search with local trust, metadata, installed-state, saved-search, offline, cache-diagnostics, and source-health workflows. The highest-value direction is trust correctness rather than manager replacement: harden untrusted rendering and URL sinks, expose installed update/download/dependency provenance, add `@require`/`@resource` integrity evidence, preview real manager backups before import, distinguish browser site-access failures from `@connect`, lint manager compatibility pitfalls, make source/version truth executable, improve GitHub discovery controls, version local storage migrations, and add accessibility regressions for dense popover/mobile states.

## Product Map
- Core workflows: search userscript catalogs; filter by site, language, license, installs, freshness, grant, and risk; inspect metadata/security/trust evidence; compare scripts; save favorites/searches; mark installed and updated scripts.
- User personas: cautious installers validating risk; power users comparing competing scripts; script authors checking catalog reach and metadata quality; mobile/Safari users collecting candidates; maintainers debugging proxy/source failures.
- Platforms and distribution: static GitHub Pages/PWA app, optional Cloudflare Worker CORS proxy, local-only browser storage, MIT license, no runtime dependencies, Playwright/Node local QA.
- Key integrations and data flows: JSON APIs for Greasy Fork/Sleazy Fork/GitHub/ScriptCat; proxied scrape paths for OpenUserJS, Userscript.Zone, and Gists; `localStorage` preferences/tokens/source health; IndexedDB search and scan caches; versioned JSON favorites/installed exports.

## Competitive Landscape
- Greasy Fork/Sleazy Fork: strong API, by-site discovery, and external-script policy. Learn: source-provided applies-to, license, and external dependency data should feed trust directly. Avoid: rebuilding catalog comments, moderation, or hosting.
- Tampermonkey: proprietary current manager with mature expectations around update/download URL semantics, sync, backup, and broad manager metadata support. Learn: users need exact provenance and fix guidance. Avoid: sync/editor/automation ownership.
- Violentmonkey: active WebExtensions manager with requests for custom search sources, permission troubleshooting, integrity checks, `@require` cache behavior, local require ideas, and selective import. Learn: discovery-source configuration and permission diagnostics are real user needs. Avoid: extension-only policy deployment and manager UI replication.
- ScriptCat: active manager/catalog with recent issues on malformed metadata warnings, backup/migration, browser permission layers, user preference preservation, and localized script names. Learn: compatibility lint and local state migration are trust features. Avoid: background-script execution and cloud backup scope.
- Greasemonkey: Firefox manager backlog includes `@require`/`@resource` hash-checking, antifeature display, Android backup, and linting. Learn: dependency integrity should be visible even if managers do not enforce it uniformly. Avoid: adopting manager-only runtime behavior.
- quoid/userscripts and Stay: Safari/iOS managers surface mobile install limits, large metadata, update URL, `@require` deprecation, and open-source mobile constraints. Learn: render limits and dependency risk matter on constrained devices. Avoid: App Store packaging as the primary distribution path.
- Shieldmonkey and ScriptFlow: newer managers emphasize security/auditability or developer-suite workflows. Learn: ScriptHunt can borrow evidence-first security and import/editor handoff ideas. Avoid: becoming an IDE or script executor.
- SearXNG/OpenSSF Scorecard-style adjacent systems: metasearch and trust scores work best when source health, ranking inputs, and evidence are auditable. Learn: keep ranking deterministic and explainable. Avoid: opaque ML ranking before metadata quality is exhausted.

## Security, Privacy, and Reliability
- [Verified] `index.html` renders many dynamic HTML strings fed by catalog, metadata, saved-search, diagnostics, and imported data (`index.html:2287`, `index.html:2364`, `index.html:2470`, `index.html:2639`, `index.html:2773`, `index.html:3038`). `esc`/`attr` helpers exist (`index.html:3055`) but there is no sink-level regression test for malicious source names, descriptions, URLs, metadata keys, or saved-search labels; MDN Trusted Types documents this class of DOM sink hardening.
- [Verified] Dynamic `href` sinks use escaped strings but do not have a central URL policy or tests that reject `javascript:`, credentialed, fragment-only, or malformed catalog URLs across cards, metadata links, favorites, and imports (`index.html:1113`, `index.html:2332`, `index.html:2353`, `index.html:3035`).
- [Verified] `index.html:1254` and `index.html:1269` classify pinned/floating `@require` URLs but do not recognize integrity fragments, hash conventions, or positive `@resource` integrity evidence; Greasemonkey#2349 and Violentmonkey#1558 show this is a recurring manager trust issue.
- [Verified] `index.html:1269` detects broad metadata risks but does not lint manager-specific compatibility pitfalls such as `@connect *.domain`, `@match *://example.*/*`, missing/unknown license guidance, and antifeature labels; ScriptCat#1451, Tampermonkey#1593, Greasemonkey#3095, and OpenUserJS#1971 document the same patterns.
- [Verified] Local preferences are independent `sh_pref_*` keys (`index.html:523`) and user data spans separate favorites, installed, saved-search, source-health, IndexedDB, and fallback storage families; ScriptCat#1517 shows preference evolution needs explicit versioning and migration to preserve user overrides.
- [Verified] Source truth can drift across code, README, repository metadata, and service-worker/version strings: `SOURCES` supports seven sources (`index.html:1147`), README lists seven (`README.md:93`), while GitHub repository metadata still advertises four; app/package/cache versions are hand-synced across `index.html:377`, `package.json:3`, `sw.js:1`, `README.md:3`, and `CHANGELOG.md:5`.
- [Verified] Source adapter drift coverage improved in `tests/adapter.spec.js`, but live OpenUserJS, Userscript.Zone, and Gist scrape paths still depend on third-party markup and proxy wrappers; optional live canaries remain useful without making deterministic QA network-dependent.
- [Verified] Dependency posture is clean: `npm audit --json` reports zero vulnerabilities, and `@playwright/test` resolves to 1.61.1.

## Architecture Assessment
- Add a small render/URL safety boundary around existing HTML-building code: central helpers for trusted static icons/templates, escaped text, allowed URL protocols/hosts, and Trusted Types-compatible policies when available.
- Keep the static single-file app, but formalize internal seams: source capability registry, metadata parser/linter, dependency integrity analyzer, storage migration service, adapter fixtures, diagnostics payload schema, and release/version checks.
- `index.html:1147` source definitions should become the executable source of truth for README source docs, diagnostics, repository metadata update commands, and adapter expectations.
- `parseMetaBlock` should remain permissive but pair parsed metadata with warnings: malformed directives, unsupported manager syntax, missing license guidance, antifeature labels, and dependency integrity status.
- Storage should gain a small versioned schema layer over `_prefGet/_prefSet`, favorites, installed scripts, saved searches, source health, and cache fallbacks so upgrades can migrate or reset selectively.
- Existing Worker allowlists in `cors-proxy/worker.js:5` and method checks in `cors-proxy/worker.js:12` are appropriate; custom templates and new source tooling should not bypass them.
- Test gaps: malicious untrusted-render fixtures, URL-sink fixtures, SRI/hash dependency fixtures, metadata lint fixtures, storage migration/reset tests, mobile/popover accessibility regressions, source-doc drift checks, version/cache drift checks, and optional live canaries.
- Category coverage: security, accessibility, i18n/l10n metadata fallback, observability/diagnostics, testing, docs, distribution metadata, plugin/source extensibility, mobile, offline/resilience, migration, and upgrade strategy are covered by current or new roadmap items; full multi-user/cloud sync remains rejected.

## Rejected Ideas
- Re-add metadata display caps as a new item - already implemented with `META_DISPLAY_VALUE_LIMIT`, `META_DISPLAY_CHAR_LIMIT`, and overflow copy at `index.html:645` and `index.html:2478`.
- Re-add cache diagnostics/recovery as a new item - already implemented with StorageManager estimates, cache counts, and separate clear controls at `index.html:896`, `index.html:907`, and `index.html:3291`.
- Full userscript manager replacement - manager issues provide signals, but executing scripts, browser permissions, and sync belong to Tampermonkey, Violentmonkey, ScriptCat, Greasemonkey, quoid/userscripts, or Stay.
- User accounts, reviews, comments, and cloud sync - catalog and manager products own identity; ScriptHunt's differentiator is local-only privacy.
- Extension-first distribution - Chrome `userScripts` and WebExtensions APIs add runtime/review complexity; PWA plus bookmarklet/companion userscript fits better.
- Arbitrary JavaScript adapter plugins - untrusted adapter execution is too risky; constrained URL/API templates are safer.
- OpenUserJS JSON API dependency - OpenUserJS#77 is long-standing and unresolved; harden scrape/proxy paths instead of waiting for it.
- Full source version-control hosting - OpenUserJS#1023 frames this as becoming specialized GitHub; ScriptHunt should link to source history/diffs rather than host versions.
- Remote CI workflows - repo rules and `Roadmap_Blocked.md` prohibit GitHub Actions; keep verification local.
- Full UI localization framework - localized script metadata handling and source locale filters are useful; translating the whole app adds weight without verified demand.
- ML/vector ranking - deterministic trust dimensions remain more auditable at current scale.

## Sources
### Project
- https://github.com/SysAdminDoc/UserScriptHunt

### Catalogs, Managers, And Issues
- https://greasyfork.org/en/help/api
- https://greasyfork.org/en/help/external-scripts
- https://www.tampermonkey.net/documentation.php
- https://violentmonkey.github.io/api/metadata-block/
- https://github.com/Tampermonkey/tampermonkey/issues/2015
- https://github.com/Tampermonkey/tampermonkey/issues/1593
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/2263
- https://github.com/violentmonkey/violentmonkey/issues/2453
- https://github.com/violentmonkey/violentmonkey/issues/1558
- https://github.com/scriptscat/scriptcat/issues/1451
- https://github.com/scriptscat/scriptcat/issues/1476
- https://github.com/scriptscat/scriptcat/issues/1483
- https://github.com/scriptscat/scriptcat/issues/1484
- https://github.com/scriptscat/scriptcat/issues/1517
- https://github.com/greasemonkey/greasemonkey/issues/2349
- https://github.com/greasemonkey/greasemonkey/issues/3095
- https://github.com/quoid/userscripts/issues/871
- https://github.com/quoid/userscripts/issues/899
- https://github.com/OpenUserJs/OpenUserJS.org/issues/77
- https://github.com/OpenUserJs/OpenUserJS.org/issues/1023
- https://github.com/OpenUserJs/OpenUserJS.org/issues/1971

### Competitors, Adjacent Projects, And Awesome Lists
- https://github.com/Shieldmonkey/Shieldmonkey
- https://github.com/awesome-scripts/awesome-userscripts

### Standards, Research, And APIs
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/rest/rate-limit/rate-limit
- https://developer.chrome.com/docs/extensions/reference/api/userScripts
- https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
- https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API

## Open Questions
- None block prioritization. Exact manager backup fixtures should be captured during implementation from exported Tampermonkey, Violentmonkey, and ScriptCat payloads.
