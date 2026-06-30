# Roadmap

## Research-Driven Additions

### P3
- [ ] P3 — Add custom source templates for power users
  Why: Manager users request configurable discovery sources, and ScriptHunt's source registry can support constrained templates without a plugin marketplace.
  Evidence: Violentmonkey custom search sources issue; `index.html` `SOURCES` registry.
  Touches: `index.html` source registry, settings/import/export schema, validation, docs.
  Acceptance: users can add a validated JSON/API or URL-template source that maps into `ScriptResult`, with unsafe templates rejected.
  Complexity: XL

- [ ] P3 — Add companion bookmarklet/import flow for current-site context
  Why: Browser-context discovery is useful, but a full extension is heavier than the project needs right now.
  Evidence: Userscript-Plus current-site discovery; existing bookmarklet; rejected extension-manager scope.
  Touches: `index.html` bookmarklet, URL state, import/history schema.
  Acceptance: bookmarklet opens ScriptHunt with the current URL/domain, optional installed-list import marks known scripts, and no browser extension is required.
  Complexity: M

## Research-Driven Additions

### P2
### P3
- [ ] P3 - Add optional live source canaries for adapter drift
  Why: HTML-scraped sources can change markup without breaking deterministic fixtures, leaving failures visible only to users.
  Evidence: `tests/fixtures/source-adapters.js`, OpenUserJS search HTML path, Userscript.Zone scrape path, Gist search scrape path.
  Touches: `tests/`, `package.json`, README verification docs.
  Acceptance: a local opt-in command exercises one low-volume query per proxied source, records pass/fail diagnostics without secrets, and is excluded from the default deterministic test suite.
  Complexity: S

## Research-Driven Additions

### P1

- [ ] P1 — Expose installed update and dependency provenance
  Why: Userscript managers repeatedly show confusion around `@updateURL`, `@downloadURL`, install URL fallback, and cached `@require` dependencies; ScriptHunt has the data but not a dedicated installed-script provenance view.
  Evidence: Tampermonkey#2015, Tampermonkey#2797, quoid/userscripts#248, violentmonkey#2453; `index.html:866`, `index.html:1180`.
  Touches: `index.html` installed-state rendering, metadata scan findings, import/export schema, `tests/smoke.spec.js`.
  Acceptance: installed matches display install/download/update URL status, warn when hosts or extensions disagree, call out floating or cache-prone `@require` URLs, and preserve this provenance in exported installed-script data.
  Complexity: M

### P2
- [ ] P2 — Add manager backup import preview adapters
  Why: Generic installed-list import is not enough for users migrating from real managers, where per-script includes/excludes and settings can be lost.
  Evidence: ScriptCat#1484, ScriptCat#1483, violentmonkey#2169; `index.html:985`, `README.md:235`.
  Touches: `index.html` import parser/preview UI, import/export schema, `tests/smoke.spec.js`, README import docs.
  Acceptance: imports recognize ScriptHunt JSON plus at least two manager-style backup shapes via fixtures, show a preview with valid/invalid/skipped counts before committing, preserve include/exclude/update metadata where present, and never import executable code into storage.
  Complexity: L

- [ ] P2 — Explain browser site-access failures separately from `@connect`
  Why: `GM_xmlhttpRequest` can fail because the browser denied extension site access even when `@connect` metadata is correct, which current risk labels do not explain.
  Evidence: violentmonkey#2263, ScriptCat#1476; `index.html:1161`, `index.html:1190`.
  Touches: `index.html` scan findings, trust details, diagnostics copy, `tests/smoke.spec.js`.
  Acceptance: scan results distinguish script-declared `@connect` risk from manager/browser site-access requirements, diagnostics includes a non-secret troubleshooting hint, and tests cover `GM_xmlhttpRequest` plus explicit `@connect` hosts.
  Complexity: S

- [ ] P2 — Make source capability truth executable
  Why: The app supports seven sources, README reflects seven, but the GitHub repo description still advertises four; source facts should not be hand-synced across code, docs, and distribution metadata.
  Evidence: `index.html:1033`, `README.md:93`, `gh repo view SysAdminDoc/UserScriptHunt`.
  Touches: `index.html` source registry, README source table/check script, package scripts, repository metadata update command.
  Acceptance: each source declares endpoint type, proxy/CORS mode, page size, locale support, and metadata confidence in code; a local check fails when README source docs drift; the GitHub repo description is updated to match current source coverage.
  Complexity: M

- [ ] P2 — Improve GitHub discovery controls and rate-limit clarity
  Why: GitHub repository/code search is valuable but broad, capped, and rate-limited; power users need controls that map to GitHub's documented qualifiers without editing raw queries.
  Evidence: GitHub Search API docs; GitHub REST rate-limit docs; `index.html:1453`, `index.html:1556`.
  Touches: `index.html` GitHub source query builder, settings/status UI, URL state, `tests/smoke.spec.js`.
  Acceptance: users can constrain GitHub results by filename/extension/user.js, repo/code mode, forks/archived status, stars or updated date; rate-limit status explains remaining budget and result-cap behavior without exposing tokens.
  Complexity: M

- [ ] P2 — Add accessibility regressions for popovers and mobile states
  Why: Current tests cover key controls, but dense popovers, diagnostics, saved searches, comparison, and mobile layouts need regression checks before more controls are added.
  Evidence: `tests/smoke.spec.js:183`, `tests/smoke.spec.js:325`, `tests/smoke.spec.js:354`; Playwright accessibility testing docs.
  Touches: `tests/smoke.spec.js`, `index.html` labels/focus handling/responsive CSS.
  Acceptance: desktop and mobile Playwright tests verify accessible names, focus return, Escape behavior, aria-expanded/aria-live states, and no clipped primary controls across bookmarklet, saved-search, diagnostics, cache, and comparison surfaces.
  Complexity: M

- [ ] P2 — Normalize license and provenance evidence
  Why: License filters currently depend on source strings, while catalogs and GitHub expose inconsistent license names that should be normalized without hiding unknowns.
  Evidence: Greasy Fork API docs; GitHub Search API docs; `README.md:64`, `index.html:2202`.
  Touches: `index.html` normalizers/filter logic/export schema, `tests/adapter.spec.js`, README source capability docs.
  Acceptance: common SPDX aliases normalize to stable filter values, unknown/custom licenses remain visible as `unknown` or source text, exports include raw and normalized license/provenance fields, and adapter tests cover each source.
  Complexity: S

## Research-Driven Additions

### P1
- [ ] P1 — Add @require and @resource integrity evidence
  Why: Remote dependencies can change independently of the userscript, and current trust scoring distinguishes pinned/floating URLs but not hash or integrity evidence.
  Evidence: Greasemonkey#2349, Tampermonkey documentation, MDN Subresource Integrity; index.html:1168, index.html:1798.
  Touches: index.html metadata scanner/trust dimensions, metadata viewer, tests/smoke.spec.js.
  Acceptance: scans recognize integrity/hash fragments or supported integrity directives for @require/@resource, warn on remote dependencies with no version or integrity evidence, display positive integrity evidence, and cover pinned/hashless/hashed fixtures.
  Complexity: M

### P2
- [ ] P2 — Add metadata compatibility lint with fix guidance
  Why: Manager ecosystems disagree on valid @connect, @match, @include, and license/antifeature semantics, and ScriptHunt should explain actionable metadata problems rather than only risk severity.
  Evidence: ScriptCat#1451, Tampermonkey#1593, Tampermonkey#1864, Greasemonkey#3095, OpenUserJS#1971; index.html:1154, index.html:2355.
  Touches: index.html metadata parser/viewer, security findings, result-card warnings, tests/smoke.spec.js.
  Acceptance: metadata viewer surfaces compatibility warnings for invalid wildcard/TLD patterns, @connect wildcard misconceptions, missing/unknown license guidance, antifeature labels, and malformed directives, with tests for each warning and no blocking of valid scripts.
  Complexity: M

- [ ] P2 — Version local preference storage and migrations
  Why: Preferences, source health, saved searches, caches, favorites, and installed lists live in separate storage keys without a migration/reset model, making future schema changes risky.
  Evidence: ScriptCat#1517; index.html:504, index.html:840, index.html:910, index.html:2544, index.html:3281.
  Touches: index.html storage helpers, diagnostics/reset controls, import/export schema, tests/smoke.spec.js.
  Acceptance: storage includes a schema version, migration path, and diagnostics summary; users can reset preferences/source health without deleting favorites or installed data; tests cover migration from current keys and corrupted preference recovery.
  Complexity: M

### P3
- [ ] P3 — Add source version-history and diff handoff links
  Why: Users deciding whether to install or update need a quick path to source history, but ScriptHunt should link to catalog/GitHub history instead of hosting script versions itself.
  Evidence: OpenUserJS#1023, Tampermonkey#2015, GitHub Search API docs; index.html:1438, index.html:1473, index.html:1573.
  Touches: index.html source normalizers/result cards/comparison modal, adapter fixtures, README source notes.
  Acceptance: result cards show source-history or diff links when a source provides a stable history/repository URL, omit them otherwise, and tests cover Greasy Fork, GitHub repository/code, and scrape-only fallback behavior.
  Complexity: M

## Research-Driven Additions

### P1
- [ ] P1 - Harden untrusted rendering and URL sinks
  Why: ScriptHunt renders third-party catalog and metadata fields through many dynamic HTML and URL sinks; current escaping helpers need a central policy and hostile fixtures.
  Evidence: `index.html:2287`, `index.html:2364`, `index.html:2470`, `index.html:3055`; MDN Trusted Types API.
  Touches: `index.html` render helpers/result cards/status chips/metadata panels/favorites/imports, `tests/smoke.spec.js`, `tests/adapter.spec.js`.
  Acceptance: malicious source names/descriptions/metadata/URLs render as inert text, unsafe URL protocols are rejected or disabled, Trusted Types-compatible helper/policy is used when available, and Playwright tests cover card, metadata, saved-search, favorite, and source-status sinks.
  Complexity: M

### P2
- [ ] P2 - Add release and version drift checks
  Why: Version truth is manually repeated across the app, service worker cache, package, README badge, and changelog, so releases can silently ship stale cache names.
  Evidence: `index.html:377`, `package.json:3`, `sw.js:1`, `README.md:3`, `CHANGELOG.md:5`.
  Touches: `tests/`, `package.json`, `index.html`, `sw.js`, `README.md`, `CHANGELOG.md`.
  Acceptance: a local test/check fails when app/package/README/changelog/service-worker versions drift, confirms the service-worker cache name matches the app version, and runs through `npm run qa` without adding GitHub Actions.
  Complexity: S

- [ ] P2 - Add diagnostics snapshot replay fixtures
  Why: Source/proxy failures are currently copyable but not replayable, making reported failures harder to turn into deterministic regressions without secrets.
  Evidence: `index.html:3498`, `tests/adapter.spec.js:136`, Violentmonkey#2263, ScriptCat#1476.
  Touches: `index.html` diagnostics schema/sanitizer, `tests/smoke.spec.js`, `tests/fixtures/source-adapters.js`, README diagnostics notes.
  Acceptance: diagnostics exports include a schema version and sanitized replay section; a local fixture/test can load a diagnostics snapshot to recreate source status/rate-limit/proxy/cache states; tokens and custom proxy URLs remain redacted.
  Complexity: M
