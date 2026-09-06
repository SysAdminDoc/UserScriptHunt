# ScriptHunt research
Date: 2026-07-25. Replaces all prior research.

## Executive Summary

[Verified] ScriptHunt v0.5.1 is a static, single-file/PWA userscript discovery and vetting tool. It searches seven catalogs, normalizes and deduplicates results, exposes metadata, permissions, trust and scan evidence, tracks favorites/installed state, supports saved searches and comparison, and keeps recent search/scan caches locally (`README.md`, `index.html:1147-1345`, `index.html:683-900`). Local QA on 2026-07-25 passed 7 Node tests and 57 Playwright tests; `npm audit --json` reported zero advisories for the installed dependency tree. Its strongest shape is the evidence-first, local-only catalog workflow. The highest-value direction is to make every trust boundary explicit and reliable before adding more catalogs: secure the optional proxy, prevent failed downloads from looking clean, formalize source completeness and provenance, make imports recoverable, and reconcile release truth.

- P0. Secure the optional CORS Worker against redirect allowlist bypass, oversized upstream bodies, and misleading success statuses (impact 5, M, leapfrog trust).
- P0. Make failed, empty, non-userscript, and stale scan results explicitly unknown instead of allowing a failed response to earn a clean score (impact 5, M, root-cause security).
- P1. Introduce a source result envelope with partial-result, latency, route, cache, and error provenance; the current registry and adapter fixtures are the right seam (impact 5, L, parity plus reliability).
- P1. Separate trust score from scan state and expose code hash, fetch time, dependency status, and source evidence so “no pattern found” is not read as “safe” (impact 5, M, leapfrog trust).
- P1. Add safe dependency-chain and integrity evidence for `@require`/`@resource`, using bounded HTTPS fetches and no execution (impact 5, L, leapfrog security).
- P1. Make public-proxy data exposure and per-source routing visible and user-controllable (impact 4, M, privacy/reliability).
- P1. Preview, merge, snapshot, and roll back installed/favorite imports instead of replacing local state after normalization (impact 4, M, data safety).
- P1. Make GitHub repository/code modes and `incomplete_results`/1,000-result limits visible (impact 4, M, search correctness).
- P1. Reconcile `package.json` 0.5.1 with `package-lock.json` root metadata 0.4.1 and make the existing version test cover the release contract (impact 3, S, reproducibility).
- P2/P3. Add exact URL matching evidence, bounded custom-source manifests, offline cache schema/provenance, full responsive accessibility coverage, and a lightweight locale layer after the boundaries above are stable.

## Product Map

- Core workflows: query all or selected catalogs; filter by site, language, license, installs, update age, `@grant`, and risk; sort and progressively load results; inspect install/view/update URLs, metadata, applies-to evidence, trust dimensions, scans, and version history; compare up to three scripts; save searches/favorites and import/export installed state.
- User personas: cautious installers comparing permissions and provenance; power users looking across several catalogs; authors checking reach, metadata, and source health; mobile/PWA users collecting candidates; maintainers debugging proxy, cache, rate-limit, and source-drift failures.
- Platforms and distribution: static GitHub Pages-style hosting and self-hosted HTTPS; browser PWA/service worker with responsive desktop/mobile UI; optional self-hosted Cloudflare Worker for HTML sources; MIT license; no production runtime dependency; Node/Playwright local QA (`README.md`, `package.json`, `cors-proxy/wrangler.toml`).
- Key integrations and data flows: direct JSON APIs for Greasy Fork, Sleazy Fork, GitHub, and ScriptCat; proxied HTML for OpenUserJS, Userscript.Zone, and GitHub Gists; public proxy fallback or a local custom proxy; `localStorage` for preferences, token, favorites, installed state, saved searches, and source health; IndexedDB with localStorage fallback for recent searches and scan results; service-worker shell cache.
- Product boundary: ScriptHunt finds and evaluates candidates; it deliberately does not execute scripts, manage browser permissions, host source history, or provide accounts/server-side user state.

## Competitive Landscape

- [Tampermonkey](https://www.tampermonkey.net/): mature update/download URL handling, import/export, sync, permissions, editor, syntax checks, and debugging. Learn: provenance, backup, compatibility help, and exact update semantics are expected. Avoid: becoming an executor, editor, or cloud-sync manager.
- [Violentmonkey](https://github.com/violentmonkey/violentmonkey): active open-source manager with cloud sync and a live request for configurable discovery sources ([#2540](https://github.com/violentmonkey/violentmonkey/issues/2540)); its integrity-check request ([#1558](https://github.com/violentmonkey/violentmonkey/issues/1558)) reinforces the supply-chain gap. Learn: source configuration and dependency evidence are real user needs. Avoid: extension-only runtime and permission complexity.
- [ScriptCat](https://github.com/scriptscat/scriptcat): combines a catalog/manager with sync, subscriptions, collaboration, editor/debugging, and localized documentation; its import/export discussion shows backup interoperability pressure ([#1525](https://github.com/scriptscat/scriptcat/issues/1525)). Learn: migration and localization affordances. Avoid: team/cloud/background execution scope.
- [Greasemonkey](https://github.com/greasemonkey/greasemonkey): Firefox-focused manager whose backlog includes antifeature display ([#3095](https://github.com/greasemonkey/greasemonkey/issues/3095)) and backup/device concerns. Learn: negative metadata and recovery deserve first-class treatment. Avoid: manager-specific runtime behavior.
- [Userscripts](https://github.com/quoid/userscripts) and [Stay](https://github.com/shenruisi/Stay): Safari/iOS/macOS managers expose local-file workflows, mobile constraints, update URL/provenance issues, and dependency lifecycle questions ([Userscripts #836](https://github.com/quoid/userscripts/issues/836), [Stay #77](https://github.com/shenruisi/Stay/issues/77)). Learn: constrained-device rendering and recoverable local data. Avoid: native/App Store packaging as the primary product direction.
- [Shieldmonkey](https://github.com/Shieldmonkey/Shieldmonkey) and [ScriptFlow](https://github.com/kusoidev/ScriptFlow): security-first and developer-workspace approaches. Learn: make evidence auditable and offer handoff links. Avoid: IDE, Git workspace, or execution features that dilute catalog focus.
- [Greasy Fork](https://greasyfork.org/en/help/api), [Userscript.Zone](https://www.userscript.zone/), and [ScriptCat search](https://scriptcat.org/en/search): direct catalog APIs/HTML catalogs supply the strongest discovery value, but source markup/API behavior is outside ScriptHunt’s control. Learn: preserve source attribution, locale, site scope, and catalog-specific evidence. Avoid: assuming one schema or adding fragile catalogs before adapter contracts are stronger.
- [Sourcegraph code search](https://sourcegraph.com/docs/code-search/features) and [SearXNG’s search API](https://docs.searxng.org/dev/search_api.html): adjacent systems make query context, source boundaries, and monitoring explicit. Learn: represent partiality and query scope rather than silently merging incomparable results. Avoid: server-scale indexing and opaque ranking.

## Security, Privacy, and Reliability

- [Verified, high risk] `cors-proxy/worker.js:31-47` validates only the initial hostname, then uses `redirect: 'follow'`, buffers the entire upstream response with `resp.text()`, converts every upstream outcome to HTTP 200, and has no upstream failure/size guard. OWASP recommends positive allowlists plus disabling or revalidating redirects for SSRF defenses; Cloudflare documents redirect/subrequest and memory limits and warns against unbounded `response.text()` buffering ([OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_ForgERY_Prevention_Cheat_Sheet.html), [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/), [Cloudflare best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)).
- [Verified, high risk] `index.html:2115-2146` checks size but not `Response.ok` or content type before scanning a direct install URL. A non-2xx HTML error page can therefore be parsed as code and receive a scan result; `scanCode` and `computeTrust` also have numeric defaults for unscanned data (`index.html:1517-1653`). This is a trust-calibration defect, not evidence that the script is safe. The userscript security study from KU Leuven found malicious and vulnerable scripts at meaningful scale, supporting conservative unknown states rather than binary automated verdicts ([study PDF](https://www.cs.kuleuven.be/publicaties/rapporten/cw/CW657.pdf)).
- [Likely privacy exposure] `index.html:636-646` falls back through public third-party proxies for OpenUserJS, Userscript.Zone, and Gists. The project does not claim server-side persistence, but proxy operators necessarily receive the target URL and request timing; the current UI only shows the selected proxy after a successful source response. Route disclosure, opt-out, and custom-proxy preference need to be explicit (`README.md`, `index.html:420-430`).
- [Verified] The scanner identifies broad `@match`/`@include`, `@connect`, antifeatures, floating/pinned dependencies, and some integrity markers, but it does not fetch or verify dependency contents (`index.html:1380-1515`). [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity) and open manager requests for cryptographic checks make dependency provenance a concrete gap. Never turn a heuristic finding count into a safety guarantee.
- [Verified] Applies-to evidence is host-level: `buildAppliesToEvidence` extracts the host and tests `@match`/`@include` patterns without simulating URL scheme, port, or path (`index.html:2200-2280`). That is useful as a site hint but can overstate exact coverage; `@match` is intentionally stricter than broad `@include` patterns in manager documentation and community guidance ([Violentmonkey metadata](https://violentmonkey.github.io/api/metadata-block/), [Stack Overflow](https://stackoverflow.com/questions/31817758/what-is-the-difference-between-include-and-match-in-userscripts)).
- [Verified] Custom source templates require HTTPS and `{query}` but infer arbitrary response fields and do not declare response limits, pagination, partiality, or route privacy (`index.html:1306-1345`). They are a useful constrained extension seam; arbitrary JavaScript plugins would expand the attack surface unnecessarily.
- [Verified] Imports validate URL protocols and skip invalid rows, but `setInstalledScripts` replaces the installed list after parsing and there is no pre-import snapshot, conflict preview, or selective rollback (`index.html:1043-1101`, `index.html:1177-1225`). Existing manager/community signals treat backup and restore as a user-safety requirement, not a cosmetic convenience ([ScriptCat #1525](https://github.com/scriptscat/scriptcat/issues/1525), [backup discussion](https://www.reddit.com/r/userscripts/comments/14dhx9i/looking_for_very_simple_userscript_manager/)).
- [Verified] Release metadata is inconsistent: `package.json:3` is 0.5.1 while `package-lock.json:3` and its root package entry are 0.4.1; the current `tests/version-drift.test.js` does not inspect the lockfile. NPM documents that `npm ci` requires package and lock dependencies to be synchronized and that the lockfile is the reproducibility contract ([npm ci](https://docs.npmjs.com/cli/v8/commands/npm-ci/)). This mismatch was not shown to break the current local test run, but it is a release-integrity defect.
- [Verified baseline] Existing protection is substantial: escaped text/attribute helpers, URL filtering, hostile fixtures, CSP, source suspension, cache diagnostics, service-worker update UX, preference migration, and focus/keyboard tests are present. Existing `ROADMAP.md` already owns Google Fonts, per-fetch abort propagation, CSP `document.write`, PWA icon sizes, GitHub token storage, service-worker stale-update messaging, and source-toggle debounce; none are duplicated below.
- [Verified dependency check] On 2026-07-25, `npm audit --json` reported zero advisories and the installed Playwright test package was 1.61.1. NVD lists Playwright versions below 1.55.1 as affected by CVE-2025-59288, so the current resolved version is above that fixed floor; dependency drift still needs an intentional maintenance contract ([NVD CVE-2025-59288](https://nvd.nist.gov/vuln/detail/CVE-2025-59288), [Playwright release notes](https://playwright.dev/docs/release-notes)).

## Architecture Assessment

- Preserve the static single-file/PWA architecture, but make the existing seams executable: a source capability/response envelope around `SOURCES` and `executeSearch`; a bounded proxy client; a render/URL policy around `esc`, `attr`, `safeUrl`, and `safeHref`; a scan/dependency evidence service around `fetchAndScan`, `parseMetaBlock`, and `computeTrust`; and a versioned storage/restore service around preferences, imports, IndexedDB, and localStorage fallbacks.
- `index.html:1147-1345` should be the source registry for source ID, label, direct/proxy route, page size, locale capability, response mapping, pagination, partiality, and diagnostics. `tests/source-docs.test.js` currently checks names/counts and page sizes but not the full contract; generated or contract-tested documentation will prevent another code/README/repository-metadata drift cycle.
- `fetchViaProxy` and `cors-proxy/worker.js` need distinct boundaries: the browser should know whether a response is direct, public-proxy, or custom-proxy; the Worker should enforce target/redirect/body/status policy; diagnostics should record route, timing, cache hit, and failure class without recording tokens or raw script bodies.
- `parseMetaBlock` should remain permissive for discovery, but its result should carry warnings and evidence state: malformed/unsupported directives, exact applies-to simulation status, `@grant`/`@connect`, antifeatures, dependency pin/integrity, scan timestamp, source URL, and content hash.
- Storage migration already exists for preferences (`PREF_SCHEMA_VERSION`), but installed/favorite import schemas and offline/scan cache records need the same versioned, recoverable treatment. An import should create a local snapshot before mutation; cache migrations should preserve the newest valid IndexedDB/localStorage entry and explain stale or partial data.
- Test seams are already usable: `tests/worker.test.js` for proxy policy, `tests/adapter.spec.js` for normalized fixtures and drift shapes, `tests/smoke.spec.js` for user-visible flows, `tests/version-drift.test.js` for release truth, and `tests/canary.test.js` for opt-in live source checks. Add targeted cases instead of adding a runtime dependency or remote CI; `Roadmap_Blocked.md` explicitly rules out GitHub Actions.
- Category audit: security and privacy are P0/P1; accessibility and mobile are covered by the P2 viewport/theme/popover matrix; i18n/l10n is a lightweight P3 UI-string layer plus existing localized catalog metadata; observability is the source envelope/diagnostics work; testing/docs/distribution are embedded in the contract and release items; constrained custom-source manifests cover the plugin ecosystem without executable plugins; offline/resilience and migration are separate P2/P1 items; upgrade strategy remains the existing service-worker update row plus release/version reconciliation; multi-user/cloud sync is intentionally rejected.

## Rejected Ideas

- Full userscript-manager replacement, script execution, browser permission management, or native mobile packaging. The product boundary and the mature manager products already cover those jobs ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [ScriptCat](https://docs.scriptcat.org/en/), [Userscripts](https://github.com/quoid/userscripts)).
- Accounts, reviews, comments, reputation, team collaboration, or cloud sync. They contradict the local-only/no-server-state posture and belong to catalog/manager products; ScriptCat demonstrates the scope expansion that would result ([ScriptCat sync](https://docs.scriptcat.org/docs/use/sync/)).
- Arbitrary JavaScript adapter plugins. The current HTTPS JSON template seam is sufficient for extensibility; executable adapters would run untrusted code inside the discovery surface (`index.html:1306-1345`).
- A new wave of fragile HTML catalogs before existing source contracts are hardened. OpenUserJS’s unresolved API/cache issues show why stronger adapters and proxy observability have higher leverage ([OpenUserJS #77](https://github.com/OpenUserJs/OpenUserJS.org/issues/77)).
- Server-side scheduled monitors or push notifications. Saved-search refresh and delta badges already exist (`index.html:2920-3070`), while reliable background execution would require a service and account/privacy model; keep this under consideration rather than promising browser-background behavior.
- Opaque ML/vector ranking. Current scale supports deterministic, explainable popularity/freshness/metadata/security dimensions; adding a model would increase maintenance and privacy cost without evidence that ranking, rather than provenance, is the binding problem ([OpenSSF Scorecard](https://openssf.org/scorecard/), [code-search survey](https://arxiv.org/abs/2204.02765)).
- Full UI localization framework. A small locale layer is retained as P3, but a large translation/runtime framework is not justified while the UI is a single-file zero-runtime-dependency app and the only current language control is catalog/metadata selection (`index.html:466-472`, `index.html:2151-2160`).
- Remote CI workflows. Explicitly excluded by `Roadmap_Blocked.md`; keep the local `npm run qa` contract.

## Sources

### Project

- https://github.com/SysAdminDoc/UserScriptHunt

### Catalogs, Managers, Issues, and Community

- https://greasyfork.org/en/help/api
- https://www.userscript.zone/
- https://scriptcat.org/en/search
- https://docs.scriptcat.org/en/
- https://docs.scriptcat.org/docs/use/sync/
- https://www.tampermonkey.net/
- https://www.tampermonkey.net/changelog.php
- https://www.tampermonkey.net/documentation.php
- https://github.com/violentmonkey/violentmonkey
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/1558
- https://github.com/greasemonkey/greasemonkey
- https://github.com/greasemonkey/greasemonkey/issues/3095
- https://github.com/scriptscat/scriptcat
- https://github.com/scriptscat/scriptcat/issues/1525
- https://github.com/quoid/userscripts
- https://github.com/quoid/userscripts/issues/836
- https://github.com/shenruisi/Stay
- https://github.com/Shieldmonkey/Shieldmonkey
- https://github.com/kusoidev/ScriptFlow
- https://github.com/OpenUserJs/OpenUserJS.org/issues/77
- https://github.com/awesome-scripts/awesome-userscripts
- https://www.reddit.com/r/userscripts/comments/14dhx9i/looking_for_very_simple_userscript_manager
- https://stackoverflow.com/questions/31817758/what-is-the-difference-between-include-and-match-in-userscripts

### Standards, Platform APIs, and Security Guidance

- https://violentmonkey.github.io/api/metadata-block/
- https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity
- https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://developer.chrome.com/docs/extensions/reference/api/userScripts
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://developers.cloudflare.com/workers/examples/cors-header-proxy/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- https://developer.mozilla.org/en-US/docs/Web/API/Request/redirect
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_ForgERY_Prevention_Cheat_Sheet.html
- https://openssf.org/scorecard/

### Adjacent Systems and Research

- https://sourcegraph.com/docs/code-search/features
- https://docs.searxng.org/dev/search_api.html
- https://www.cs.kuleuven.be/publicaties/rapporten/cw/CW657.pdf
- https://arxiv.org/abs/2204.02765

### Dependency and Advisory References

- https://playwright.dev/docs/release-notes
- https://docs.npmjs.com/cli/v8/commands/npm-ci/
- https://docs.npmjs.com/cli/v6/configuring-npm/package-locks/
- https://nvd.nist.gov/vuln/detail/CVE-2025-59288

## Open Questions

- None.
