# Research — ScriptHunt

## Executive Summary
[Verified] ScriptHunt is a zero-backend, single-file static/PWA userscript discovery and vetting tool for Greasy Fork, Sleazy Fork, GitHub repositories/code, OpenUserJS, Userscript.Zone, ScriptCat, and opt-in GitHub Gists. Its strongest current shape is privacy-preserving cross-catalog search with local trust, metadata, installed-state, saved-search, and diagnostics workflows. The highest-value direction remains trust and resilience: finish the existing P1 work around oversized metadata, cache recovery, adapter edge tests, and installed provenance, then add dependency integrity analysis, metadata compatibility linting, local preference-schema migration, and source version-history/diff handoff links. Top opportunities in priority order: cap metadata rendering; add `@require`/`@resource` integrity evidence; add cache quota/recovery controls; test adapter failure shapes; expose installed update/download/dependency provenance; lint manager compatibility pitfalls; preview manager backup imports; migrate local preferences safely; make source capability truth executable; add source history/diff links where available.

## Product Map
- Core workflows: search multiple userscript catalogs; filter by site, language, license, installs, freshness, grant, and risk; inspect metadata/security/trust evidence; compare results; save favorites/searches; mark installed/update states.
- User personas: cautious users validating install risk; power users comparing competing scripts; script authors researching source coverage and metadata quality; mobile/Safari users collecting candidates for later install; operators debugging proxy/source failures.
- Platforms and distribution: static GitHub Pages/PWA app, optional Cloudflare Worker CORS proxy, local-only browser storage, MIT license, no runtime dependencies, Playwright/Node local QA.
- Key integrations and data flows: JSON APIs for Greasy Fork/Sleazy Fork/GitHub/ScriptCat; proxied scrape paths for OpenUserJS, Userscript.Zone, and Gists; `localStorage` preferences/tokens/source health; IndexedDB search and scan caches; versioned JSON favorites/installed exports.

## Competitive Landscape
- Greasy Fork/Sleazy Fork: strong API and by-site discovery plus external-script policy. Learn: source-provided applies-to, license, and external dependency data should feed trust directly. Avoid: rebuilding catalog comments/forums/moderation.
- Tampermonkey: mature commercial-grade manager expectations around update/download URL semantics, `@connect` interpretation, SRI-style external dependency handling, and configurable search. Learn: users need exact provenance and fix guidance. Avoid: sync/editor/automation ownership.
- Violentmonkey: active WebExtensions manager with requests for custom site search, permission troubleshooting, `@require` cache behavior, local require ideas, and export. Learn: distinguish discovery source configuration from update URL rewriting, and keep permission diagnostics user-readable. Avoid: extension-only policy deployment and manager UI replication.
- ScriptCat: active manager/catalog with recent issues on malformed metadata warnings, backup/migration, browser permission layers, user preference preservation, and localized names. Learn: compatibility lint and local state migration are trust features. Avoid: background-script execution and cloud backup scope.
- Greasemonkey: Firefox manager backlog includes `@require`/`@resource` hash-checking and antifeature display. Learn: dependency integrity should be visible even if managers do not enforce it uniformly. Avoid: adopting manager-only runtime behavior.
- quoid/userscripts: Safari/iOS manager surfaces huge metadata, update URL, and `@require` deprecation pressure. Learn: render and parse limits matter on mobile. Avoid: App Store packaging as primary distribution.
- OpenUserJS and Userscript.Zone: valuable long-tail catalogs with weak/absent JSON contracts. Learn: source adapter drift, version history, and domain API gaps should be handled explicitly. Avoid: assuming scrape-only sources are stable.
- SearXNG/OpenSSF Scorecard-style adjacent systems: show that metasearch and trust scores work best when source health and evidence are auditable. Learn: keep ranking deterministic and explainable. Avoid: ML ranking before metadata quality is exhausted.

## Security, Privacy, and Reliability
- [Verified] `index.html:1795` parses repeated metadata but `.card-metadata` can still render unbounded text; quoid/userscripts#899 shows large `@match` blocks can exhaust mobile tooling.
- [Verified] `index.html:1168` classifies pinned/floating `@require` URLs but does not recognize integrity fragments, `@require` hash conventions, or `@resource` integrity evidence; Greasemonkey#2349 and Tampermonkey docs show this is an ecosystem trust issue.
- [Verified] `index.html:1154` detects broad patterns but does not lint manager-specific compatibility pitfalls such as `@connect *.domain` versus bare-domain semantics or invalid `@match` TLD wildcards; ScriptCat#1451, Tampermonkey#1593, and Tampermonkey#1864 document these exact cases.
- [Verified] Local preferences are stored as independent `sh_pref_*` keys at `index.html:504` and caches/favorites/installed/saved searches use separate unversioned storage families; ScriptCat#1517 shows preserving user overrides during config evolution needs explicit versioning and migration.
- [Verified] Source adapter tests at `tests/adapter.spec.js:4` are still mostly representative success fixtures; real source failures include 403/429, malformed HTML, empty pages, and proxy wrapper drift.
- [Verified] Installed import/export has schema v1 (`index.html:917`, `index.html:972`) but manager backup preview and per-script include/exclude preservation remain unimplemented.
- [Verified] Source truth drift persists: `index.html:1032` and `README.md:93` support seven sources, while `gh repo view SysAdminDoc/UserScriptHunt` still advertises four.
- [Verified] Dependency posture is clean: `npm audit --json` reports zero vulnerabilities; `@playwright/test` and `playwright` are current at 1.61.1.

## Architecture Assessment
- Keep the static single-file app, but formalize internal seams: source capability registry, metadata parser/linter, dependency integrity analyzer, storage migration service, adapter fixtures, and diagnostics payload.
- `index.html:1032` source definitions should become the executable source of truth for README checks, diagnostics, and repository description updates.
- `parseMetaBlock` should remain permissive but pair parsed metadata with warnings: malformed directives, unsupported manager syntax, missing license guidance, antifeature labels, and integrity status.
- Storage should gain a small versioned schema layer over `_prefGet/_prefSet`, favorites, installed scripts, saved searches, source health, and cache fallbacks so upgrades can migrate or reset selectively.
- Existing Worker allowlists in `cors-proxy/worker.js:5` and method checks in `cors-proxy/worker.js:12` are appropriate; custom templates and new source tooling should not bypass them.
- Test gaps: oversized metadata fixtures, SRI/hash dependency fixtures, metadata lint fixtures, storage migration/reset tests, adapter failure fixtures, mobile/popover accessibility regressions, and source-doc drift checks.
- Category coverage: security, accessibility, i18n/l10n metadata fallback, observability/diagnostics, testing, docs, distribution metadata, plugin/source extensibility, mobile, offline/resilience, migration, and upgrade strategy are covered by current or new roadmap items; full multi-user/cloud sync remains rejected.

## Rejected Ideas
- Full userscript manager replacement — manager issues provide signals, but executing scripts, browser permissions, and sync belong to Tampermonkey/Violentmonkey/ScriptCat/quoid userscripts.
- User accounts, reviews, comments, and cloud sync — catalog and manager products own identity; ScriptHunt’s differentiator is local-only privacy.
- Extension-first distribution — Chrome `userScripts` and WebExtensions sandbox issues add review/runtime complexity; PWA plus bookmarklet/companion userscript fits better.
- Arbitrary JavaScript adapter plugins — WECG/ScriptCat sandbox evidence makes untrusted adapter execution too risky; constrained URL/API templates are safer.
- OpenUserJS JSON API dependency — OpenUserJS#77 is long-standing and unresolved; ScriptHunt should harden scrape/proxy paths instead of waiting for it.
- Full source version-control hosting — OpenUserJS#1023 frames this as becoming specialized GitHub; ScriptHunt should link to source history/diffs rather than host versions.
- Remote CI workflows — repo rules and `Roadmap_Blocked.md` prohibit GitHub Actions; keep verification local.
- Full UI localization framework — localized script metadata handling and source locale filters are useful; translating the whole app adds weight without verified demand.
- ML/vector ranking — deterministic trust dimensions remain more auditable at current scale.

## Sources
### Project
- https://github.com/SysAdminDoc/UserScriptHunt

### Catalogs, Managers, And Issues
- https://greasyfork.org/en/help/api
- https://greasyfork.org/en/help/external-scripts
- https://www.tampermonkey.net/documentation.php
- https://github.com/Tampermonkey/tampermonkey/issues/2015
- https://github.com/Tampermonkey/tampermonkey/issues/1593
- https://github.com/Tampermonkey/tampermonkey/issues/1864
- https://violentmonkey.github.io/api/metadata-block/
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/2263
- https://github.com/violentmonkey/violentmonkey/issues/2453
- https://github.com/scriptscat/scriptcat/issues/1451
- https://github.com/scriptscat/scriptcat/issues/1476
- https://github.com/scriptscat/scriptcat/issues/1483
- https://github.com/scriptscat/scriptcat/issues/1484
- https://github.com/scriptscat/scriptcat/issues/1517
- https://github.com/scriptscat/scriptcat/issues/1496
- https://github.com/greasemonkey/greasemonkey/issues/2349
- https://github.com/greasemonkey/greasemonkey/issues/3095
- https://github.com/quoid/userscripts/issues/871
- https://github.com/quoid/userscripts/issues/899
- https://github.com/OpenUserJs/OpenUserJS.org/issues/77
- https://github.com/OpenUserJs/OpenUserJS.org/issues/1023
- https://github.com/OpenUserJs/OpenUserJS.org/issues/1971
- https://github.com/awesome-scripts/awesome-userscripts

### Standards, Research, And APIs
- https://docs.github.com/en/rest/search/search
- https://developer.chrome.com/docs/extensions/reference/api/userScripts
- https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- https://www.usenix.org/conference/usenixsecurity24/presentation/xie-qinge

## Open Questions
- None block prioritization. Exact manager backup fixtures and ScriptCat install URL stability should be validated during implementation.
