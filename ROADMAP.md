# Roadmap

## Research-Driven Additions

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
