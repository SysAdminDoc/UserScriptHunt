# Roadmap

## P3

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


- [ ] P3 — Add source version-history and diff handoff links
  Why: Users deciding whether to install or update need a quick path to source history, but ScriptHunt should link to catalog/GitHub history instead of hosting script versions itself.
  Evidence: OpenUserJS#1023, Tampermonkey#2015, GitHub Search API docs; index.html:1438, index.html:1473, index.html:1573.
  Touches: index.html source normalizers/result cards/comparison modal, adapter fixtures, README source notes.
  Acceptance: result cards show source-history or diff links when a source provides a stable history/repository URL, omit them otherwise, and tests cover Greasy Fork, GitHub repository/code, and scrape-only fallback behavior.
  Complexity: M
