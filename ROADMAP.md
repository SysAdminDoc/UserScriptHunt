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
