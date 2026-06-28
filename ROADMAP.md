# Roadmap

## Research-Driven Additions

### P2
- [ ] P2 — Normalize install, update, and already-installed state
  Why: Manager projects show install/update URL normalization and installed-script awareness as recurring user needs.
  Evidence: quoid/userscripts installURL issue; Userscript-Plus installed-filter request; current favorites/import code.
  Touches: `index.html` result schema, metadata parser, favorites/import/export schema, install buttons.
  Acceptance: results expose install/update/download URLs consistently, imported installed-script lists mark matches, and exports include a versioned schema.
  Complexity: L

- [ ] P2 — Add applies-to matrix and precise site matching
  Why: Site searches should show which scripts actually target the user's domain instead of relying only on keyword matches.
  Evidence: Userscript.Zone URL/domain modes; Greasy Fork by-site endpoint; existing roadmap `@match` matrix item.
  Touches: `index.html` metadata parser, site filter, result card detail, compare modal.
  Acceptance: result details show matched `@match`/`@include` patterns for the entered domain and distinguish source-provided applies-to data from locally parsed metadata.
  Complexity: L

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
