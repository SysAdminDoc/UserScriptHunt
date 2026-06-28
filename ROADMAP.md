# Roadmap

## Research-Driven Additions

- [ ] P2 — Expose transparent trust-score dimensions
  Why: Trust scoring is useful only if users can see which evidence drove the score.
  Evidence: `index.html` `computeTrust()`; npms quality/popularity/maintenance model; OpenSSF Scorecard transparency.
  Touches: `index.html` trust model, result cards, compare modal, docs.
  Acceptance: each card can expand trust into popularity, freshness, security, metadata completeness, and source-health dimensions with plain labels.
  Complexity: M

- [ ] P2 — Add locale and language filters for catalog sources
  Why: Full UI i18n is not a fit, but source-level language filtering is directly supported by catalogs.
  Evidence: Greasy Fork language/locale search; rejected full-i18n research finding.
  Touches: `index.html` Greasy Fork/Sleazy Fork adapters, filter UI, URL state.
  Acceptance: users can filter Greasy Fork/Sleazy Fork results by script language/locale without affecting other sources incorrectly.
  Complexity: S

- [ ] P2 — Add GitHub token and rate-limit UI
  Why: GitHub search has strict unauthenticated limits and the current token path is hidden in console/localStorage instructions.
  Evidence: GitHub Search API rate-limit docs; `index.html` `_ghToken`; README token snippet.
  Touches: `index.html` settings UI, token storage, rate-limit status, README.
  Acceptance: users can add/remove a token in-app, see current GitHub rate-limit state, and never export the token in diagnostics.
  Complexity: M

- [ ] P2 — Add CI smoke workflow for static app and Worker
  Why: The app is static, but source/proxy regressions need repeatable checks after every change.
  Evidence: no `.github/` workflow in repo tree; Playwright tests exist but clean run is currently blocked.
  Touches: `.github/workflows/`, `package.json`, `tests/`, `cors-proxy/worker.js`.
  Acceptance: CI runs install, Playwright smoke tests, Worker allowlist tests, and artifact-free status checks on pull requests.
  Complexity: M

### P3
- [ ] P3 — Add saved searches with update checks
  Why: Community requests for RSS/new-script feeds show demand for monitoring new or updated userscripts, but a static app should keep it local.
  Evidence: OpenUserJS RSS issue; existing roadmap saved queries and script-version watcher items.
  Touches: `index.html` saved-query model, localStorage/IndexedDB schema, source polling, notifications UI.
  Acceptance: users can save a query/domain and manually refresh it to see new/updated results since last check.
  Complexity: L

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
- [ ] P2 - Make security scoring manager-aware
  Why: Current scanning catches dangerous code patterns but under-explains manager-specific risks that users see during install.
  Evidence: `index.html:790`, `index.html:918`, Tampermonkey metadata docs, Violentmonkey metadata docs, ScriptCat `GM_download`/`@connect` issue.
  Touches: `index.html` scanner, permission pills, scan panel, compare modal, smoke fixtures.
  Acceptance: scans score broad `@match`/`@include`, enumerate `@connect` hosts, flag update/download URL mismatches, distinguish pinned/versioned `@require` URLs from floating third-party URLs, and show the reasons on cards/panels.
  Complexity: M

- [ ] P2 - Normalize metadata variants and localized keys
  Why: Manager metadata supports localized names/descriptions and additional directive variants that the current parser does not normalize.
  Evidence: `index.html:1258`, Violentmonkey metadata docs, Tampermonkey metadata docs, quoid/userscripts metadata-block proposal.
  Touches: `index.html` `parseMetaBlock()`, metadata viewer, adapter fixtures, grant/risk filters.
  Acceptance: metadata parsing preserves `@name:locale`, `@description:locale`, `@exclude-match`, `@compatible`, `@incompatible`, `@updateURL`, and duplicate array keys, with fixture coverage for each.
  Complexity: M

- [ ] P2 - Version and validate all import/export payloads
  Why: Favorites import currently accepts arbitrary arrays and can persist malformed records or inconsistent URLs.
  Evidence: `index.html:637`, `index.html:647`, `index.html:2237`, quoid/userscripts installURL issue, ScriptCat migration/backup issues.
  Touches: `index.html` favorites export/import, installed-script import model, README import/export docs, Playwright import tests.
  Acceptance: favorites and installed-script exports include schema/version fields, imports validate and normalize records before persistence, invalid rows are reported without aborting valid rows, and legacy array exports still import through a migration path.
  Complexity: M

- [ ] P2 - Add PWA update and cache recovery controls
  Why: The service worker uses cache-first shell behavior without telling users when a new shell is available or when cache recovery was used.
  Evidence: `sw.js`, README PWA feature, MDN StorageManager/offline guidance.
  Touches: `sw.js`, `index.html` toast/status handling, Playwright offline/update smoke tests.
  Acceptance: users see an update-available toast when a new service worker activates, can refresh to the new shell immediately, stale caches are cleared by version, and offline fallback clearly indicates when cached shell content is being served.
  Complexity: M

### P3
- [ ] P3 - Add optional live source canaries for adapter drift
  Why: HTML-scraped sources can change markup without breaking deterministic fixtures, leaving failures visible only to users.
  Evidence: `tests/fixtures/source-adapters.js`, OpenUserJS search HTML path, Userscript.Zone scrape path, Gist search scrape path.
  Touches: `tests/`, `package.json`, README verification docs.
  Acceptance: a local opt-in command exercises one low-volume query per proxied source, records pass/fail diagnostics without secrets, and is excluded from the default deterministic test suite.
  Complexity: S
