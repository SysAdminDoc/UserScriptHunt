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


### P2
- [ ] P2 — Add manager backup import preview adapters
  Why: Generic installed-list import is not enough for users migrating from real managers, where per-script includes/excludes and settings can be lost.
  Evidence: ScriptCat#1484, ScriptCat#1483, violentmonkey#2169; `index.html:985`, `README.md:235`.
  Touches: `index.html` import parser/preview UI, import/export schema, `tests/smoke.spec.js`, README import docs.
  Acceptance: imports recognize ScriptHunt JSON plus at least two manager-style backup shapes via fixtures, show a preview with valid/invalid/skipped counts before committing, preserve include/exclude/update metadata where present, and never import executable code into storage.
  Complexity: L



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


## Research-Driven Additions

### P2


### P3
- [ ] P3 — Add source version-history and diff handoff links
  Why: Users deciding whether to install or update need a quick path to source history, but ScriptHunt should link to catalog/GitHub history instead of hosting script versions itself.
  Evidence: OpenUserJS#1023, Tampermonkey#2015, GitHub Search API docs; index.html:1438, index.html:1473, index.html:1573.
  Touches: index.html source normalizers/result cards/comparison modal, adapter fixtures, README source notes.
  Acceptance: result cards show source-history or diff links when a source provides a stable history/repository URL, omit them otherwise, and tests cover Greasy Fork, GitHub repository/code, and scrape-only fallback behavior.
  Complexity: M

## Research-Driven Additions

### P2

- [ ] P2 - Add diagnostics snapshot replay fixtures
  Why: Source/proxy failures are currently copyable but not replayable, making reported failures harder to turn into deterministic regressions without secrets.
  Evidence: `index.html:3498`, `tests/adapter.spec.js:136`, Violentmonkey#2263, ScriptCat#1476.
  Touches: `index.html` diagnostics schema/sanitizer, `tests/smoke.spec.js`, `tests/fixtures/source-adapters.js`, README diagnostics notes.
  Acceptance: diagnostics exports include a schema version and sanitized replay section; a local fixture/test can load a diagnostics snapshot to recreate source status/rate-limit/proxy/cache states; tokens and custom proxy URLs remain redacted.
  Complexity: M
